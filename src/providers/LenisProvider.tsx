"use client";

import Lenis from "lenis";
import { useEffect, useLayoutEffect, useRef, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { boundPinnedScroll } from "@/lib/pinnedScroll";

interface Props {
  children: ReactNode;
}

/**
 * Global smooth-scroll provider.
 *
 * Lenis replaces the browser's native scroll with a spring-physics model that
 * gives the whole site smooth scrolling.
 *
 * Reduced-motion: when the user prefers reduced motion, we initialise Lenis with
 * lerp: 1 (no smoothing).
 */
export function LenisProvider({ children }: Props) {
  const rafRef = useRef<number | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useLayoutEffect(() => {
    // Reset before paint, not via CSS smooth scrolling from the old page's bottom.
    if (!pathname.startsWith("/projects/")) return;
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.resize();
      lenis.scrollTo(0, { immediate: true, force: true });
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [pathname]);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const lenis: Lenis = new Lenis({
      lerp: prefersReduced ? 1 : 0.1,
      smoothWheel: !prefersReduced,
      syncTouch: !prefersReduced,
      touchMultiplier: 1,
      anchors: true,
      stopInertiaOnNavigate: true,
      virtualScroll: ({ deltaY, event }) => {
        if (prefersReduced || !deltaY || event.ctrlKey || event.shiftKey
          || lenis.isStopped || document.querySelector("dialog[open]")
          || event.composedPath().some((node) => node instanceof HTMLElement && node.hasAttribute("data-lenis-prevent"))) return true;
        const result = boundPinnedScroll(lenis.targetScroll, lenis.targetScroll + deltaY, performance.now());
        if (!result.guarded) return true;
        // Even a zero delta must prevent native scrolling at a checkpoint.
        if (event.cancelable) event.preventDefault();
        if (event.type !== "touchend") {
          lenis.scrollTo(result.target, { programmatic: false, lerp: 0.1 });
        }
        return false;
      },
    });
    lenisRef.current = lenis;

    const onKeyDown = (event: KeyboardEvent) => {
      if (prefersReduced || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey
        || lenis.isStopped || document.querySelector("dialog[open]")) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button, a, [contenteditable], [data-lenis-prevent]")) return;
      const delta = event.key === "ArrowDown" ? 80 : event.key === "ArrowUp" ? -80
        : event.key === "PageDown" ? window.innerHeight * 0.9
        : event.key === "PageUp" ? -window.innerHeight * 0.9
        : event.key === " " ? window.innerHeight * (event.shiftKey ? -0.9 : 0.9) : 0;
      if (!delta) return;
      const result = boundPinnedScroll(lenis.targetScroll, lenis.targetScroll + delta, performance.now());
      if (!result.guarded) return;
      event.preventDefault();
      lenis.scrollTo(result.target, { programmatic: false });
    };
    window.addEventListener("keydown", onKeyDown);

    function raf(time: number) {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    }
    rafRef.current = requestAnimationFrame(raf);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      lenis.destroy();
      lenisRef.current = null;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return <>{children}</>;
}

export default LenisProvider;
