import type { CSSProperties } from "react";
import styles from "./SynapseBenchmarkCharts.module.css";

const RETRIEVAL_RESULTS = [
  ["Overall", 0.839],
  ["1-hop", 1.0],
  ["2-hop", 1.0],
  ["3-hop", 0.773],
  ["Born-digital", 0.857],
  ["Scanned", 0.824],
] as const;

const ANSWER_RESULTS = [
  { judge: "Judge B", correct: 70, partial: 12, incorrect: 18 },
  { judge: "Judge A", correct: 80, partial: 14, incorrect: 6 },
] as const;

export function SynapseBenchmarkCharts() {
  return (
    <div className={styles.results}>
      <figure className={styles.figure}>
        <header>
          <p>Retrieval quality</p>
          <h4>Document-level hit@5</h4>
        </header>
        <div className={styles.verticalChart}>
          <div className={styles.yAxis} aria-hidden="true">
            <span>1.0</span><span>0.8</span><span>0.6</span><span>0.4</span><span>0.2</span><span>0.0</span>
          </div>
          <div className={styles.plot}>
            <span className={styles.baseline} style={{ bottom: "83.9%" }} aria-hidden="true" />
            {RETRIEVAL_RESULTS.map(([label, value]) => (
              <div
                className={styles.barColumn}
                key={label}
                style={{ "--value": value } as CSSProperties}
              >
                <span className={styles.barValue}>{value.toFixed(3)}</span>
                <span
                  className={styles.verticalBar}
                  aria-label={`${label}: ${value.toFixed(3)}`}
                />
                <span className={styles.barLabel}>{label}</span>
              </div>
            ))}
          </div>
          <span className={styles.axisTitle}>Document-level hit@5</span>
        </div>
        <figcaption>
          Exact supplied results: 0.839 overall, perfect 1-hop and 2-hop retrieval,
          0.773 for 3-hop, 0.857 for born-digital documents, and 0.824 for scans.
        </figcaption>
      </figure>

      <figure className={styles.figure}>
        <header>
          <p>Answer quality</p>
          <h4>Dual-judge result distribution</h4>
        </header>
        <div className={styles.legend} aria-label="Answer result legend">
          <span><i className={styles.correct} />Correct</span>
          <span><i className={styles.partial} />Partially correct</span>
          <span><i className={styles.incorrect} />Incorrect</span>
        </div>
        <div className={styles.stackedChart}>
          {ANSWER_RESULTS.map((row) => (
            <div className={styles.judgeRow} key={row.judge}>
              <strong>{row.judge}</strong>
              <div className={styles.stackBar} aria-label={`${row.judge}: ${row.correct}% correct, ${row.partial}% partially correct, ${row.incorrect}% incorrect`}>
                <span className={styles.correct} style={{ width: `${row.correct}%` }}>{row.correct}%</span>
                <span className={styles.partial} style={{ width: `${row.partial}%` }}>{row.partial}%</span>
                <span className={styles.incorrect} style={{ width: `${row.incorrect}%` }}>{row.incorrect}%</span>
              </div>
            </div>
          ))}
          <div className={styles.scale} aria-hidden="true">
            <span>0</span><span>20</span><span>40</span><span>60</span><span>80</span><span>100%</span>
          </div>
        </div>
        <figcaption>
          Judge A: 80% correct, 14% partially correct, 6% incorrect. Judge B:
          70% correct, 12% partially correct, 18% incorrect.
        </figcaption>
      </figure>
    </div>
  );
}

export default SynapseBenchmarkCharts;
