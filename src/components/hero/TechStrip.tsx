import type { CSSProperties } from "react";
import { TECH_ICONS } from "@/vendor/simple-icons/techIcons";
import styles from "./TechStrip.module.css";

/**
 * The tech strip, sitting in the gap between the bottom-left line and the
 * profile marks.
 *
 * Each mark gets its own staggered start into one shared animation, so they
 * spread evenly across the band, grow toward its centre and fade out at its
 * ends. All of the behaviour is in the stylesheet; this only supplies the index
 * each mark starts from.
 *
 * Accessibility: sixteen unlabelled shapes announced one by one would be noise,
 * so the marks are hidden from assistive tech and one plain line carries the
 * names instead (s5.12 - decorative detail must not become reading content).
 */
export function TechStrip({ className }: { className?: string }) {
  const names = TECH_ICONS.map((i) => i.label).join(", ");

  return (
    <div className={[styles.strip, className].filter(Boolean).join(" ")}>
      <span className="sr-only">Built with: {names}.</span>

      {TECH_ICONS.map((icon, i) => (
        <span
          key={icon.slug}
          className={styles.item}
          aria-hidden="true"
          style={{ "--i": i } as CSSProperties}
        >
          <svg
            className={styles.mark}
            viewBox="0 0 24 24"
            focusable="false"
            aria-hidden="true"
          >
            <path d={icon.path} fill="currentColor" />
          </svg>
        </span>
      ))}
    </div>
  );
}

export default TechStrip;
