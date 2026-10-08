// Run with: node --experimental-strip-types tools/preview/pinned-scroll.test.mjs
import assert from "node:assert/strict";
import { animatePinnedScene, boundPinnedScroll } from "../../src/lib/pinnedScroll.ts";

let time = 0;
let frameId = 0;
const frames = new Map();
const events = new Map();
Object.defineProperty(globalThis, "performance", { value: { now: () => time }, configurable: true });
globalThis.window = {
  scrollY: 0,
  innerHeight: 200,
  addEventListener: (type, fn) => events.set(type, fn),
  removeEventListener: (type) => events.delete(type),
};
globalThis.requestAnimationFrame = (fn) => { frames.set(++frameId, fn); return frameId; };
globalThis.cancelAnimationFrame = (id) => frames.delete(id);
const track = {
  isConnected: true,
  dataset: {},
  firstElementChild: { clientHeight: 200 },
  getBoundingClientRect: () => ({ top: 400 - window.scrollY, height: 1200 }),
};
const painted = [];
const dispose = animatePinnedScene(track, (progress) => painted.push(progress), {
  checkpoints: [0, 1 / 3, 2 / 3, 1], minimumTravelMs: 2100,
  followThroughMs: 120, lookAhead: 0.22, holdMs: 60,
});
const advance = () => {
  time += 20;
  const pending = [...frames.values()];
  frames.clear();
  pending.forEach((fn) => fn(time));
};
const input = (delta) => {
  const result = boundPinnedScroll(window.scrollY, window.scrollY + delta, time);
  window.scrollY = result.target;
  events.get("scroll")?.();
};

// Huge wheel input lands at entry rather than skipping the entire track.
input(10000);
assert.equal(window.scrollY, 400);
const settled = new Set();
for (let tick = 0; tick < 1000 && window.scrollY <= 1400; tick++) {
  input(10000);
  advance();
  if (track.dataset.scenePhase === "holding") settled.add(Number(track.dataset.sceneProgress).toFixed(3));
  if (window.scrollY > 1400) assert(Number(track.dataset.sceneProgress) >= 0.999);
}
assert(window.scrollY > 1400, "Forward scrolling must eventually release");
assert(settled.has("0.333") && settled.has("0.667") && settled.has("1.000"), "Each checkpoint must settle");
assert(painted.every((value, index) => !index || Math.abs(value - painted[index - 1]) <= 20 / 2100 + 0.0005), "Progress exceeds its per-frame speed budget");
assert(time < 6000, "Normal-paced input should not require a long completion delay");
console.log(`PASS: huge forward input completes every checkpoint before release in ${time}ms.`);

// Reversal is available immediately, without waiting for a forward lock.
const reverse = new Set();
for (let tick = 0; tick < 1000 && window.scrollY >= 400; tick++) {
  input(-10000);
  advance();
  if (track.dataset.scenePhase === "holding") reverse.add(Number(track.dataset.sceneProgress).toFixed(3));
  if (window.scrollY < 400) assert(Number(track.dataset.sceneProgress) <= 0.001);
}
assert(window.scrollY < 400, "Reverse scrolling must eventually release");
assert(reverse.has("0.667") && reverse.has("0.333") && reverse.has("0.000"));
console.log("PASS: reversal completes the checkpoints in reverse order.");

window.scrollY = 400;
events.get("scroll")?.();
input(10000);
const stoppedAt = window.scrollY;
for (let tick = 0; tick < 200; tick++) advance();
assert.equal(window.scrollY, stoppedAt, "Queued input must not replay after scrolling stops");
dispose();
assert.equal(boundPinnedScroll(0, 10000, time).guarded, false, "Scene cleanup must not leave a scroll trap");
console.log("PASS: no backlog replay or stale scroll trap after cleanup.");
