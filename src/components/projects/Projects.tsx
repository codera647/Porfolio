import Link from "next/link";
import ProjectPreviewVideo from "./ProjectPreviewVideo";
import styles from "./Projects.module.css";

export function Projects() {
  return (
    <section id="projects" className={styles.section} aria-labelledby="projects-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Selected work</p>
        <h2 id="projects-title" className={styles.title}>
          What I&apos;ve Been <span>Building</span>
        </h2>
      </header>

      <div className={styles.projectGrid}>
        <article className={`${styles.project} ${styles.lockedProject}`} aria-labelledby="diffwise-project-title" aria-describedby="diffwise-availability" data-project="diffwise">
          <div className={styles.projectHeading}>
            <div>
              <p>Diffwise / Evidence-bound PR review</p>
              <h3>Code reviews grounded in evidence, with humans in control</h3>
            </div>
            <span className={styles.productionStatus}>In production</span>
          </div>
          <div className={`${styles.media} ${styles.lockedMedia}`}>
            <span className={styles.lockBadge}>
              Locked
              <svg width="20" height="24" viewBox="0 0 24 28" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="4" y="12" width="16" height="13" rx="2" />
                <path d="M8 12V8a4 4 0 0 1 8 0v4" />
              </svg>
            </span>
            <div className={styles.lockedWordmark} aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13" cy="10" r="4" />
                <circle cx="13" cy="38" r="4" />
                <circle cx="35" cy="38" r="4" />
                <path d="M13 14v20M35 34V22a8 8 0 0 0-8-8h-5m4-4-4 4 4 4" />
              </svg>
              <span>Diffwise</span>
            </div>
          </div>
          <div className={styles.projectMeta}>
            <div>
              <h4 id="diffwise-project-title">Diffwise</h4>
              <p>Pull-request review built on Trailforge</p>
              <p className={styles.lockedAvailability} id="diffwise-availability">Private case study</p>
            </div>
            <ul aria-label="Diffwise capabilities">
              <li>Agentic review</li>
              <li>Human approval</li>
              <li>Durable workflows</li>
            </ul>
          </div>
        </article>
        <Link
          href="/projects/contentforge"
          className={styles.project}
          aria-label="Open the ContentForge AI project case study"
          data-project="contentforge"
        >
          <div className={styles.projectHeading}>
            <div>
              <p>ContentForge AI / Brand-aware content creation</p>
              <h3>One brand voice, from the first brief to the content calendar</h3>
            </div>
            <span>View project ↗</span>
          </div>
          <div className={`${styles.media} ${styles.containedMedia}`}>
            <ProjectPreviewVideo
              src="/projects/contentforge/demo-1.mp4"
              poster="/projects/contentforge/poster-1.jpg"
              label="ContentForge AI product overview"
            />
          </div>
          <div className={`${styles.projectMeta} ${styles.projectMetaWide}`}>
            <div>
              <h4>ContentForge AI</h4>
              <p>Brand-aware generation, repurposing &amp; content planning</p>
            </div>
            <ul aria-label="ContentForge AI capabilities">
              <li>Generative AI</li>
              <li>Brand voice</li>
              <li>Content workflows</li>
            </ul>
          </div>
        </Link>
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
