/** Regression checks using real Chrome wheel input and real animation frames.
 * node tools/preview/check-scenes.mjs [http://localhost:3000]
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import assert from "node:assert/strict";

const base = process.argv[2] || "http://localhost:3000";
const chromePath = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(existsSync);
assert(chromePath, "Chrome or Edge is required");
const dir = await mkdtemp(path.join(tmpdir(), "portfolio-scroll-qa-"));
const port = 9400 + Math.floor(Math.random() * 300);
const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, `--user-data-dir=${path.join(dir, "profile")}`, "--no-first-run", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let ws;
try {
  let targets;
  for (let attempt = 0; attempt < 150; attempt++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); break; } catch { await sleep(200); }
  }
  assert(targets, "Chrome startup timed out");
  ws = new WebSocket(targets.find((target) => target.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve));
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const response = JSON.parse(event.data);
    const task = pending.get(response.id);
    if (!task) return;
    pending.delete(response.id);
    response.error ? task.reject(response.error) : task.resolve(response.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const request = ++id;
    pending.set(request, { resolve, reject });
    ws.send(JSON.stringify({ id: request, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || "Evaluation failed");
    return result.result.value;
  };
  const waitFor = async (expression, timeout = 60000) => {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      if (await evaluate(expression)) return;
      await sleep(200);
    }
    throw new Error(`Timed out waiting for ${expression}`);
  };
  const viewport = (width, height) => send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  const shot = async (label) => {
    const { data } = await send("Page.captureScreenshot", { format: "png" });
    await writeFile(path.join(dir, `${label}.png`), Buffer.from(data, "base64"));
  };
  await send("Page.enable");
  await viewport(1366, 600);
  await send("Page.navigate", { url: `${base}/?intro=0` });
  await waitFor("document.querySelectorAll('[data-scroll-scene]').length === 3");
  await evaluate("document.fonts.ready.then(()=>true)");
  console.log("Ready: three registered scenes at 1366 × 600.");

  await evaluate(`window.__sceneChecks = [];
    window.__sceneDone = false;
    const tracks = [...document.querySelectorAll('[data-scroll-scene]')];
    const completed = new Set();
    function inspect() {
      for (const track of tracks) {
        const rect = track.getBoundingClientRect();
        const released = rect.top < -(rect.height - track.firstElementChild.clientHeight) - 4;
        if (released && !completed.has(track)) {
          const progress = Number(track.dataset.sceneProgress);
          window.__sceneChecks.push({section:track.closest('section').id, progress});
          completed.add(track);
        }
      }
      if (completed.size === 3) window.__sceneDone = true;
      else requestAnimationFrame(inspect);
    }
    requestAnimationFrame(inspect);`);
  const observedRoles = new Set();
  const observedShip = new Set();
  const started = Date.now();
  while (Date.now() - started < 120000 && !await evaluate("window.__sceneDone")) {
    await send("Input.dispatchMouseEvent", { type: "mouseWheel", x: 500, y: 300, deltaX: 0, deltaY: 12000 });
    await sleep(70);
    const sample = await evaluate(`({role:document.querySelector('#experience [aria-label="5 experience entries"] > span')?.textContent,
      ship:[...document.querySelectorAll('#what-i-help-you-ship article')].map(c=>parseFloat(c.style.getPropertyValue('--card-y'))),
      active: [...document.querySelectorAll('[data-scroll-scene]')].find(t=>t.getBoundingClientRect().top<=1&&t.getBoundingClientRect().bottom>=innerHeight)?.closest('section').id})`);
    if (sample.active === "experience") observedRoles.add(sample.role);
    if (sample.active === "what-i-help-you-ship") sample.ship.forEach((y, index) => { if (Math.abs(y) < 1) observedShip.add(index + 1); });
  }
  const completions = await evaluate("window.__sceneChecks");
  const finalState = await evaluate(`({y:scrollY,scenes:[...document.querySelectorAll('[data-scroll-scene]')].map(t=>({id:t.closest('section').id,progress:t.dataset.sceneProgress,phase:t.dataset.scenePhase,top:t.getBoundingClientRect().top}))})`);
  assert.equal(completions.length, 3, `All scenes must release without trapping scrolling: ${JSON.stringify(finalState)}`);
  assert(completions.every((scene) => scene.progress >= 0.999), "A scene released before its animation completed");
  assert.deepEqual([...observedRoles].sort(), ["01", "02", "03", "04", "05"], "An experience card was skipped");
  assert.deepEqual([...observedShip].sort(), [1, 2, 3, 4], "A shipping card was skipped");
  console.log("PASS rapid wheel input:", JSON.stringify(completions), "all 4 shipping cards and 5 roles observed.");

  // Check all card contents, not just the active short title, across viewport sizes.
  await sleep(2000); // Let the final unguarded Lenis wheel target finish first.
  for (const [width, height] of [[1366, 600], [1536, 650], [1920, 720], [1280, 800], [390, 640]]) {
    await viewport(width, height);
    await sleep(200);
    await evaluate(`{ const t=document.querySelector('#experience [data-scroll-scene]');const rect=t.getBoundingClientRect();window.scrollTo({top:scrollY+rect.top+(rect.height-t.firstElementChild.clientHeight)*0.5,behavior:'instant'}); }`);
    await waitFor(`(()=>{const t=document.querySelector('#experience [data-scroll-scene]');const r=t.getBoundingClientRect();return Math.abs(r.top+(r.height-t.firstElementChild.clientHeight)*0.5)<2 && Math.abs(Number(t.dataset.sceneProgress)-0.5)<0.001;})()`);
    const layout = await evaluate(`(()=>{const s=document.querySelector('#experience');const progress=s.querySelector('[class*="progressSegment"]').getBoundingClientRect().top;return [...s.querySelectorAll('article')].map(c=>({role:c.querySelector('h3').textContent, gap:progress-c.getBoundingClientRect().bottom, overflow:c.querySelector('[class*="cardContent"]').scrollHeight-c.querySelector('[class*="cardContent"]').clientHeight}));})()`);
    assert(layout.every((card) => card.gap > 10), `Progress overlaps a card at ${width} × ${height}: ${JSON.stringify(layout)}`);
    assert(layout.every((card) => card.overflow <= 2), `Card text clips at ${width} × ${height}: ${JSON.stringify(layout)}`);
    await shot(`experience-${width}x${height}`);
    console.log(`PASS experience layout ${width} × ${height}:`, JSON.stringify(layout.map((card) => ({ role: card.role, gap: Math.round(card.gap) }))));
  }

  // Route changes must reset before the new page's first rendered frames.
  await viewport(1366, 600);
  await evaluate(`window.scrollTo({top:document.querySelector('#projects').offsetTop,behavior:'instant'});
    window.__routeFrames=[];
    function inspectRoute(){const title=document.querySelector('h1')?.textContent;if(title==='Synapse'||title==='AutoBG')window.__routeFrames.push({title,y:scrollY});if(window.__routeFrames.length<100)requestAnimationFrame(inspectRoute);}
    requestAnimationFrame(inspectRoute);`);
  await sleep(250);
  await evaluate("document.querySelector('#projects a[href=\"/projects/synapse\"]').click()");
  await waitFor("document.querySelector('h1')?.textContent === 'Synapse'");
  await sleep(1000);
  const synapseFrames = await evaluate("window.__routeFrames.filter(f=>f.title==='Synapse')");
  assert(synapseFrames.length && synapseFrames.every((frame) => frame.y <= 1), `Synapse scrolls up on entry: ${JSON.stringify(synapseFrames)}`);
  console.log("PASS Synapse opens at the top without scrolling upward.");
  await evaluate("window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'})");
  await sleep(300);
  await evaluate("document.querySelector('footer a[href=\"/projects/autobg\"]').click()");
  await waitFor("document.querySelector('h1')?.textContent === 'AutoBG'");
  await sleep(800);
  assert(await evaluate("scrollY <= 1"), "Next project opened scrolled down");
  console.log("PASS next-project navigation opens AutoBG at the top.");
  console.log(`Screenshots: ${dir}`);
} finally {
  ws?.close();
  chrome.kill();
}
