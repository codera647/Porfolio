"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

/**
 * True when the visitor asked for reduced motion.
 *
 * Renders `true` on the server and on the first client pass, so the static
 * state is what ships in the HTML and motion is opted into after hydration.
 * That way a reduced motion visitor never catches a frame of animation, and the
 * static design stands on its own as the brief requires (s5.12).
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
