import Link from "next/link";
import ProjectPreviewVideo from "./ProjectPreviewVideo";
import styles from "./Projects.module.css";

export function Projects() {
  return (
    <section id="projects" className={styles.section} aria-labelledby="projects-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Selected work / 02</p>
        <h2 id="projects-title" className={styles.title}>
          What I&apos;ve Been <span>Building</span>
        </h2>
      </header>

      <div className={styles.projectGrid}>
        <Link
          href="/projects/synapse"
          className={styles.project}
          aria-label="Open the Synapse project case study"
        >
          <div className={styles.projectHeading}>
            <div>
              <p>Synapse / Agentic document intelligence</p>
              <h3>A research workspace that keeps every answer tied to evidence</h3>
            </div>
            <span>View project ↗</span>
          </div>
          <div className={styles.media}>
            <ProjectPreviewVideo />
            <span className={styles.projectIndex} aria-hidden="true">01</span>
          </div>

          <div className={styles.projectMeta}>
          <div>
            <h4>Synapse</h4>
            <p>Multi-tenant agentic document intelligence</p>
          </div>
          <ul aria-label="Synapse technologies">
            <li>Agentic RAG</li>
            <li>Document AI</li>
            <li>Knowledge graphs</li>
          </ul>
          </div>
        </Link>
        <Link
          href="/projects/autobg"
          className={styles.project}
          aria-label="Open the AutoBG project case study"
        >
          <div className={styles.projectHeading}>
            <div>
              <p>AutoBG / AI automotive imaging</p>
              <h3>From an everyday car photo to a studio-ready image</h3>
            </div>
            <span>View project ↗</span>
          </div>
          <div className={`${styles.media} ${styles.autobgMedia}`}>
            <ProjectPreviewVideo
              src="/projects/autobg/demo.mp4"
              poster="/projects/autobg/poster.jpg"
              label="AutoBG car background removal and studio compositing demonstration"
            />
            <span className={styles.projectIndex} aria-hidden="true">02</span>
          </div>
          <div className={styles.projectMeta}>
            <div>
              <h4>AutoBG</h4>
              <p>AI-powered car background removal &amp; studio compositing</p>
            </div>
            <ul aria-label="AutoBG technologies">
              <li>Computer vision</li>
              <li>SDXL</li>
              <li>ControlNet</li>
            </ul>
          </div>
        </Link>
      </div>
    </section>
  );
}

export default Projects;
