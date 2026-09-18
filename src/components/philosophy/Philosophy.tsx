"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./Philosophy.module.css";

/**
 * Philosophy Section with ScrollExpand cinematic animation.
 *
 * Recreates the exact experience from the reference video:
 * 1. Initial State: Centered compact rounded card, blurred crimson Michelangelo
 *    hands image (14px Gaussian blur, 1.4x zoom), with "THE PHILOSOPHY" title overlaid.
 * 2. Scroll Expansion: As the user scrolls through the 250vh track, the card smoothly
 *    expands using clip-path to 100% full viewport width and height (radius 20px -> 0px).
 *    Simultaneously, the blur clears (14px -> 0px) and the zoom eases down (1.4x -> 1.0x).
 * 3. Title Transition: The large "THE PHILOSOPHY" header lifts up and fades away.
 * 4. Revealed Philosophy: A dark scrim settles and the full statement fades in over
 *    the outstretched hands, tailored specifically for an AI/ML Engineer and Architect.
 */
export function Philosophy() {
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLImageElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const frame = frameRef.current;
    const media = mediaRef.current;
    const scrim = scrimRef.current;
    const title = titleRef.current;
    const overlay = overlayRef.current;

    if (!track || !frame || !media) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) return;

    let rafId: number | null = null;
    let targetProgress = 0;
    let currentProgress = 0;

    const updateDimensions = () => {
      const w = window.innerWidth;
      if (w <= 600) {
        return { startW: 76, startH: 44, startR: 18 };
      }
      if (w <= 1024) {
        return { startW: 54, startH: 48, startR: 20 };
      }
      return { startW: 38, startH: 52, startR: 22 };
    };

    let { startW, startH, startR } = updateDimensions();

    const handleResize = () => {
      const dims = updateDimensions();
      startW = dims.startW;
      startH = dims.startH;
      startR = dims.startR;
    };

    const render = (progress: number) => {
      // 1. Frame clip-path morphing (inner window -> full hero-style card)
      const currentW = startW + (100 - startW) * progress;
      const currentH = startH + (100 - startH) * progress;
      const insetX = Math.max(0, (100 - currentW) / 2);
      const insetY = Math.max(0, (100 - currentH) / 2);
      const endR = window.innerWidth <= 600 ? 22 : window.innerWidth <= 1024 ? 27 : 32;
      const currentR = Math.max(0, startR + (endR - startR) * progress);

      frame.style.clipPath = `inset(${insetY.toFixed(2)}% ${insetX.toFixed(
        2
      )}% ${insetY.toFixed(2)}% ${insetX.toFixed(2)}% round ${currentR.toFixed(
        1
      )}px)`;

      // 2. Media zoom & un-blur (hands remain completely visible, dipping only slightly to 88%)
      const scale = 1.4 - 0.4 * progress;
      const blur = 14 * Math.max(0, 1 - progress / 0.72);
      const mediaOpacity = 1 - 0.12 * Math.max(0, Math.min(1, (progress - 0.45) / 0.55));
      media.style.transform = `scale(${scale.toFixed(3)})`;
      media.style.filter = `blur(${blur.toFixed(2)}px)`;
      media.style.opacity = mediaOpacity.toFixed(3);

      // 3. Central darkening scrim (dims only the reading area behind the words)
      if (scrim) {
        const scrimAlpha = Math.min(0.85, Math.max(0, (progress - 0.35) / 0.65));
        scrim.style.opacity = scrimAlpha.toFixed(3);
      }

      // 4. Initial Title ("THE PHILOSOPHY") fade-out and lift
      if (title) {
        if (progress < 0.32) {
          title.style.opacity = "1";
          title.style.transform = "translate3d(0, 0, 0) scale(1)";
        } else if (progress <= 0.8) {
          const t = (progress - 0.32) / (0.8 - 0.32);
          const titleOpacity = 1 - t;
          const translateY = -30 * t;
          const titleScale = 1 + 0.05 * t;
          title.style.opacity = titleOpacity.toFixed(3);
          title.style.transform = `translate3d(0, ${translateY.toFixed(
            1
          )}px, 0) scale(${titleScale.toFixed(3)})`;
        } else {
          title.style.opacity = "0";
        }
      }

      // 6. Overlaid Statement reveal (emerges as hands become full-screen)
      if (overlay) {
        if (progress < 0.65) {
          overlay.style.opacity = "0";
          overlay.style.transform = "translate3d(0, 20px, 0)";
        } else {
          const t = (progress - 0.65) / (1 - 0.65);
          const easedT = Math.min(1, Math.max(0, t));
          const translateY = 20 * (1 - easedT);
          overlay.style.opacity = easedT.toFixed(3);
          overlay.style.transform = `translate3d(0, ${translateY.toFixed(
            1
          )}px, 0)`;
        }
      }
    };

    const computeProgress = () => {
      const rect = track.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const totalDistance = rect.height - viewportHeight;
      if (totalDistance <= 0) return 0;
      const scrolled = -rect.top;
      return Math.min(1, Math.max(0, scrolled / totalDistance));
    };

    const tick = () => {
      // Smooth lerp for buttery animation
      currentProgress += (targetProgress - currentProgress) * 0.12;
      if (Math.abs(targetProgress - currentProgress) < 0.001) {
        currentProgress = targetProgress;
      }

      render(currentProgress);

      if (currentProgress !== targetProgress) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    };

    const handleScroll = () => {
      targetProgress = computeProgress();
      if (rafId === null) {
        rafId = requestAnimationFrame(tick);
      }
    };

    // Initial render
    targetProgress = computeProgress();
    currentProgress = targetProgress;
    render(currentProgress);

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <section id="philosophy" className={styles.section} aria-label="Philosophy">
      <div ref={trackRef} className={styles.track}>
        <div className={styles.stage}>
          {/* Hero-Style Card Frame */}
          <div className={styles.card}>
            {/* Expanding Card Window */}
            <div ref={frameRef} className={styles.frame}>
              <Image
                ref={mediaRef}
                className={styles.media}
                src="/images/philosophy-bg.jpg"
                alt="Hands reaching, Creation of Adam in deep crimson"
                fill
                sizes="100vw"
                priority
                quality={90}
              />

              {/* Dark Scrim */}
              <div ref={scrimRef} className={styles.scrim} aria-hidden="true" />

              {/* Final Statement Overlay */}
              <div ref={overlayRef} className={styles.overlay}>
                <span className={styles.badge}>THE PHILOSOPHY</span>
                <p className={styles.quote}>
                  &ldquo;I believe real AI engineering begins where cloud APIs end.
                  Anyone can wrap a prompt, but true architecture is proven in the
                  unseen: bias and variance rigor, data drift resilience, production
                  evaluation, and knowing precisely when a human must guide the
                  machine. I do not build demos that hallucinate. I build systems
                  that endure.&rdquo;
                </p>
              </div>
            </div>

            {/* Initial Title */}
            <div ref={titleRef} className={styles.titleWrapper}>
              <h2 className={styles.title}>The Philosophy</h2>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Philosophy;
