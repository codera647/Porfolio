"use client";

import { useEffect, useRef } from "react";
import { animatePinnedScene } from "@/lib/pinnedScroll";
import styles from "./Experience.module.css";

const EXPERIENCES = [
  {
    company: "kinetiq",
    initials: "K",
    role: "AI/ML Team Lead",
    period: "Jul 2026 - Present",
    location: "Remote",
    description:
      "Leading a cross-functional AI/ML team, setting the technical direction for GenAI and machine-learning initiatives while mentoring engineers across model design, training, and deployment.",
    tags: ["Leadership", "GenAI / ML", "Model deployment"],
    marker: "Promoted",
  },
  {
    company: "kinetiq",
    initials: "K",
    role: "AI/ML Engineer",
    period: "Sep 2025 - Jun 2026",
    location: "Remote",
    description:
      "Built production ML and LLM systems end to end, from data preparation and evaluation to FastAPI integration, vector stores, observability, and post-deployment monitoring.",
    tags: ["MLOps", "Model evaluation", "Observability", "FastAPI"],
  },
  {
    company: "Digifloat",
    initials: "D",
    role: "Artificial Intelligence Intern",
    period: "Apr 2026 - Jul 2026",
    location: "Hybrid",
    description:
      "Developed real-time computer-vision and robotics perception systems, taking image data from preprocessing through low-latency object detection and tracking.",
    tags: ["ROS2", "YOLO", "Gazebo", "Tracking"],
  },
  {
    company: "Prosilient Systems Inc.",
    initials: "PS",
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
    initials: "C",
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
    let disposeScene: (() => void) | undefined;
    let disposed = false;
    let nodePositions: number[] = [];
    // Mutated on measure so checkpoints follow actual wrapping/row heights.
    const checkpoints: number[] = [];

    const measure = () => {
      const timelineTop = timeline.getBoundingClientRect().top;
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
      const top = window.scrollY + timeline.getBoundingClientRect().top;
      // The next entry settles comfortably within the viewport, not at its edge.
      const anchor = window.innerHeight * 0.6;
      return {
        start: top + (nodePositions[0] ?? 0) - anchor,
        end: top + (nodePositions.at(-1) ?? 0) - anchor,
      };
    };

    const render = (progress: number) => {
      fill.style.transform = `scaleY(${progress})`;
      rowRefs.current.forEach((row, index) => {
        if (!row) return;
        const stop = checkpoints[index] ?? 1;
        const previous = checkpoints[index - 1] ?? 0;
        // Reveal only in the final stretch approaching a node. Completed
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
      });
      track.dataset.timelineAnimated = "true";
    };

    configure();
    reducedMotion.addEventListener("change", configure);
    const observer = new ResizeObserver(() => {
      if (!disposed) configure();
    });
    observer.observe(timeline);
    // Font loading can change wrapping after the first measurement.
    void document.fonts.ready.then(() => { if (!disposed) configure(); });
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
                  <div className={styles.companyMark} aria-hidden="true">{experience.initials}</div>
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
