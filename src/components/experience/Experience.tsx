"use client";

import { useEffect, useRef } from "react";
import { animatePinnedScene } from "@/lib/pinnedScroll";
import styles from "./Experience.module.css";

const EXPERIENCE_FOLLOW_THROUGH_MS = 110;

const EXPERIENCES = [
  {
    company: "kinetiq",
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
    role: "AI/ML Engineer",
    period: "Sep 2025 - Jun 2026",
    location: "Remote",
    description:
      "Built production ML and LLM systems end to end, from data preparation and evaluation to FastAPI integration, vector stores, observability, and post-deployment monitoring.",
    tags: ["MLOps", "Model evaluation", "Observability", "FastAPI"],
  },
  {
    company: "Digifloat",
    role: "Artificial Intelligence Intern",
    period: "Apr 2026 - Jul 2026",
    location: "Hybrid",
    description:
      "Developed real-time computer-vision and robotics perception systems, taking image data from preprocessing through low-latency object detection and tracking.",
    tags: ["ROS2", "YOLO", "Gazebo", "Tracking"],
  },
  {
    company: "Prosilient Systems Inc.",
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
    role: "AI Developer",
    period: "Jul 2024 - Sep 2024",
    location: "On-site",
    description:
      "Built RAG document-intelligence and NLP systems, connecting models to FastAPI and Flask services with a React interface and a production-minded delivery workflow.",
    tags: ["RAG", "LangChain", "FastAPI", "React"],
  },
] as const;

const clamp = (value: number, minimum = 0, maximum = 1) =>
  Math.min(maximum, Math.max(minimum, value));

const smoothstep = (value: number) => value * value * (3 - 2 * value);

function formatIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

/**
 * A pinned, scroll-driven experience rail. Vertical page progress becomes a
 * horizontal journey, while a shared focus value controls every visual cue so
 * the counter, card highlight, and progress rail cannot drift out of sync.
 */
export function Experience() {
  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const counterRef = useRef<HTMLSpanElement>(null);
  const segmentRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const edgeProgressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const rail = railRef.current;
    const cards = cardRefs.current;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    if (!track || !rail || reducedMotion.matches) return;

    let viewportCenter = window.innerWidth / 2;
    let cardCenters: number[] = [];

    const measure = () => {
      viewportCenter = window.innerWidth / 2;
      cardCenters = cards.map((card) =>
        card ? card.offsetLeft + card.offsetWidth / 2 : viewportCenter,
      );
    };

    const getCardPosition = (pageProgress: number) => {
      // Brief easing at either end, without a long dead-scroll entry/exit.
      // The shared checkpoint guard already gives each role a settled state.
      const journey = clamp(pageProgress);
      const transitionCount = EXPERIENCES.length - 1;
      const scaled = journey * transitionCount;
      const segment = Math.min(Math.floor(scaled), transitionCount - 1);
      const local = segment === transitionCount - 1 && journey === 1
        ? 1
        : scaled - segment;
      const moving = smoothstep(clamp((local - 0.04) / 0.92));
      return segment + moving;
    };

    const render = (pageProgress: number) => {
      const position = getCardPosition(pageProgress);
      const lowerIndex = Math.min(
        EXPERIENCES.length - 1,
        Math.floor(position),
      );
      const upperIndex = Math.min(EXPERIENCES.length - 1, lowerIndex + 1);
      const mix = position - lowerIndex;
      const lowerCenter = cardCenters[lowerIndex] ?? viewportCenter;
      const upperCenter = cardCenters[upperIndex] ?? lowerCenter;
      const activeCenter = lowerCenter + (upperCenter - lowerCenter) * mix;

      rail.style.transform = `translate3d(${viewportCenter - activeCenter}px, 0, 0)`;

      cards.forEach((card, index) => {
        if (!card) return;
        const focus = smoothstep(clamp(1 - Math.abs(position - index)));
        card.style.setProperty("--focus", focus.toFixed(4));
      });

      const activeIndex = Math.round(position);
      if (counterRef.current) {
        counterRef.current.textContent = formatIndex(activeIndex);
      }

      segmentRefs.current.forEach((segment, index) => {
        if (!segment) return;
        const segmentFocus = smoothstep(clamp(1 - Math.abs(position - index)));
        segment.style.setProperty("--segment-focus", segmentFocus.toFixed(4));
      });

      edgeProgressRef.current?.style.setProperty(
        "--journey-progress",
        pageProgress.toFixed(4),
      );
    };

    return animatePinnedScene(track, render, {
      checkpoints: [0, 0.25, 0.5, 0.75, 1],
      minimumTravelMs: 2400,
      followThroughMs: EXPERIENCE_FOLLOW_THROUGH_MS,
      lookAhead: 0.20,
      holdMs: 60,
      measure,
    });
  }, []);

  return (
    <section
      id="experience"
      className={styles.section}
      aria-labelledby="experience-title"
    >
      <div ref={trackRef} className={styles.track}>
        <div className={styles.stage}>
          <header className={styles.header}>
            <h2 id="experience-title" className={styles.title}>
              Where I&apos;ve Been
            </h2>
            <p className={styles.counter} aria-label={`${EXPERIENCES.length} experience entries`}>
              <span ref={counterRef}>01</span>
              <span className={styles.counterDivider}>/</span>
              <span>{formatIndex(EXPERIENCES.length - 1)}</span>
            </p>
          </header>

          <div className={styles.railViewport}>
          <div
            ref={railRef}
            className={styles.rail}
            aria-label="Professional experience"
          >
            {EXPERIENCES.map((experience, index) => (
              <article
                key={`${experience.company}-${experience.role}`}
                ref={(node) => {
                  cardRefs.current[index] = node;
                }}
                className={styles.experienceCard}
              >
                <span className={styles.cardNumber} aria-hidden="true">
                  {formatIndex(index)}
                </span>

                <div className={styles.cardContent}>
                  <div className={styles.cardTopline}>
                    <p className={styles.company}>{experience.company}</p>
                    {"marker" in experience && (
                      <span className={styles.marker}>{experience.marker}</span>
                    )}
                  </div>

                  {"companyLong" in experience && (
                    <p className={styles.companyLong}>{experience.companyLong}</p>
                  )}

                  <h3 className={styles.role}>{experience.role}</h3>
                  <p className={styles.description}>{experience.description}</p>

                  <footer className={styles.cardFooter}>
                    <p className={styles.meta}>
                      <span>{experience.period}</span>
                      <span aria-hidden="true">/</span>
                      <span>{experience.location}</span>
                    </p>
                    <ul className={styles.tags} aria-label={`${experience.role} skills`}>
                      {experience.tags.map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                  </footer>
                </div>
              </article>
            ))}
          </div>
          </div>

          <div className={styles.progress} aria-hidden="true">
            {EXPERIENCES.map((experience, index) => (
              <span
                key={`${experience.role}-progress`}
                ref={(node) => {
                  segmentRefs.current[index] = node;
                }}
                className={styles.progressSegment}
              />
            ))}
          </div>

          <div className={styles.edgeTrack} aria-hidden="true">
            <span ref={edgeProgressRef} className={styles.edgeProgress} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Experience;
