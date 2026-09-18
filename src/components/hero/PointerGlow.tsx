"use client";

import { useEffect, useRef, type RefObject } from "react";
import { approach, glow } from "@/lib/heroMotion";
import type { PointerField } from "@/lib/usePointerField";
import { useReducedMotion } from "@/lib/useReducedMotion";
import styles from "./PointerGlow.module.css";

type Props = {
  field: RefObject<PointerField>;
  /** The glow increases gently as the card settles (s5.7). */
  intensity: number;
};

export function PointerGlow({ field, intensity }: Props) {
  const reduced = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLDivElement>(null);
  const secondaryRef = useRef<HTMLDivElement>(null);
  const tailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const p = primaryRef.current;
    const s = secondaryRef.current;
    const t = tailRef.current;
    if (!host || !p || !s || !t) return;

    const place = (el: HTMLElement, x: number, y: number) => {
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    };

    const restOf = () => {
      const f = field.current;
      const w = f.width || host.clientWidth;
      const h = f.height || host.clientHeight;
      return { x: w * glow.restX, y: h * glow.restY, w, h };
    };

    if (reduced) {
      /* Reduced motion freezes the field at its resting position (s5.9). */
      const r = restOf();
      place(p, r.x, r.y);
      place(s, r.x + glow.secondaryOffset.x, r.y + glow.secondaryOffset.y);
      place(t, r.x - 40, r.y + 30);
      return;
    }

    const r0 = restOf();
    let px = r0.x;
    let py = r0.y;
    let sx = r0.x + glow.secondaryOffset.x;
    let sy = r0.y + glow.secondaryOffset.y;
    let raf = 0;
    let last = performance.now();
    const born = last;

    const frame = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      const f = field.current;
      const rest = restOf();

      let tx: number;
      let ty: number;
      let lagP: number = glow.primaryLagMs;
      let lagS: number = glow.secondaryLagMs;

      if (f.inside) {
        tx = f.x;
        ty = f.y;
      } else {
        /* At rest, a very faint glow near 62% / 43% with a slow drift, and a
           gentle return of 800-1200ms after the pointer leaves (s5.9). */
        const phase = ((now - born) / 1000 / glow.driftSeconds) * Math.PI * 2;
        tx = rest.x + Math.cos(phase) * glow.driftPx;
        ty = rest.y + Math.sin(phase * 0.8) * glow.driftPx * 0.55;
        lagP = glow.returnMs;
        lagS = glow.returnMs * 1.2;
      }

      px = approach(px, tx, lagP, dt);
      py = approach(py, ty, lagP, dt);
      sx = approach(sx, tx + glow.secondaryOffset.x, lagS, dt);
      sy = approach(sy, ty + glow.secondaryOffset.y, lagS, dt);

      place(p, px, py);
      place(s, sx, sy);
      place(t, sx - 40, sy + 30);

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [field, reduced]);

  return (
    <div
      ref={hostRef}
      className={styles.field}
      /* Atmosphere, never reading content (s5.12). */
      aria-hidden="true"
      style={{ opacity: intensity }}
    >
      <div ref={tailRef} className={`${styles.blob} ${styles.tail}`} />
      <div ref={secondaryRef} className={`${styles.blob} ${styles.secondary}`} />
      <div ref={primaryRef} className={`${styles.blob} ${styles.primary}`} />
    </div>
  );
}

export default PointerGlow;
