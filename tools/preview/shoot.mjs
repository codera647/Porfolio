/**
 * Screenshot a running page at real wall-clock times, over the Chrome DevTools
 * Protocol.
 *
 *   node tools/preview/shoot.mjs --url http://localhost:3000 \
 *        --out .preview --at 0,500,3000 --size 1440x900 [--reduced] \
 *        [--move 720,450@2000]
 *
 * Chrome's --virtual-time-budget is not usable here. It drives CSS animations
 * but not JavaScript animation loops in step with timers, so a page using
 * requestAnimationFrame (framer-motion, the hero's pointer field) screenshots
 * in states it never actually reaches. Everything this writes is real time.
 *
 * --move x,y@t dispatches a real mouse move at t ms, for pointer driven states.
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
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
const outDir = arg("out", ".preview");
const at = String(arg("at", "3000")).split(",").map(Number).sort((a, b) => a - b);
const [width, height] = String(arg("size", "1440x900")).split("x").map(Number);
const reduced = Boolean(arg("reduced", false));
const label = arg("label", "shot");
/* Extra CSS injected before navigation. Used to isolate layers for
   measurement, e.g. hiding the name to sample the background beneath it. */
const extraCss = arg("css", "");
/* JS evaluated before any page script on every document, for state the page
   reads at startup - e.g. sessionStorage, to shoot the repeat visit path. */
const init = arg("init", "");
const moves = String(arg("move", ""))
  .split(",,")
  .filter(Boolean)
  .map((m) => {
    const [xy, t] = m.split("@");
    const [x, y] = xy.split(",").map(Number);
    return { x, y, t: Number(t) };
  });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  const found = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!found) throw new Error("No Chrome or Edge binary found.");
  return found;
}

async function waitForEndpoint(port, tries = 100) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) return await r.json();
    } catch {
      /* not up yet */
    }
    await sleep(100);
  }
  throw new Error("Chrome did not expose a debugging endpoint.");
}

/** Minimal CDP client over the built-in WebSocket. */
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

const port = 9300 + Math.floor(Math.random() * 400);
const chrome = spawn(findChrome(), [
  "--headless=new",
  "--disable-gpu",
  `--remote-debugging-port=${port}`,
  `--window-size=${width},${height}`,
  "--force-device-scale-factor=1",
  "--no-first-run",
  "--no-default-browser-check",
  "--user-data-dir=" + path.join(process.env.TEMP || ".", `cdp-${port}`),
  ...(reduced ? ["--force-prefers-reduced-motion"] : []),
  "about:blank",
], { stdio: "ignore" });

try {
  await waitForEndpoint(port);
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((t) => t.type === "page");
  const cdp = connect(page.webSocketDebuggerUrl);
  await cdp.ready;

  await cdp.send("Page.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width, height, deviceScaleFactor: 1, mobile: width < 600,
  });
  if (init && init !== true) {
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: String(init) });
  }
  if (extraCss && extraCss !== true) {
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `document.addEventListener('DOMContentLoaded', () => {
        const s = document.createElement('style');
        s.textContent = ${JSON.stringify(extraCss)};
        document.head.appendChild(s);
      });`,
    });
  }

  await mkdir(outDir, { recursive: true });
  const started = Date.now();
  await cdp.send("Page.navigate", { url });

  const timeline = [
    ...moves.map((m) => ({ ...m, kind: "move" })),
    ...at.map((t) => ({ t, kind: "shot" })),
  ].sort((a, b) => a.t - b.t);

  for (const step of timeline) {
    const wait = step.t - (Date.now() - started);
    if (wait > 0) await sleep(wait);
    if (step.kind === "move") {
      await cdp.send("Input.dispatchMouseEvent", {
        type: "mouseMoved", x: step.x, y: step.y, buttons: 0,
      });
      continue;
    }
    const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
    const file = path.join(outDir, `${label}-${String(step.t).padStart(5, "0")}ms.png`);
    await writeFile(file, Buffer.from(data, "base64"));
    console.log(`${String(step.t).padStart(6)}ms  ${file}`);
  }
  cdp.close();
} finally {
  chrome.kill();
}
