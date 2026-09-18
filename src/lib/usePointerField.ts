"use client";

import { useEffect, useRef, type RefObject } from "react";

export type PointerField = {
  /** Pointer position in element-local pixels. */
  x: number;
  y: number;
  /** Element size, so consumers can work in fractions without re-measuring. */
  width: number;
  height: number;
  /** False when the pointer has left, or never arrived. */
  inside: boolean;
};

/**
 * Tracks the pointer inside `ref` and writes it to a ref object rather than
 * state, so moving the mouse never re-renders anything. Consumers read it from
 * their own animation frame and decide their own lag.
 *
 * Only a real pointing device drives it. Touch is ignored on purpose: the brief
 * asks for a static or very gentle ambient treatment there, and nothing in the
 * hero may require dragging a finger across the letters (s5.9, s5.10).
 */
export function usePointerField(ref: RefObject<HTMLElement | null>) {
  const field = useRef<PointerField>({
    x: 0, y: 0, width: 0, height: 0, inside: false,
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /* Layout box, never getBoundingClientRect: the card carries a perspective
       transform through its entrance, and a measured rect during that would
       report the rotated, scaled size. Anything resting at a fraction of the
       card - the glow at 62% / 43% - would then park in the wrong place and
       stay there, because no resize follows to correct it. */
    const measure = () => {
      field.current.width = el.clientWidth;
      field.current.height = el.clientHeight;
    };
    measure();

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      /* The rect is right for turning a client point into card space: by the
         time a pointer is being tracked the card is settled and untransformed. */
      const r = el.getBoundingClientRect();
      field.current.x = e.clientX - r.left;
      field.current.y = e.clientY - r.top;
      measure();
      field.current.inside = true;
    };
    const onLeave = () => {
      field.current.inside = false;
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });
    /* A pointer that leaves the window entirely still has to release the hero. */
    window.addEventListener("blur", onLeave);

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      ro.disconnect();
    };
  }, [ref]);

  return field;
}
