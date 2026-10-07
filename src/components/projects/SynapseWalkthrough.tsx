"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import styles from "./SynapseWalkthrough.module.css";

const SCREENS = [
  { src: "/projects/synapse/screens/landing-1.png", width: 1893, height: 858, title: "Product promise", note: "A research workspace built around verifiable answers." },
  { src: "/projects/synapse/screens/landing-2.png", width: 1896, height: 696, title: "How it works", note: "The product story connects ingestion, reasoning, and cited output." },
  { src: "/projects/synapse/screens/library.png", width: 1919, height: 852, title: "Research libraries", note: "Documents become scoped knowledge bases with visible processing state." },
  { src: "/projects/synapse/screens/chat.png", width: 1919, height: 848, title: "Grounded chat", note: "Answers remain connected to their source chunks, pages, figures, and tables." },
  { src: "/projects/synapse/screens/team-chat.png", width: 1919, height: 847, title: "Team chat", note: "Shared conversations can search approved libraries across organizations." },
  { src: "/projects/synapse/screens/team-management.png", width: 1919, height: 860, title: "Tenant controls", note: "Members, roles, invitations, and library access are explicit." },
  { src: "/projects/synapse/screens/agent-mode-1.png", width: 1899, height: 851, title: "Agent mode", note: "A goal can become a structured visual or research artefact." },
  { src: "/projects/synapse/screens/agent-mode-2.png", width: 1912, height: 857, title: "Traceable execution", note: "Planning, data acquisition, construction, and validation stay visible." },
  { src: "/projects/synapse/screens/saved-docs.png", width: 570, height: 798, title: "Saved evidence", note: "Important source material can be kept beside the conversation." },
  { src: "/projects/synapse/screens/save-visual-docs.png", width: 608, height: 836, title: "Saved visuals", note: "Generated and retrieved visuals remain reusable." },
  { src: "/projects/synapse/screens/generate-visuals.png", width: 1908, height: 861, title: "Visual generation", note: "Agent output extends from prose into charts and diagrams." },
  { src: "/projects/synapse/screens/knowledge-graph-generation.png", width: 1919, height: 855, title: "Graph generation", note: "Entities and relationships are extracted from selected knowledge." },
  { src: "/projects/synapse/screens/knowledge-graph-representation.png", width: 1910, height: 857, title: "Knowledge graph", note: "A navigable representation exposes how concepts connect." },
  { src: "/projects/synapse/screens/usage-1.png", width: 1890, height: 802, title: "Usage visibility", note: "Consumption and processing are surfaced instead of hidden." },
  { src: "/projects/synapse/screens/usage-2.png", width: 1785, height: 457, title: "Operational detail", note: "The workspace keeps its infrastructure legible to the user." },
] as const;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function SynapseWalkthrough() {
  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const rail = railRef.current;
    const mobile = window.matchMedia("(max-width: 760px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!track || !rail || mobile.matches || reduced.matches) return;

    let target = 0;
    let current = 0;
    let frame = 0;
    let previous = performance.now();
    let travel = 0;

    const measure = () => {
      const finalRightInset = window.innerWidth * 0.065;
      travel = Math.max(
        0,
        rail.scrollWidth - window.innerWidth + finalRightInset,
      );
    };

    const progress = () => {
      const rect = track.getBoundingClientRect();
      const distance = rect.height - window.innerHeight;
      return distance <= 0 ? 0 : clamp(-rect.top / distance);
    };

    const render = () => {
      rail.style.transform = `translate3d(${-current * travel}px, 0, 0)`;
      const index = Math.min(SCREENS.length - 1, Math.round(current * (SCREENS.length - 1)));
      if (counterRef.current) counterRef.current.textContent = String(index + 1).padStart(2, "0");
    };

    const tick = (time: number) => {
      const elapsed = Math.min(64, time - previous);
      previous = time;
      // Read the section position every frame rather than relying on native
      // scroll events. This keeps the rail locked to Lenis' interpolated
      // position as well as mouse-wheel, keyboard, and scrollbar input.
      target = progress();
      current += (target - current) * (1 - Math.exp(-elapsed / 250));
      if (Math.abs(target - current) < 0.0004) current = target;
      render();
      frame = requestAnimationFrame(tick);
    };

    const resize = () => {
      measure();
      target = progress();
      current = target;
      render();
    };

    const sizeObserver = new ResizeObserver(measure);
    sizeObserver.observe(rail);
    measure();
    target = progress();
    current = target;
    render();
    frame = requestAnimationFrame(tick);
    window.addEventListener("resize", resize, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section className={styles.section} aria-labelledby="walkthrough-title">
      <header className={styles.header}>
        <div>
          <p>01 / Product walkthrough</p>
          <h2 id="walkthrough-title">One workspace, from source to cited answer.</h2>
        </div>
      </header>
      <div ref={trackRef} className={styles.track}>
        <div className={styles.stage}>
          <p className={styles.counter} aria-label={`${SCREENS.length} product screens`}>
            <span ref={counterRef}>01</span><span>/</span><span>{SCREENS.length}</span>
          </p>

          <div ref={railRef} className={styles.rail}>
            {SCREENS.map((screen, index) => (
              <figure key={screen.src} className={`${styles.slide} ${screen.height > screen.width ? styles.portrait : ""}`}>
                <div className={styles.imageFrame}>
                  <Image
                    src={screen.src}
                    alt={`${screen.title} screen in Synapse`}
                    width={screen.width}
                    height={screen.height}
                    sizes="(max-width: 760px) 100vw, 78vw"
                    priority={index < 2}
                  />
                </div>
                <figcaption>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><strong>{screen.title}</strong><p>{screen.note}</p></div>
                </figcaption>
                {index < SCREENS.length - 1 && <span className={styles.slideArrow} aria-hidden="true">→</span>}
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SynapseWalkthrough;
