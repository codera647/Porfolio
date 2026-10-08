import styles from "./TrailforgeThumbnail.module.css";

/** An original system graphic, not a simulated product screenshot. */
export default function TrailforgeThumbnail() {
  return <div className={styles.thumbnail} data-trailforge-thumbnail>
    <svg viewBox="0 0 880 460" role="img" aria-labelledby="trailforge-thumbnail-title trailforge-thumbnail-description">
      <title id="trailforge-thumbnail-title">Trailforge — bounded execution, durable trails</title>
      <desc id="trailforge-thumbnail-description">A scoped goal passes through bounded execution and host verification, with checkpoints preserved along the way.</desc>
      <g className={styles.grid} fill="none" stroke="currentColor">
        <path d="M0 92h880M0 184h880M0 276h880M0 368h880M88 0v460M176 0v460M264 0v460M352 0v460M440 0v460M528 0v460M616 0v460M704 0v460M792 0v460" />
      </g>
      <text x="56" y="55" className={styles.eyebrow}>CUSTOM AGENT HARNESS</text>
      <text x="824" y="55" textAnchor="end" className={styles.version}>MIT / ALPHA</text>
      <g transform="translate(60 105)" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={styles.emblem}>
        <path d="M8 90V24L56 0l48 24v66L56 114 8 90ZM8 24l48 24 48-24M56 48v66M30 37v41l26 13 26-13V37" />
        <circle cx="56" cy="64" r="7" fill="currentColor" stroke="none" />
      </g>
      <text x="203" y="189" className={styles.wordmark}>Trailforge</text>
      <text x="205" y="229" className={styles.tagline}>BOUND THE WORK. PRESERVE THE TRAIL.</text>
      <g className={styles.connection} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M264 337h48m-9-6 9 6-9 6M564 337h48m-9-6 9 6-9 6" />
        <path d="M717 367v42H162v-42" strokeDasharray="5 7" />
      </g>
      <g className={styles.node}>
        <rect x="56" y="301" width="208" height="72" rx="14" />
        <text x="160" y="346" textAnchor="middle">Scoped goal</text>
        <rect x="312" y="301" width="252" height="72" rx="14" className={styles.accent} />
        <text x="438" y="346" textAnchor="middle">Bounded execution</text>
        <rect x="612" y="301" width="212" height="72" rx="14" />
        <text x="718" y="346" textAnchor="middle">Host verification</text>
      </g>
      <rect x="294" y="397" width="287" height="25" fill="var(--canvas)" />
      <text x="438" y="415" textAnchor="middle" className={styles.checkpoint}>CHECKPOINTS / RECEIPTS / RECOVERY</text>
    </svg>
  </div>;
}
