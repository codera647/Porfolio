import type { ReactNode } from "react";
import styles from "./BracketButton.module.css";

type Props = {
  href?: string;
  onClick?: () => void;
  controls?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Pale filled button whose crop-mark corners step outward on hover, matching
 * the reference Nex supplied. The corners are decoration; the label carries the
 * meaning, and the hover state is a shape change rather than colour alone, so
 * it still reads without colour perception (s5.12).
 */
export function BracketButton({ href, onClick, controls, children, className }: Props) {
  const content = (
    <>
      <span className={styles.marker} aria-hidden="true" />
      {children}
      <span className={`${styles.corner} ${styles.tl}`} aria-hidden="true" />
      <span className={`${styles.corner} ${styles.tr}`} aria-hidden="true" />
      <span className={`${styles.corner} ${styles.bl}`} aria-hidden="true" />
      <span className={`${styles.corner} ${styles.br}`} aria-hidden="true" />
    </>
  );

  const buttonClass = [styles.button, className].filter(Boolean).join(" ");

  if (href) {
    return <a href={href} className={buttonClass}>{content}</a>;
  }

  return (
    <button
      type="button"
      className={buttonClass}
      onClick={onClick}
      aria-haspopup="dialog"
      aria-controls={controls}
    >
      {content}
    </button>
  );
}

export default BracketButton;
