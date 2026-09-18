"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { approach, falloff, nameResponse } from "@/lib/heroMotion";
import type { PointerField } from "@/lib/usePointerField";
import { useReducedMotion } from "@/lib/useReducedMotion";
import styles from "./HeroName.module.css";

const NAME = "ABDUL MOIZ";
const WORDS = NAME.split(" ");

type Props = {
  field: RefObject<PointerField>;
  /** True once the entrance has run, or immediately when it is skipped. */
  revealed: boolean;
  /** Skips the per letter entrance entirely. */
  immediate: boolean;
};

export function HeroName({ field, revealed, immediate }: Props) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLHeadingElement>(null);
  const glyphRefs = useRef<HTMLSpanElement[]>([]);

  const glyphs = useMemo(() => {
    let index = 0;
    return WORDS.map((word) => ({
      word,
      letters: [...word].map((ch) => ({ ch, index: index++ })),
    }));
  }, []);

  useEffect(() => {
    if (reduced) return;
    const nodes = glyphRefs.current.filter(Boolean);
    if (!nodes.length) return;

    /* Per glyph state, eased toward its target every frame. Centres are
       re-measured on resize only; they cannot move otherwise, because nothing
       in here changes layout. */
    const weights: number[] = nodes.map(() => nameResponse.weightRest);
    const scales: number[] = nodes.map(() => nameResponse.scaleRest);
    /* Glyph centres and the name's offset within the card, both in card space,
       so the frame loop is pure arithmetic with no layout reads. */
    let centres: { x: number; y: number }[] = [];

    /* Layout offsets rather than measured rects. The card carries a perspective
       transform through its entrance, and a rect taken during it would report
       glyph centres in rotated, scaled space - they would then sit far from
       where the pointer actually is, and nothing would re-measure to fix it,
       because no layout size ever changes. offsetLeft/offsetTop are immune. */
    const offsetWithin = (el: HTMLElement, ancestor: HTMLElement | null) => {
      let x = 0;
      let y = 0;
      let node: HTMLElement | null = el;
      while (node && node !== ancestor) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      return { x, y };
    };

    const measure = () => {
      const host = rootRef.current;
      if (!host) return;
      const card = host.closest("[data-hero-card]") as HTMLElement | null;
      centres = nodes.map((n) => {
        const o = offsetWithin(n, card);
        return { x: o.x + n.offsetWidth / 2, y: o.y + n.offsetHeight / 2 };
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (rootRef.current) ro.observe(rootRef.current);

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;

      /* Both the pointer and the glyph centres are already in card space. */
      const f = field.current;
      const px = f.x;
      const py = f.y;
      const active = f.inside;

      for (let i = 0; i < nodes.length; i++) {
        let targetW: number = nameResponse.weightRest;
        let targetS: number = nameResponse.scaleRest;

        if (active && centres[i]) {
          const d = Math.hypot(px - centres[i].x, py - centres[i].y);
          /* One curve for the whole wave rather than separate rules for the
             nearest letter and its neighbours: the emphasis stays continuous as
             the pointer slides between letters, with no step where one rule
             hands over to the other. The curve is shaped so a neighbour at one
             glyph advance lands on the weight the brief asks for. */
          const t = falloff(d, nameResponse.radius);
          targetW =
            nameResponse.weightRest +
            (nameResponse.weightPeak - nameResponse.weightRest) * t;
          targetS =
            nameResponse.scaleRest +
            (nameResponse.scalePeak - nameResponse.scaleRest) * t;
        }

        /* Faster toward the target than away from it (s5.8). */
        const rising = targetW > weights[i];
        const lag = rising ? nameResponse.attackMs : nameResponse.releaseMs;
        weights[i] = approach(weights[i], targetW, lag, dt);
        scales[i] = approach(scales[i], targetS, lag, dt);

        nodes[i].style.setProperty("--w", weights[i].toFixed(1));
        nodes[i].style.setProperty("--sx", scales[i].toFixed(4));
      }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [field, reduced]);

  const enterState = immediate || reduced ? "in" : revealed ? "in" : "pending";

  return (
    <h1 className={styles.name} ref={rootRef}>
      {/* One accessible reading of the name, however the letters are split. */}
      <span className="sr-only">Abdul Moiz</span>
      <span className={`${styles.line} ${styles.masked}`} aria-hidden="true">
        {glyphs.map(({ word, letters }) => (
          <span className={styles.word} key={word}>
            {letters.map(({ ch, index }) => (
              <span
                key={`${word}-${index}`}
                ref={(el) => {
                  if (el) glyphRefs.current[index] = el;
                }}
                className={styles.glyph}
                data-enter={enterState}
                style={
                  {
                    "--enter-delay": `${index * 32}ms`,
                  } as React.CSSProperties
                }
              >
                {ch}
              </span>
            ))}
          </span>
        ))}
      </span>
    </h1>
  );
}

export default HeroName;
