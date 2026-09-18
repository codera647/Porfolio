"use client";

import Lenis from "lenis";
import { useEffect, useRef, ReactNode } from "react";

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

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const lenis = new Lenis({
      lerp: prefersReduced ? 1 : 0.1,
      smoothWheel: true,
      touchMultiplier: 0,
    });

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
    };
  }, []);

  return <>{children}</>;
}

export default LenisProvider;
