"use client";

import type { Target } from "motion/react";
import RotatingText from "@/vendor/reactbits/RotatingText";
import { useReducedMotion } from "@/lib/useReducedMotion";
import styles from "./RotatingTitle.module.css";

/** Nex's real title. Not invented; see docs/HANDOFF.md section 2. */
const LEAD = "Machine Learning";
const ROLES = ["Engineer", "Architect"] as const;

/** What the rotation stands in for, and what reduced motion shows instead. */
const STATIC_ROLE = ROLES.join(" / ");

const longest = ROLES.reduce((a, b) => (b.length > a.length ? b : a));

type Props = {
  /** Calm by default: slow enough never to compete with the name above it. */
  intervalMs?: number;
  className?: string;
};

export function RotatingTitle({ intervalMs = 3200, className }: Props) {
  const reduced = useReducedMotion();

  /* Reserve the longer word's width so a swap cannot reflow the line. In
     reduced motion the slot holds "Engineer / Architect" instead, which is the
     title exactly as section 5.5 writes it, so the static state is complete
     rather than a frozen frame of the animation. */
  const slotWidth = reduced ? `${STATIC_ROLE.length}ch` : `${longest.length}ch`;

  return (
    <p
      className={[styles.title, className].filter(Boolean).join(" ")}
      style={{ ["--rotating-slot-width" as string]: slotWidth }}
    >
      {/* One steady accessible reading of the title. The visual treatment is
          hidden from assistive tech so a swap every few seconds is never
          announced as new content. */}
      <span className="sr-only">{`${LEAD} ${STATIC_ROLE}`}</span>

      <span className={styles.lead} aria-hidden="true">
        {LEAD}
      </span>

      {reduced ? (
        <span className={`${styles.block} ${styles.static}`} aria-hidden="true">
          {STATIC_ROLE}
        </span>
      ) : (
        <span className={`${styles.block} ${styles.slot}`} aria-hidden="true">
          <RotatingText
            texts={[...ROLES]}
            rotationInterval={intervalMs}
            mainClassName={styles.slotInner}
            /* "wait" is what this component is built around: the old word
               leaves, then the new one arrives. "sync" was tried and breaks -
               with only two texts the keys alternate 0,1,0,1 and a repeated key
               collides with the copy still exiting, leaving the slot
               permanently empty after the second swap. */
            animatePresenceMode="wait"
            splitBy="characters"
            staggerFrom="first"
            /* Was 0.018, which spread nine characters over 160ms - and since each
               starts transparent, that stagger read as part of the empty block
               rather than as arrival. Tightened so the word lands as a unit. */
            staggerDuration={0.006}
            /* A short tween rather than a spring: it keeps the handover to
               about a quarter second, so the gap "wait" leaves never reads as
               a flicker, and it settles without any overshoot to pull the eye
               off the name above. */
            transition={{ type: "tween", duration: 0.26, ease: [0.33, 0, 0.2, 1] }}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            /* "wait" holds the next word until this one has finished leaving,
               so the exit duration IS the gap - and now that the slot is a
               filled block, that gap reads as an empty white box rather than
               merely absent text. The outgoing word therefore leaves almost
               instantly: about three frames, short enough not to register. The
               arriving word still slides up over the full duration, and that is
               the gesture the eye actually follows. */
            exit={
              /* The cast is deliberate. motion accepts a per-animation
                 `transition` inside a target, and AnimatePresence relies on it;
                 the vendored component just types `exit` as `Target`, which is
                 narrower than motion's own `TargetAndTransition`. Casting here
                 keeps the vendored file byte-identical to upstream. */
              {
                y: "-110%",
                opacity: 0,
                transition: { duration: 0.06, ease: [0.4, 0, 1, 1] },
              } as Target
            }
            aria-hidden="true"
          />
        </span>
      )}
    </p>
  );
}

export default RotatingTitle;
