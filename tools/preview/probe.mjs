/**
 * Evaluate an expression in a running page after a real delay, over CDP.
 *
 *   node tools/preview/probe.mjs --url http://localhost:3000 --at 4000 \
 *        --expr "document.querySelector('x').outerHTML"
 *
 * Companion to shoot.mjs, for when a screenshot cannot tell you why something
 * looks wrong. Same reason for using CDP: virtual time lies about anything
 * driven by requestAnimationFrame.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const CHROME_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
];

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = process.argv[i + 1];
  return next && !next.startsWith("--") ? next : true;
}

const url = arg("url", "http://localhost:3000");
const at = Number(arg("at", 3000));
const expr = String(arg("expr", "document.title"));
/* JS evaluated before any page script on every document, so state the page
   reads at startup - sessionStorage for the intro gate - can be set up. */
const init = arg("init", "");
/* Real key presses before evaluating, e.g. --keys "Tab,Tab,Tab". Programmatic
   .focus() does not reliably raise :focus-visible, so keyboard reachability and
   focus rings have to be driven the way a person would drive them. */
const keys = String(arg("keys", "")).split(",").filter(Boolean);
const [width, height] = String(arg("size", "1440x900")).split("x").map(Number);
const moves = String(arg("move", ""))
  .split(",,")
  .filter(Boolean)
  .map((m) => {
    const [xy, t] = m.split("@");
    const [x, y] = xy.split(",").map(Number);
    return { x, y, t: Number(t) };
  });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForEndpoint(port, tries = 100) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await sleep(100);
  }
  throw new Error("Chrome did not expose a debugging endpoint.");
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    }
  });
  const ready = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", reject);
  });
  return {
    ready,
    send(method, params = {}) {
      const n = ++id;
      return new Promise((resolve, reject) => {
        pending.set(n, { resolve, reject });
        ws.send(JSON.stringify({ id: n, method, params }));
      });
    },
    close: () => ws.close(),
  };
}

const chromePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chromePath) throw new Error("No Chrome or Edge binary found.");
const port = 9700 + Math.floor(Math.random() * 200);
const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  `--remote-debugging-port=${port}`,
  `--window-size=${width},${height}`,
  "--force-device-scale-factor=1",
  "--no-first-run",
  "--user-data-dir=" + path.join(process.env.TEMP || ".", `cdp-${port}`),
  "about:blank",
], { stdio: "ignore" });

try {
  await waitForEndpoint(port);
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const cdp = connect(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await cdp.ready;
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width, height, deviceScaleFactor: 1, mobile: false,
  });
  if (init && init !== true) {
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: String(init) });
  }
  const started = Date.now();
  await cdp.send("Page.navigate", { url });

  for (const m of moves.sort((a, b) => a.t - b.t)) {
    const wait = m.t - (Date.now() - started);
    if (wait > 0) await sleep(wait);
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseMoved", x: m.x, y: m.y, buttons: 0,
    });
  }
  const wait = at - (Date.now() - started);
  if (wait > 0) await sleep(wait);

  const KEY_CODES = { Tab: 9, Enter: 13, Escape: 27, " ": 32 };
  for (const key of keys) {
    const code = KEY_CODES[key] ?? key.charCodeAt(0);
    for (const type of ["rawKeyDown", "keyUp"]) {
      await cdp.send("Input.dispatchKeyEvent", {
        type, key, code: key === " " ? "Space" : key,
        windowsVirtualKeyCode: code, nativeVirtualKeyCode: code,
      });
    }
    await sleep(60);
  }

  const { result, exceptionDetails } = await cdp.send("Runtime.evaluate", {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    console.error("ERROR", JSON.stringify(exceptionDetails.exception?.description ?? exceptionDetails));
  } else {
    console.log(typeof result.value === "string" ? result.value : JSON.stringify(result.value, null, 2));
  }
  cdp.close();
} finally {
  chrome.kill();
}
