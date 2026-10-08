import type { Metadata } from "next";
import Link from "next/link";
import ProjectPreviewVideo from "@/components/projects/ProjectPreviewVideo";
import SynapseWalkthrough from "@/components/projects/SynapseWalkthrough";
import { ContentforgeArchitectureDiagram, ContentforgeGenerationDiagram, ContentforgeWorkflowDiagram, ContentforgeDataDiagram } from "@/components/projects/ContentforgeDiagrams";
import { contentforgeFormats, contentforgeModules, contentforgeProviders, contentforgeScreens } from "@/content/contentforge";
import styles from "../synapse/SynapseCaseStudy.module.css";
import contentforge from "./ContentforgeCaseStudy.module.css";

export const metadata: Metadata = {
  title: "ContentForge AI — Abdul Moiz",
  description: "Brand-aware marketing content generation, distinct creative variations, repurposing, and calendar planning in one authenticated workspace.",
};

export default function ContentforgeCaseStudy() {
  return <main className={`${styles.page} ${contentforge.page}`}>
    <nav className={styles.nav} aria-label="Project navigation">
      <Link href="/#projects" className={styles.back}>← Back to projects</Link>
      <span>Abdul Moiz / Selected work</span>
    </nav>
    <header className={styles.hero}>
      <div className={styles.heroTopline}><p>Projects / ContentForge AI</p><p>Generative AI + content workflows</p></div>
      <h1>ContentForge AI</h1>
      <div className={styles.heroSummary}>
        <p className={styles.lede}>Your voice, defined once.<br />Carried through every draft.</p>
        <div className={styles.heroActions}>
          <a href="#demo" className={styles.primaryAction}>See the demo <span aria-hidden="true">↓</span></a>
          <Link href="/projects/contentforge/description" className={styles.secondaryAction}>Read the technical study <span aria-hidden="true">↗</span></Link>
          <a href="https://github.com/codera647/ContentForge_AI" target="_blank" rel="noreferrer" className={styles.secondaryAction}>Explore the repository <span aria-hidden="true">↗</span></a>
        </div>
      </div>
      <ul className={styles.heroTags} aria-label="Project technologies">
        {["Generative AI", "Brand voice", "Next.js", "TypeScript", "Prisma / PostgreSQL", "Clerk", "Google Calendar"].map(tag => <li key={tag}>{tag}</li>)}
      </ul>
    </header>

    <section id="demo" className={styles.heroMedia} aria-label="ContentForge AI workflow demonstration">
      <ProjectPreviewVideo className={`${styles.caseVideo} ${contentforge.video}`} src="/projects/contentforge/demo-2.mp4" poster="/projects/contentforge/poster-2.jpg" label="ContentForge AI demo: brand configuration and content creation workflow" eager />
      <p className={contentforge.caption}>Define a brand voice → build a brief → generate content → keep and plan the work.</p>
    </section>

    <section className={styles.intro} aria-labelledby="contentforge-overview">
      <p className={styles.sectionIndex}>00 / The idea</p>
      <div className={styles.introGrid}>
        <h2 id="contentforge-overview">More than<br />another prompt box.</h2>
        <div className={styles.introCopy}>
          <p>Marketing teams and independent creators need consistent voice across different formats. ContentForge AI makes that context reusable: define the brand, write a brief, compare different creative approaches, and carry the result into a searchable library and planning calendar.</p>
          <dl>
            <div><dt>Challenge</dt><dd>Generic copy, repeated prompting, and drafts scattered across disconnected tools.</dd></div>
            <div><dt>Approach</dt><dd>Reusable brand context + format-aware generation + a durable content workflow.</dd></div>
            <div><dt>Workspace</dt><dd>Individual authenticated workspaces with ownership-scoped records.</dd></div>
            <div><dt>Boundary</dt><dd>Planning and Google Calendar synchronization, not automatic social publishing.</dd></div>
          </dl>
        </div>
      </div>
    </section>

    <SynapseWalkthrough project="ContentForge AI" screens={contentforgeScreens} title="From a brand voice to a planned release." imageBackground="#f6f4ef" />

    <section id="system" className={styles.system} aria-labelledby="contentforge-system">
      <header className={styles.sectionHeading}>
        <p className={styles.sectionIndex}>02 / System architecture</p>
        <h2 id="contentforge-system">A complete workflow.<br />Clear boundaries.</h2>
        <p>The Next.js application owns both the product interface and API routes. Clerk establishes identity, Prisma scopes persisted records, and a server-only adapter connects generation to the selected AI provider.</p>
      </header>
      <ContentforgeArchitectureDiagram />
      <div className={styles.architectureNotes}>
        <article><span>Context</span><h3>Keep the voice.</h3><p>Eleven brand fields carry identity, audience, personality, phrases, values, style, and example writing into generation and repurposing.</p></article>
        <article><span>Generation</span><h3>Change the approach.</h3><p>Direct, Story-driven, and Educational strategies produce different structures rather than simply requesting paraphrases.</p></article>
        <article><span>Workflow</span><h3>Keep the result.</h3><p>Saved drafts remain editable, searchable, reusable, and schedulable. A connected calendar is an optional extension.</p></article>
      </div>
    </section>

    <section className={styles.pipeline} aria-labelledby="contentforge-generation">
      <header className={styles.sectionHeading}>
        <p className={styles.sectionIndex}>03 / The generation pipeline</p>
        <h2 id="contentforge-generation">One brief.<br />Different directions.</h2>
        <p>Format constraints, audience, objective, tone, length, keywords, and CTA are combined with the brand profile. Up to three independent requests run in parallel; their JSON title and body are validated before previewing or saving.</p>
      </header>
      <ul className={contentforge.formats} aria-label="Supported content formats">{contentforgeFormats.map(format => <li key={format}>{format}</li>)}</ul>
      <ContentforgeGenerationDiagram />
      <div className={styles.modelGrid}>
        <div className={styles.modelIntro}><p>Provider configuration</p><h3>Keep the workflow.<br />Switch the model.</h3></div>
        <dl>{contentforgeProviders.map(([role, name, detail]) => <div key={role}><dt>{role}</dt><dd><strong className={contentforge.modelName}>{name}</strong><span className={contentforge.modelDetail}>{detail}</span></dd></div>)}</dl>
      </div>
      <p className={contentforge.note}>These are configurable code defaults, not claims about which model ran every demo. Brand instructions guide generation; human review is still needed for facts, voice, and compliance.</p>
    </section>

    <section className={styles.visuals} aria-labelledby="contentforge-workflow">
      <header className={styles.sectionHeading}>
        <p className={styles.sectionIndex}>04 / Reuse &amp; planning</p>
        <h2 id="contentforge-workflow">A draft shouldn&apos;t<br />be a dead end.</h2>
        <p>Repurpose a saved piece into another format while retaining the voice and source relationship. Schedule it on the monthly calendar, then optionally synchronize a Google event. Local plans remain saved when external synchronization fails.</p>
      </header>
      <ContentforgeWorkflowDiagram />
      <ContentforgeDataDiagram />
    </section>

    <section className={styles.foundation} aria-labelledby="contentforge-engineering">
      <header className={styles.sectionHeading}>
        <p className={styles.sectionIndex}>05 / Engineering underneath</p>
        <h2 id="contentforge-engineering">Useful AI needs<br />reliable plumbing.</h2>
        <p>Authentication, ownership checks, bounded retries, atomic usage reservations, and transactional scheduling support the creative workflow. The implementation includes Vitest coverage for these boundaries; this case study does not claim newly measured benchmark results.</p>
      </header>
      <ul className={styles.agentList} aria-label="ContentForge AI backend modules">{contentforgeModules.map(([name, detail], index) => <li key={name}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{name}</h3><p>{detail}</p></div></li>)}</ul>
      <div className={styles.architectureNotes}>
        <article><span>Bounded usage</span><h3>Explicit allowances.</h3><p>Up to three brands and 50 generation or repurposing operations per user per UTC day. Accepted operations consume quota even if the provider later fails.</p></article>
        <article><span>Provider resilience</span><h3>Retry selectively.</h3><p>Transient network errors, rate limits, and selected server failures receive bounded retries. Unreadable responses produce a recoverable user-facing error.</p></article>
        <article><span>Calendar consistency</span><h3>Save first. Sync safely.</h3><p>Database transactions protect planning records. Per-schedule advisory locks and stable Google event IDs reduce concurrent-update duplication.</p></article>
      </div>
    </section>

    <footer className={styles.footer}>
      <p>Next project / Agentic document intelligence</p>
      <Link href="/projects/synapse">Explore Synapse <span aria-hidden="true">↗</span></Link>
      <Link href="/#projects">← Back to selected work</Link>
    </footer>
  </main>;
}
