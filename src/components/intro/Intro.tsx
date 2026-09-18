"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { choreography } from "@/lib/heroMotion";
import { INTRO_SESSION_KEY, shouldSkipIntro } from "@/lib/introGate";
import styles from "./Intro.module.css";

type Phase = "playing" | "leaving" | "done";

type Props = {
  /** The animated signature, inlined. See the note in page.tsx on why. */
  markup: string;
  /**
   * Called once, when the hero should take over. `immediate` is true when the
   * intro did not play at all, so the hero renders settled instead of running
   * the 3.65s entrance.
   */
  onFinish: (immediate: boolean) => void;
};

export function Intro({ markup, onFinish }: Props) {
  /* Always rendered on the server. A repeat visit within the session is hidden
     before first paint by the gate script in layout.tsx, and the mount effect
     below stands it down on the same tick, so there is no flash either way. */
  const [phase, setPhase] = useState<Phase>("playing");
  const settled = useRef(false);

  /**
   * Three ways out, and they are not the same.
   *
   * `played`   the signature ran its course, so the hero gets its full entrance.
   * `skipped`  someone asked to leave, so the hero is already stable when the
   *            layer clears - the brief asks that skip go straight to a stable
   *            readable hero, not into another second of choreography (s5.6).
   * `standDown` the intro was never going to play this session, so there is
   *            nothing to fade.
   */
  const leave = useCallback(
    (mode: "played" | "skipped" | "standDown") => {
      if (settled.current) return;
      settled.current = true;
      try {
        sessionStorage.setItem(INTRO_SESSION_KEY, "1");
      } catch {
        /* nothing to do: the intro simply plays again next time */
      }
      onFinish(mode !== "played");
      if (mode === "standDown") {
        setPhase("done");
        return;
      }
      setPhase("leaving");
      window.setTimeout(() => setPhase("done"), choreography.introFadeMs);
    },
    [onFinish],
  );

  useEffect(() => {
    if (shouldSkipIntro()) {
      /* Scheduled rather than called straight from the effect body: it still
         lands before the browser paints, so the gate script's hidden layer is
         never seen, and the hero is not held back by even one frame. */
      queueMicrotask(() => leave("standDown"));
      return;
    }
    /* Reduced motion gets the completed signature and a short crossfade rather
       than the full 2.6s hold (s5.12). Read straight from matchMedia rather
       than through the hook: this only ever runs on the client, so it gets the
       true value immediately instead of the hydration pass default.
       The SVG holds itself complete through its own media query, so there is
       nothing to stop here.

       This timer is the only thing that advances the page. Nothing waits on a
       load event, so a slow or failed asset can never trap anyone here (s5.6),
       and the signature is inlined so there is no request to fail in any case. */
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const holdMs = reduced ? 420 : choreography.signatureHold * 1000;
    const timer = window.setTimeout(() => leave("played"), holdMs);
    return () => window.clearTimeout(timer);
  }, [leave]);

  useEffect(() => {
    if (phase === "done") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") leave("skipped");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, leave]);

  if (phase === "done") return null;

  return (
    <div
      className={`${styles.layer} ${phase === "leaving" ? styles.leaving : ""}`}
      data-intro-layer=""
    >
      {/* Decorative here: the hero carries the real, permanent <h1>, and the
          brief is explicit that duplicates must not become reading content. */}
      <div
        className={styles.mark}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: markup }}
      />
      <button type="button" className={styles.skip} onClick={() => leave("skipped")}>
        Skip intro
      </button>
    </div>
  );
}

export default Intro;
