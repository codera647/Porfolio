import type { ReactNode } from "react";
import styles from "./Button.module.css";

type Props = {
  href: string;
  variant: "primary" | "secondary";
  children: ReactNode;
  className?: string;
};

/**
 * Both hero CTAs are in-page links, not form controls, so they are anchors:
 * "View work" leads to Selected work and "Let's talk" to Contact (s5.12).
 */
export function Button({ href, variant, children, className }: Props) {
  return (
    <a
      href={href}
      className={[styles.button, styles[variant], className].filter(Boolean).join(" ")}
    >
      {children}
      <span className={styles.arrow} aria-hidden="true">
        ↗
      </span>
    </a>
  );
}

export default Button;
