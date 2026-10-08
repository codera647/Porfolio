"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { animatePinnedScene } from "@/lib/pinnedScroll";
import styles from "./Experience.module.css";

const LOGOS = {
  kinetiq: { src: "/experience/kinetiq-solutions.png", width: 296, height: 192 },
  digifloat: { src: "/experience/digifloat.png", width: 192, height: 192 },
  prosilient: { src: "/experience/prosilient-systems.png", width: 429, height: 192 },
  care: { src: "/experience/care.png", width: 192, height: 192 },
} as const;

const EXPERIENCES = [
  {
    company: "Kinetiq Solutions",
    logo: LOGOS.kinetiq,
    role: "AI/ML Team Lead",
    period: "Jul 2026 - Present",
    location: "Remote",
    description:
      "Leading a cross-functional AI/ML team, setting the technical direction for GenAI and machine-learning initiatives while mentoring engineers across model design, training, and deployment.",
    tags: ["Leadership", "GenAI / ML", "Model deployment"],
    marker: "Promoted",
  },
  {
    company: "Kinetiq Solutions",
    logo: LOGOS.kinetiq,
    role: "AI/ML Engineer",
    period: "Sep 2025 - Jun 2026",
    location: "Remote",
    description:
      "Built production ML and LLM systems end to end, from data preparation and evaluation to FastAPI integration, vector stores, observability, and post-deployment monitoring.",
    tags: ["MLOps", "Model evaluation", "Observability", "FastAPI"],
  },
  {
    company: "Digifloat",
    logo: LOGOS.digifloat,
    role: "Artificial Intelligence Intern",
    period: "Apr 2026 - Jul 2026",
    location: "Hybrid",
    description:
      "Developed real-time computer-vision and robotics perception systems, taking image data from preprocessing through low-latency object detection and tracking.",
    tags: ["ROS2", "YOLO", "Gazebo", "Tracking"],
  },
  {
    company: "Prosilient Systems Inc.",
    logo: LOGOS.prosilient,
    role: "AI Researcher",
    period: "Jul 2025 - Sep 2025",
    location: "Remote",
    description:
      "Engineered automated research-data collection pipelines and transformed unstructured web data into cleaner, more dependable inputs for downstream model training.",
    tags: ["Web scraping", "Data pipelines", "Data quality"],
  },
  {
    company: "CARE",
    companyLong: "Center for Advanced Research in Engineering",
    logo: LOGOS.care,
    role: "AI Developer",
    period: "Jul 2024 - Sep 2024",
    location: "On-site",
    description:
      "Built RAG document-intelligence and NLP systems, connecting models to FastAPI and Flask services with a React interface and a production-minded delivery workflow.",
    tags: ["RAG", "LangChain", "FastAPI", "React"],
  },
] as const;

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (value: number) => value * value * (3 - 2 * value);

/** Alternating, natural-flow timeline; the line leads each entry's reveal. */
export function Experience() {
  const trackRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLOListElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const rowRefs = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    const track = trackRef.current;
    const timeline = timelineRef.current;
    const line = lineRef.current;
    const fill = fillRef.current;
    if (!track || !timeline || !line || !fill) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposeScene: ReturnType<typeof animatePinnedScene> | undefined;
    let disposed = false;
    let nodePositions: number[] = [];
    // Mutated on measure so checkpoints follow actual wrapping/row heights.
    const checkpoints: number[] = [];
    // Mobile URL bars resize the viewport mid-scroll; ignore those small
    // height-only changes so the anchor (and the drawn line) never jumps.
    let anchorWidth = 0;
    let anchorHeight = 0;
    let timelineDocumentTop = 0;

    const measure = () => {
      if (window.innerWidth !== anchorWidth || Math.abs(window.innerHeight - anchorHeight) > 160) {
        anchorWidth = window.innerWidth;
        anchorHeight = window.innerHeight;
      }
      const timelineTop = timeline.getBoundingClientRect().top;
      timelineDocumentTop = window.scrollY + timelineTop;
      nodePositions = rowRefs.current.map((row) => {
        const node = row?.querySelector<HTMLElement>("[data-timeline-node]");
        const rect = node?.getBoundingClientRect();
        return rect ? rect.top + rect.height / 2 - timelineTop : 0;
      });
      const first = nodePositions[0] ?? 0;
      const distance = Math.max(1, (nodePositions.at(-1) ?? first) - first);
      line.style.top = `${first}px`;
      line.style.height = `${distance}px`;
      checkpoints.splice(0, checkpoints.length,
        ...nodePositions.map((position) => (position - first) / distance));
    };

    const getBounds = () => {
      const top = timelineDocumentTop;
      // The next entry settles comfortably within the viewport, not at its edge.
      const anchor = anchorHeight * 0.6;
      return {
        start: top + (nodePositions[0] ?? 0) - anchor,
        end: top + (nodePositions.at(-1) ?? 0) - anchor,
      };
    };

    const render = (progress: number) => {
      const nextIndex = checkpoints.findIndex((stop, index) => index > 0 && progress <= stop);
      const nextStop = checkpoints[nextIndex] ?? 1;
      const previousStop = checkpoints[nextIndex - 1] ?? 0;
      // Draw to the next node first, then use the last 22% of that same scroll
      // interval to reveal its entry. No extra timer or dead-scroll pause.
      const lineProgress = nextIndex < 0 ? 1 : previousStop
        + smoothstep(clamp((progress - previousStop) / Math.max(0.001, (nextStop - previousStop) * 0.78)))
        * (nextStop - previousStop);
      fill.style.transform = `scaleY(${lineProgress})`;
      rowRefs.current.forEach((row, index) => {
        if (!row) return;
        const stop = checkpoints[index] ?? 1;
        const previous = checkpoints[index - 1] ?? 0;
        // Reveal only after the line reaches the node. Completed
        // entries stay at full opacity; reverse scrolling retraces the line.
        const revealWindow = Math.max(0.001, (stop - previous) * 0.22);
        const reveal = index === 0 ? 1
          : smoothstep(clamp((progress - stop + revealWindow) / revealWindow));
        row.style.setProperty("--reveal", reveal.toFixed(4));
        row.dataset.reveal = reveal.toFixed(4);
        row.dataset.checkpoint = stop.toFixed(4);
      });
    };

    const configure = () => {
      disposeScene?.();
      disposeScene = undefined;
      measure();
      if (reducedMotion.matches) {
        delete track.dataset.timelineAnimated;
        render(1);
        return;
      }
      disposeScene = animatePinnedScene(track, render, {
        checkpoints,
        minimumTravelMs: 1600,
        followThroughMs: 85,
        lookAhead: 0.22,
        holdMs: 40,
        measure,
        getBounds,
        // The rows scroll with the page, so the line must follow Lenis' already
        // smoothed position exactly; an extra easing layer made it wobble.
        scrollLinked: true,
      });
      track.dataset.timelineAnimated = "true";
    };

    configure();
    reducedMotion.addEventListener("change", configure);
    const refresh = () => {
      if (disposed) return;
      // Remeasure the same scene, retaining its guard/checkpoint state. Recreating
      // it here used to restart the scroll animation on font/size changes.
      if (disposeScene) disposeScene.refresh();
      else measure();
    };
    const observer = new ResizeObserver(() => {
      refresh();
    });
    observer.observe(timeline);
    // Font loading can change wrapping after the first measurement.
    void document.fonts.ready.then(refresh);
    return () => {
      disposed = true;
      observer.disconnect();
      reducedMotion.removeEventListener("change", configure);
      disposeScene?.();
      delete track.dataset.timelineAnimated;
    };
  }, []);

  return (
    <section id="experience" className={styles.section} aria-labelledby="experience-title">
      <div ref={trackRef} className={styles.track}>
        <header className={styles.header}>
          <h2 id="experience-title" className={styles.title}>Where I&apos;ve Been</h2>
        </header>

        <div className={styles.timelineWrapper}>
          <div ref={lineRef} className={styles.line} aria-hidden="true">
            <span ref={fillRef} className={styles.lineFill} />
          </div>
          <ol ref={timelineRef} className={styles.timeline} aria-label="Professional experience">
            {EXPERIENCES.map((experience, index) => (
              <li key={`${experience.company}-${experience.role}`}
                ref={(node) => { rowRefs.current[index] = node; }}
                className={styles.timelineRow}>
                <span data-timeline-node className={styles.node} aria-hidden="true" />
                <span className={styles.connector} aria-hidden="true" />
                <article className={styles.entry} aria-labelledby={`experience-role-${index}`}>
                  {/* Decorative: the company name is announced by the heading below. */}
                  <Image className={styles.companyLogo} src={experience.logo.src}
                    width={experience.logo.width} height={experience.logo.height}
                    alt="" sizes="160px" />
                  <div className={styles.companyHeading}>
                    <h3 className={styles.company}>{experience.company}</h3>
                    {"marker" in experience && <span className={styles.marker}>{experience.marker}</span>}
                  </div>
                  {"companyLong" in experience && <p className={styles.companyLong}>{experience.companyLong}</p>}
                  <h4 id={`experience-role-${index}`} className={styles.role}>{experience.role}</h4>
                  <p className={styles.meta}>
                    <span>{experience.period}</span><span aria-hidden="true">/</span><span>{experience.location}</span>
                  </p>
                  <p className={styles.description}>{experience.description}</p>
                  <ul className={styles.tags} aria-label={`${experience.role} skills`}>
                    {experience.tags.map((tag) => <li key={tag}>{tag}</li>)}
                  </ul>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export default Experience;
