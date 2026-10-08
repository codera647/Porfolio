/** Isolated headless Chrome for document QA and vector PDF export. */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function openBrowser() {
  const binary = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  ].find(existsSync);
  if (!binary) throw new Error("Install Chrome or Edge to export and check these documents.");
  const profile = await mkdtemp(path.join(tmpdir(), "portfolio-document-browser-"));
  const port = 9700 + Math.floor(Math.random() * 300);
  const child = spawn(binary, ["--headless=new", "--disable-gpu", "--no-first-run", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
  let socket;
  try {
    let targets;
    for (let attempt = 0; attempt < 150; attempt++) {
      try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); break; }
      catch { await sleep(200); }
    }
    if (!targets) throw new Error("Chrome startup timed out.");
    socket = new WebSocket(targets.find((target) => target.type === "page").webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.addEventListener("open", resolve); socket.addEventListener("error", reject); });
    let nextId = 0;
    const pending = new Map();
    const errors = [];
    socket.addEventListener("message", (event) => {
      const response = JSON.parse(event.data);
      if (response.method === "Runtime.exceptionThrown") errors.push(response.params.exceptionDetails.exception?.description || response.params.exceptionDetails.text);
      if (response.method === "Runtime.consoleAPICalled" && response.params.type === "error") {
        const message = response.params.args.map((arg) => arg.value ?? arg.description ?? "").join(" ");
        if (/hydrat|uncaught|error/i.test(message)) errors.push(message);
      }
      const task = pending.get(response.id);
      if (!task) return;
      clearTimeout(task.timer);
      pending.delete(response.id);
      response.error ? task.reject(new Error(JSON.stringify(response.error))) : task.resolve(response.result);
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 120000);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async (expression) => {
      const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
      return response.result.value;
    };
    const waitFor = async (expression, timeout = 120000) => {
      const started = Date.now();
      while (Date.now() - started < timeout) {
        if (await evaluate(`Boolean(${expression})`)) return;
        await sleep(200);
      }
      throw new Error(`Timed out waiting for: ${expression}`);
    };
    await send("Page.enable");
    await send("Runtime.enable");
    return { send, evaluate, waitFor, errors, close: () => { socket.close(); child.kill(); } };
  } catch (error) { socket?.close(); child.kill(); throw error; }
}
