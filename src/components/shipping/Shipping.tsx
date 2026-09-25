"use client";

import { useEffect, useRef } from "react";
import { TECH_ICONS } from "@/vendor/simple-icons/techIcons";
import styles from "./Shipping.module.css";

const SHIPPING_FOLLOW_THROUGH_MS = 285;

const TOOL_SLUGS = [
  "python",
  "pytorch",
  "scikitlearn",
  "opencv",
  "fastapi",
  "docker",
  "postgresql",
  "googlecloud",
] as const;

const TOOLS = TOOL_SLUGS.map((slug) => {
  const icon = TECH_ICONS.find((candidate) => candidate.slug === slug);
  if (!icon) throw new Error(`Missing vendored icon: ${slug}`);
  return icon;
});

const SERVICES = [
  {
    title: "Machine Learning Systems",
    description:
      "Models engineered for rigorous evaluation, observability, deployment, and ongoing monitoring.",
    tags: ["MLOps", "Model evaluation", "Observability", "Monitoring"],
    icon: "network",
    accent: true,
  },
  {
    title: "AI Applications",
    description:
      "Useful AI workflows with context, guardrails, and deliberate human handoff.",
    tags: ["RAG systems", "Evaluation loops", "Human-in-the-loop"],
    icon: "sparkles",
    accent: false,
  },
  {
    title: "Vision Intelligence",
    description:
      "Computer vision pipelines that turn visual input into dependable signals.",
    tags: ["Image analysis", "Detection pipelines", "Data quality"],
    icon: "vision",
    accent: true,
  },
  {
    title: "Production Architecture",
    description:
      "Data, APIs, and infrastructure shaped for reliable operation as needs grow.",
    tags: ["FastAPI", "Containers", "Cloud deployment"],
    icon: "layers",
    accent: false,
  },
] as const;

type ServiceIconName = (typeof SERVICES)[number]["icon"];

function ServiceIcon({ name }: { name: ServiceIconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {name === "network" && (
        <>
          <rect x="8" y="3" width="8" height="6" rx="2" />
          <rect x="3" y="15" width="7" height="6" rx="2" />
          <rect x="14" y="15" width="7" height="6" rx="2" />
          <path d="M12 9v3m0 0H6.5v3M12 12h5.5v3" />
        </>
      )}
      {name === "sparkles" && (
        <>
          <path d="m12 2 1.3 4.2a6.2 6.2 0 0 0 4.2 4.2L22 12l-4.5 1.6a6.2 6.2 0 0 0-4.2 4.2L12 22l-1.3-4.2a6.2 6.2 0 0 0-4.2-4.2L2 12l4.5-1.6a6.2 6.2 0 0 0 4.2-4.2L12 2Z" />
          <path d="m19 2 .35 1.15A2.5 2.5 0 0 0 21 4.8l1 .35-1 .35a2.5 2.5 0 0 0-1.65 1.65L19 8.3l-.35-1.15A2.5 2.5 0 0 0 17 5.5l-1-.35 1-.35a2.5 2.5 0 0 0 1.65-1.65L19 2Z" />
        </>
      )}
      {name === "vision" && (
        <>
          <path d="M2.5 12s3.3-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.3 5.5-9.5 5.5S2.5 12 2.5 12Z" />
          <circle cx="12" cy="12" r="2.75" />
        </>
      )}
      {name === "layers" && (
        <>
          <path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" />
          <path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5" />
        </>
      )}
    </svg>
  );
}

/**
 * The first capability is present on arrival. Each following card is mapped to
 * one segment of the pinned scroll track and rises over the previous card.
 */
export function Shipping() {
  const trackRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const track = trackRef.current;
    const cards = cardRefs.current;
    if (!track || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let frame: number | null = null;
    let targetProgress = 0;
    let currentProgress = 0;
    let previousFrameTime = performance.now();
    let cardTravel = window.innerHeight;
    const transitionCount = SERVICES.length - 1;

    const measureCardTravel = () => {
      const shell = shellRef.current;
      const deck = deckRef.current;
      const firstCard = cards[0];
      if (!shell || !deck || !firstCard) return;

      const shellRect = shell.getBoundingClientRect();
      const deckRect = deck.getBoundingClientRect();
      const landingTop = deckRect.top + firstCard.offsetTop;
      // Start with the incoming card's top just below the section's bottom
      // border, so it travels through the section rather than out of the deck.
      cardTravel = Math.max(420, shellRect.bottom - landingTop + 18);
    };

    const setCardProgress = (card: HTMLElement, index: number, progress: number) => {
      // Smoothstep eases into and out of the travel. The previous cubic-out
      // curve moved most of the distance immediately after a wheel event.
      const eased = progress * progress * (3 - 2 * progress);
      const remaining = 1 - eased;
      card.style.setProperty("--card-y", `${remaining * cardTravel}px`);
      card.style.setProperty("--card-x", `${remaining * (index % 2 === 0 ? 72 : 96)}px`);
      card.style.setProperty("--card-rotate", `${remaining * (index % 2 === 0 ? -6.5 : 7.5)}deg`);
      card.style.setProperty("--card-scale", `${0.93 + eased * 0.07}`);
    };

    const render = (progress: number) => {
      cards.forEach((card, index) => {
        if (!card) return;
        if (index === 0) {
          setCardProgress(card, index, 1);
          return;
        }

        const segmentStart = (index - 1) / transitionCount;
        const segmentSize = 1 / transitionCount;
        // Hold briefly before and after each entrance. Smoothstep has zero
        // velocity at both ends, so a delayed card never snaps into motion.
        const segmentProgress = (progress - segmentStart) / segmentSize;
        const local = Math.min(
          1,
          Math.max(0, (segmentProgress - 0.1) / 0.8),
        );
        setCardProgress(card, index, local);
      });
    };

    const measureProgress = () => {
      const rect = track.getBoundingClientRect();
      const distance = rect.height - window.innerHeight;
      if (distance <= 0) return 0;
      return Math.min(1, Math.max(0, -rect.top / distance));
    };

    const tick = (time: number) => {
      const elapsed = Math.min(64, time - previousFrameTime);
      previousFrameTime = time;
      // Time-based damping keeps the same feel on 60 Hz and high-refresh
      // displays and gently catches up after larger wheel/trackpad deltas.
      const damping = 1 - Math.exp(-elapsed / SHIPPING_FOLLOW_THROUGH_MS);
      currentProgress += (targetProgress - currentProgress) * damping;
      if (Math.abs(targetProgress - currentProgress) < 0.0005) {
        currentProgress = targetProgress;
      }
      render(currentProgress);
      frame = currentProgress === targetProgress ? null : requestAnimationFrame(tick);
    };

    const onScroll = () => {
      targetProgress = measureProgress();
      if (frame === null) {
        previousFrameTime = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };

    measureCardTravel();
    targetProgress = measureProgress();
    currentProgress = targetProgress;
    render(currentProgress);
    window.addEventListener("scroll", onScroll, { passive: true });
    const onResize = () => {
      measureCardTravel();
      onScroll();
    };
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section
      id="what-i-help-you-ship"
      className={styles.section}
      aria-labelledby="shipping-title"
    >
      <div ref={trackRef} className={styles.track}>
        <div className={styles.stage}>
          <div ref={shellRef} className={styles.card}>
            <div className={styles.content}>
              <div className={styles.intro}>
                <h2 id="shipping-title" className={styles.title}>
                  What I help
                  <br />
                  <span className={styles.titleLine}>
                    you to <span className={styles.titleAccent}>ship...</span>
                  </span>
                </h2>

                <div className={styles.tools}>
                  <p className={styles.toolsLabel}>Tools I use</p>
                  <ul className={styles.toolList} aria-label="Technologies I use">
                    {TOOLS.map((tool) => (
                      <li key={tool.slug} className={styles.tool} title={tool.label}>
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path d={tool.path} fill="currentColor" />
                        </svg>
                        <span className="sr-only">{tool.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div ref={deckRef} className={styles.deck} aria-label="Areas I help build">
                {SERVICES.map((service, index) => (
                  <article
                    key={service.title}
                    ref={(node) => {
                      cardRefs.current[index] = node;
                    }}
                    className={`${styles.serviceCard} ${service.accent ? styles.accent : ""}`}
                    style={{ zIndex: index + 1 }}
                  >
                    <span className={styles.cardIcon}>
                      <ServiceIcon name={service.icon} />
                    </span>
                    <h3 className={styles.cardTitle}>{service.title}</h3>
                    <p className={styles.description}>{service.description}</p>
                    <div className={styles.tags} aria-label={`${service.title} capabilities`}>
                      {service.tags.map((tag) => (
                        <span key={tag} className={styles.tag}>{tag}</span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Shipping;
