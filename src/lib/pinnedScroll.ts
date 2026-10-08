/** Shared animation/input clock for the homepage scroll scenes. */
type SceneOptions = {
  checkpoints: readonly number[];
  minimumTravelMs: number;
  followThroughMs: number;
  lookAhead: number;
  holdMs?: number;
  measure?: () => void;
  /** Natural-flow timelines use node positions instead of a sticky stage. */
  getBounds?: () => { start: number; end: number };
  /**
   * Render straight from the (already Lenis-smoothed) scroll position instead
   * of easing toward it. Required for content that scrolls with the page: a
   * second easing layer lags the moving page and makes the drawn line wobble.
   */
  scrollLinked?: boolean;
};

type Scene = {
  track: HTMLElement;
  progress: number;
  target: number;
  options: SceneOptions;
  direction: number;
  stopIndex: number;
  settledAt: number | null;
  /** Scroll distance in px; lets settlement tolerate sub-pixel scroll rounding. */
  distance: number;
  sync: () => void;
};

const scenes = new Set<Scene>();
const EPSILON = 0.0005;
const clamp = (value: number) => Math.min(1, Math.max(0, value));

function bounds(scene: Scene) {
  if (scene.options.getBounds) {
    const { start, end } = scene.options.getBounds();
    return { start, end, distance: Math.max(1, end - start) };
  }
  const rect = scene.track.getBoundingClientRect();
  const stage = scene.track.firstElementChild as HTMLElement | null;
  const start = window.scrollY + rect.top;
  const distance = Math.max(1, rect.height - (stage?.clientHeight ?? window.innerHeight));
  return { start, end: start + distance, distance };
}

function updateSettlement(scene: Scene, now: number) {
  const stop = scene.options.checkpoints[scene.stopIndex];
  // Scroll-linked progress comes from rounded scroll positions; never miss a
  // stop by a fraction of a pixel. Eased scenes converge on the stop exactly.
  const tolerance = scene.options.scrollLinked ? Math.max(EPSILON, 1.5 / scene.distance) : EPSILON;
  const settled = scene.direction !== 0
    && Math.abs(scene.progress - stop) <= tolerance
    && Math.abs(scene.target - scene.progress) <= tolerance;
  scene.settledAt = settled ? (scene.settledAt ?? now) : null;
  scene.track.dataset.sceneProgress = scene.progress.toFixed(4);
  const terminal = scene.direction > 0
    ? scene.stopIndex === scene.options.checkpoints.length - 1
    : scene.stopIndex === 0;
  // Same-frame scroll syncing can run after the guard releases a scene.
  // Do not turn a completed terminal checkpoint back into a hold each frame.
  scene.track.dataset.scenePhase = settled
    ? (terminal && scene.track.dataset.scenePhase === "complete" ? "complete" : "holding")
    : "moving";
}

/**
 * Bound input, not the browser position: Lenis can ease to this target normally.
 * Large deltas cannot queue several scenes/cards ahead of their rendered state.
 * There is no backlog replay; advancing after a hold needs further input.
 * Explicit anchors, scrollbar dragging, and Home/End remain available.
 */
export function boundPinnedScroll(from: number, requested: number, now: number) {
  const direction = Math.sign(requested - from);
  if (!direction) return { target: requested, guarded: false };
  const ordered = [...scenes]
    .filter((scene) => scene.track.isConnected)
    .map((scene) => ({ scene, ...bounds(scene) }))
    .sort((a, b) => direction * (a.start - b.start));

  for (const { scene, start, end, distance } of ordered) {
    if (direction > 0 ? (from > end + 1 || requested < start) : (from < start - 1 || requested > end)) continue;

    // A fling arriving from outside first lands at the scene entrance.
    if (direction > 0 && from < start - 1) return { target: start, guarded: true };
    if (direction < 0 && from > end + 1) return { target: end, guarded: true };

    const stops = scene.options.checkpoints;
    if (scene.direction !== direction) {
      scene.direction = direction;
      scene.settledAt = null;
      if (direction > 0) {
        const next = stops.findIndex((stop) => stop > scene.progress + EPSILON);
        scene.stopIndex = next < 0 ? stops.length - 1 : next;
      } else {
        scene.stopIndex = 0;
        for (let index = stops.length - 1; index >= 0; index--) {
          if (stops[index] < scene.progress - EPSILON) {
            scene.stopIndex = index;
            break;
          }
        }
      }
      updateSettlement(scene, now);
    }

    const atEnd = direction > 0 ? scene.stopIndex === stops.length - 1 : scene.stopIndex === 0;
    // Completion is still required, but do not add a long pause before release.
    const holdMs = scene.options.holdMs ?? 120;
    if (scene.settledAt !== null && now - scene.settledAt >= holdMs) {
      if (atEnd) {
        scene.track.dataset.scenePhase = "complete";
        continue;
      }
      scene.stopIndex += direction;
      scene.settledAt = null;
    }

    const stop = stops[scene.stopIndex];
    const allowed = direction > 0
      ? Math.min(stop, scene.progress + scene.options.lookAhead)
      : Math.max(stop, scene.progress - scene.options.lookAhead);
    const boundary = start + allowed * distance;
    return {
      target: direction > 0 ? Math.max(from, Math.min(requested, boundary)) : Math.min(from, Math.max(requested, boundary)),
      guarded: true,
    };
  }
  return { target: requested, guarded: false };
}

/**
 * Paint scroll-linked scenes in the same frame Lenis moved the page. Calling it
 * from Lenis' own `scroll` callback avoids the one-frame lag of waiting for the
 * browser's scroll event, which otherwise shows up as a faint line shimmer.
 */
export function syncPinnedScenes() {
  scenes.forEach((scene) => { if (scene.options.scrollLinked) scene.sync(); });
}

export function animatePinnedScene(
  track: HTMLElement,
  render: (progress: number) => void,
  options: SceneOptions,
) {
  let frame: number | null = null;
  let previousTime = performance.now();
  let lastPainted = Number.NaN;
  const scene: Scene = {
    track, progress: 0, target: 0, options, direction: 0, stopIndex: 0, settledAt: null,
    distance: 1, sync: () => {},
  };
  const measureProgress = () => {
    const { start, distance } = bounds(scene);
    scene.distance = distance;
    return clamp((window.scrollY - start) / distance);
  };
  const paint = (time: number) => {
    // Skip redundant style writes; settlement still needs the timestamp.
    if (scene.progress !== lastPainted) {
      lastPainted = scene.progress;
      render(scene.progress);
    }
    updateSettlement(scene, time);
  };
  const tick = (time: number) => {
    const elapsed = Math.max(0, Math.min(64, time - previousTime));
    previousTime = time;
    const gap = scene.target - scene.progress;
    const damped = gap * (1 - Math.exp(-elapsed / options.followThroughMs));
    const maxStep = elapsed / options.minimumTravelMs;
    scene.progress += Math.sign(damped) * Math.min(Math.abs(damped), maxStep);
    if (Math.abs(scene.target - scene.progress) < EPSILON) scene.progress = scene.target;
    paint(time);
    frame = scene.progress === scene.target ? null : requestAnimationFrame(tick);
  };
  scene.sync = () => {
    scene.progress = scene.target = measureProgress();
    paint(performance.now());
  };
  const requestRender = () => {
    if (options.scrollLinked) {
      scene.sync();
      return;
    }
    scene.target = measureProgress();
    if (frame === null) {
      previousTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };
  const resize = () => {
    options.measure?.();
    scene.progress = scene.target = measureProgress();
    // A natural-flow timeline keeps the current checkpoint when measurements
    // refresh; mobile browser chrome must not restart its guard mid-scroll.
    if (!options.scrollLinked) {
      scene.direction = 0;
      scene.settledAt = null;
    }
    lastPainted = Number.NaN;
    paint(performance.now());
  };

  options.measure?.();
  scene.progress = scene.target = measureProgress();
  paint(performance.now());
  scenes.add(scene);
  track.dataset.scrollScene = "";
  window.addEventListener("scroll", requestRender, { passive: true });
  window.addEventListener("resize", resize, { passive: true });
  const dispose = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    scenes.delete(scene);
    delete track.dataset.scrollScene;
    delete track.dataset.sceneProgress;
    delete track.dataset.scenePhase;
    window.removeEventListener("scroll", requestRender);
    window.removeEventListener("resize", resize);
  };
  return Object.assign(dispose, { refresh: resize });
}
