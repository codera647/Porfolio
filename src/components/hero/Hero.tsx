"use client";

import { useEffect, useRef, useState } from "react";
import { choreography } from "@/lib/heroMotion";
import { usePointerField } from "@/lib/usePointerField";
import { useReducedMotion } from "@/lib/useReducedMotion";
import HeroName from "./HeroName";
import HeroNav from "./HeroNav";
import PointerGlow from "./PointerGlow";
import RotatingTitle from "./RotatingTitle";
import SocialLinks from "./SocialLinks";
import TechStrip from "./TechStrip";
import styles from "./Hero.module.css";

type Props = {
  /** True when the intro did not play, so the hero renders already settled. */
  immediate: boolean;
  /** True once the intro has handed over. */
  started: boolean;
};

/*
 * The entrance is one monotonically advancing step counter rather than a bag of
 * booleans. Deriving every piece from it means reduced motion and the repeat
 * visit path cannot leave a stale flag behind, and there is no state mirroring
 * a value that render already knows.
 *
 * Reduced motion is deliberately NOT part of this. Hero.module.css already
 * renders the complete, settled hero under prefers-reduced-motion, so the
 * static design stands on its own with no JavaScript involved at all (s5.12).
 */
const STEPS = [
  "card", "nav", "name", "sentence", "role", "cta", "bottom", "settled",
] as const;
type Step = (typeof STEPS)[number];

const STEP_TIME: Record<Step, number> = {
  card: choreography.cardRevealAt,
  nav: choreography.navAt,
  name: choreography.nameAt,
  sentence: choreography.sentenceAt,
  role: choreography.roleAt,
  cta: choreography.ctaAt,
  bottom: choreography.bottomAt,
  settled: choreography.settledAt,
};

export function Hero({ immediate, started }: Props) {
  const reduced = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const field = usePointerField(cardRef);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (immediate || !started) return;
    /* The intro hands over at 2.60s, which is the zero of the table in s5.7,
       so each step is offset from the card reveal rather than from page load. */
    const base = choreography.cardRevealAt;
    const timers = STEPS.map((name, i) =>
      window.setTimeout(
        () => setStep((s) => Math.max(s, i + 1)),
        Math.max(0, (STEP_TIME[name] - base) * 1000),
      ),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [started, immediate]);

  /** True once `name` has been released, or straight away on a repeat visit. */
  const reached = (name: Step) => immediate || step > STEPS.indexOf(name);
  const settled = reached("settled");

  const cardClass = immediate
    ? styles.settled
    : reached("card")
      ? styles.opening
      : styles.entering;

  /* Supporting pieces share one reveal treatment: 10-14px of travel, no
     overshoot, released in the order the table gives (s5.7). */
  const reveal = (on: boolean) =>
    `${styles.reveal} ${on ? styles.revealed : ""}`;

  return (
    <section className={styles.stage} id="top">
      <SplitClipPaths />
      <div
        ref={cardRef}
        data-hero-card=""
        className={`${styles.card} ${cardClass}`}
      >
        <div className={styles.panels} aria-hidden="true">
          <div className={styles.rustViewport}>
            <div className={styles.rustWave} />
          </div>
        </div>

        <PointerGlow field={field} intensity={settled || reduced ? 1 : 0.35} />

        <div className={styles.content}>
          <div className={reveal(reached("nav"))}>
            <HeroNav />
          </div>

          <div className={styles.centre}>
            {/* The role line took the eyebrow's place at Nex's request, so it
                now leads the composition rather than trailing the sentence. */}
            <RotatingTitle className={`${styles.role} ${reveal(reached("role"))}`} />

            <HeroName field={field} revealed={reached("name")} immediate={immediate} />
          </div>

          <div className={`${styles.utility} ${reveal(reached("bottom"))}`}>
            <span className={styles.utilityLeft}>Ideas, built with intention.</span>
            <TechStrip className={styles.tech} />
            <SocialLinks />
          </div>
        </div>
      </div>
    </section>
  );
}


/**
 * The divider, in objectBoundingBox units so one path fits any card size.
 *
 * These are static shapes now. Each is a sine of exactly four periods over the
 * path's own height, and the element it clips is four card-heights tall, so one
 * period is one card height. Hero.module.css slides that element up by exactly
 * one period and loops - since the shape repeats on that interval, the visible
 * window is identical at the start and end of every cycle. Nothing interpolates,
 * so there is nothing to stutter.
 */
function SplitClipPaths() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
      <defs>
        <clipPath id="am-hero-split" clipPathUnits="objectBoundingBox">
          <path d="M0.6 0C0.6052 0.006 0.6109 0.0119 0.6156 0.0179C0.6203 0.0238 0.6249 0.0298 0.6281 0.0357C0.6314 0.0417 0.6339 0.0476 0.6351 0.0536C0.6363 0.0595 0.6363 0.0655 0.6351 0.0714C0.6339 0.0774 0.6314 0.0833 0.6281 0.0893C0.6249 0.0952 0.6203 0.1012 0.6156 0.1071C0.6109 0.1131 0.6052 0.119 0.6 0.125C0.5948 0.131 0.5891 0.1369 0.5844 0.1429C0.5797 0.1488 0.5751 0.1548 0.5719 0.1607C0.5686 0.1667 0.5661 0.1726 0.5649 0.1786C0.5637 0.1845 0.5637 0.1905 0.5649 0.1964C0.5661 0.2024 0.5686 0.2083 0.5719 0.2143C0.5751 0.2202 0.5797 0.2262 0.5844 0.2321C0.5891 0.2381 0.5948 0.244 0.6 0.25C0.6052 0.256 0.6109 0.2619 0.6156 0.2679C0.6203 0.2738 0.6249 0.2798 0.6281 0.2857C0.6314 0.2917 0.6339 0.2976 0.6351 0.3036C0.6363 0.3095 0.6363 0.3155 0.6351 0.3214C0.6339 0.3274 0.6314 0.3333 0.6281 0.3393C0.6249 0.3452 0.6203 0.3512 0.6156 0.3571C0.6109 0.3631 0.6052 0.369 0.6 0.375C0.5948 0.381 0.5891 0.3869 0.5844 0.3929C0.5797 0.3988 0.5751 0.4048 0.5719 0.4107C0.5686 0.4167 0.5661 0.4226 0.5649 0.4286C0.5637 0.4345 0.5637 0.4405 0.5649 0.4464C0.5661 0.4524 0.5686 0.4583 0.5719 0.4643C0.5751 0.4702 0.5797 0.4762 0.5844 0.4821C0.5891 0.4881 0.5948 0.494 0.6 0.5C0.6052 0.506 0.6109 0.5119 0.6156 0.5179C0.6203 0.5238 0.6249 0.5298 0.6281 0.5357C0.6314 0.5417 0.6339 0.5476 0.6351 0.5536C0.6363 0.5595 0.6363 0.5655 0.6351 0.5714C0.6339 0.5774 0.6314 0.5833 0.6281 0.5893C0.6249 0.5952 0.6203 0.6012 0.6156 0.6071C0.6109 0.6131 0.6052 0.619 0.6 0.625C0.5948 0.631 0.5891 0.6369 0.5844 0.6429C0.5797 0.6488 0.5751 0.6548 0.5719 0.6607C0.5686 0.6667 0.5661 0.6726 0.5649 0.6786C0.5637 0.6845 0.5637 0.6905 0.5649 0.6964C0.5661 0.7024 0.5686 0.7083 0.5719 0.7143C0.5751 0.7202 0.5797 0.7262 0.5844 0.7321C0.5891 0.7381 0.5948 0.744 0.6 0.75C0.6052 0.756 0.6109 0.7619 0.6156 0.7679C0.6203 0.7738 0.6249 0.7798 0.6281 0.7857C0.6314 0.7917 0.6339 0.7976 0.6351 0.8036C0.6363 0.8095 0.6363 0.8155 0.6351 0.8214C0.6339 0.8274 0.6314 0.8333 0.6281 0.8393C0.6249 0.8452 0.6203 0.8512 0.6156 0.8571C0.6109 0.8631 0.6052 0.869 0.6 0.875C0.5948 0.881 0.5891 0.8869 0.5844 0.8929C0.5797 0.8988 0.5751 0.9048 0.5719 0.9107C0.5686 0.9167 0.5661 0.9226 0.5649 0.9286C0.5637 0.9345 0.5637 0.9405 0.5649 0.9464C0.5661 0.9524 0.5686 0.9583 0.5719 0.9643C0.5751 0.9702 0.5797 0.9762 0.5844 0.9821C0.5891 0.9881 0.5948 0.994 0.6 1L1 1L1 0Z" />
        </clipPath>
        <clipPath id="am-hero-split-mobile" clipPathUnits="objectBoundingBox">
          <path d="M0.55 0C0.5601 0.006 0.5713 0.0119 0.5804 0.0179C0.5895 0.0238 0.5984 0.0298 0.6047 0.0357C0.611 0.0417 0.616 0.0476 0.6182 0.0536C0.6205 0.0595 0.6205 0.0655 0.6182 0.0714C0.616 0.0774 0.611 0.0833 0.6047 0.0893C0.5984 0.0952 0.5895 0.1012 0.5804 0.1071C0.5713 0.1131 0.5601 0.119 0.55 0.125C0.5399 0.131 0.5287 0.1369 0.5196 0.1429C0.5105 0.1488 0.5016 0.1548 0.4953 0.1607C0.489 0.1667 0.484 0.1726 0.4818 0.1786C0.4795 0.1845 0.4795 0.1905 0.4818 0.1964C0.484 0.2024 0.489 0.2083 0.4953 0.2143C0.5016 0.2202 0.5105 0.2262 0.5196 0.2321C0.5287 0.2381 0.5399 0.244 0.55 0.25C0.5601 0.256 0.5713 0.2619 0.5804 0.2679C0.5895 0.2738 0.5984 0.2798 0.6047 0.2857C0.611 0.2917 0.616 0.2976 0.6182 0.3036C0.6205 0.3095 0.6205 0.3155 0.6182 0.3214C0.616 0.3274 0.611 0.3333 0.6047 0.3393C0.5984 0.3452 0.5895 0.3512 0.5804 0.3571C0.5713 0.3631 0.5601 0.369 0.55 0.375C0.5399 0.381 0.5287 0.3869 0.5196 0.3929C0.5105 0.3988 0.5016 0.4048 0.4953 0.4107C0.489 0.4167 0.484 0.4226 0.4818 0.4286C0.4795 0.4345 0.4795 0.4405 0.4818 0.4464C0.484 0.4524 0.489 0.4583 0.4953 0.4643C0.5016 0.4702 0.5105 0.4762 0.5196 0.4821C0.5287 0.4881 0.5399 0.494 0.55 0.5C0.5601 0.506 0.5713 0.5119 0.5804 0.5179C0.5895 0.5238 0.5984 0.5298 0.6047 0.5357C0.611 0.5417 0.616 0.5476 0.6182 0.5536C0.6205 0.5595 0.6205 0.5655 0.6182 0.5714C0.616 0.5774 0.611 0.5833 0.6047 0.5893C0.5984 0.5952 0.5895 0.6012 0.5804 0.6071C0.5713 0.6131 0.5601 0.619 0.55 0.625C0.5399 0.631 0.5287 0.6369 0.5196 0.6429C0.5105 0.6488 0.5016 0.6548 0.4953 0.6607C0.489 0.6667 0.484 0.6726 0.4818 0.6786C0.4795 0.6845 0.4795 0.6905 0.4818 0.6964C0.484 0.7024 0.489 0.7083 0.4953 0.7143C0.5016 0.7202 0.5105 0.7262 0.5196 0.7321C0.5287 0.7381 0.5399 0.744 0.55 0.75C0.5601 0.756 0.5713 0.7619 0.5804 0.7679C0.5895 0.7738 0.5984 0.7798 0.6047 0.7857C0.611 0.7917 0.616 0.7976 0.6182 0.8036C0.6205 0.8095 0.6205 0.8155 0.6182 0.8214C0.616 0.8274 0.611 0.8333 0.6047 0.8393C0.5984 0.8452 0.5895 0.8512 0.5804 0.8571C0.5713 0.8631 0.5601 0.869 0.55 0.875C0.5399 0.881 0.5287 0.8869 0.5196 0.8929C0.5105 0.8988 0.5016 0.9048 0.4953 0.9107C0.489 0.9167 0.484 0.9226 0.4818 0.9286C0.4795 0.9345 0.4795 0.9405 0.4818 0.9464C0.484 0.9524 0.489 0.9583 0.4953 0.9643C0.5016 0.9702 0.5105 0.9762 0.5196 0.9821C0.5287 0.9881 0.5399 0.994 0.55 1L1 1L1 0Z" />
        </clipPath>
      </defs>
    </svg>
  );
}

export default Hero;
