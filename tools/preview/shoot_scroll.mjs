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

function findChrome() {
  const found = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!found) throw new Error("No Chrome or Edge binary found.");
  return found;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForEndpoint(port) {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch {}
    await sleep(50);
  }
  throw new Error("Chrome did not start listening in time.");
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

const width = 1440;
const height = 900;
const port = 9500 + Math.floor(Math.random() * 400);

const chrome = spawn(findChrome(), [
  "--headless=new",
  "--disable-gpu",
  `--remote-debugging-port=${port}`,
  `--window-size=${width},${height}`,
  "--force-device-scale-factor=1",
  "--no-first-run",
  "--no-default-browser-check",
  "--user-data-dir=" + path.join(process.env.TEMP || ".", `cdp-${port}`),
  "about:blank",
], { stdio: "ignore" });

try {
  await waitForEndpoint(port);
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((t) => t.type === "page");
  const cdp = connect(page.webSocketDebuggerUrl);
  await cdp.ready;

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width, height, deviceScaleFactor: 1, mobile: false,
  });

  await cdp.send("Page.navigate", { url: "http://localhost:3000?intro=0" });
  await sleep(1500);

  await mkdir(".preview", { recursive: true });

  // 1. Scroll into Philosophy section initial state (card centered & blurred)
  await cdp.send("Runtime.evaluate", {
    expression: `window.scrollTo({ top: 950, behavior: 'instant' });`
  });
  await sleep(600);
  const shot1 = await cdp.send("Page.captureScreenshot", { format: "png" });
  await writeFile(".preview/philosophy-stage-initial.png", Buffer.from(shot1.data, "base64"));
  console.log("Captured .preview/philosophy-stage-initial.png");

  // 2. Scroll midway through expansion
  await cdp.send("Runtime.evaluate", {
    expression: `window.scrollTo({ top: 1600, behavior: 'instant' });`
  });
  await sleep(600);
  const shot2 = await cdp.send("Page.captureScreenshot", { format: "png" });
  await writeFile(".preview/philosophy-stage-expanding.png", Buffer.from(shot2.data, "base64"));
  console.log("Captured .preview/philosophy-stage-expanding.png");

  // 3. Scroll to full expansion & statement overlay
  await cdp.send("Runtime.evaluate", {
    expression: `window.scrollTo({ top: 2400, behavior: 'instant' });`
  });
  await sleep(600);
  const shot3 = await cdp.send("Page.captureScreenshot", { format: "png" });
  await writeFile(".preview/philosophy-stage-expanded.png", Buffer.from(shot3.data, "base64"));
  console.log("Captured .preview/philosophy-stage-expanded.png");

  cdp.close();
} finally {
  chrome.kill("SIGKILL");
}

