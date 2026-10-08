import type { Metadata } from "next";
import Link from "next/link";
import TrailforgeThumbnail from "@/components/projects/TrailforgeThumbnail";
import { TrailforgeArchitectureDiagram, TrailforgeRuntimeDiagram, TrailforgeDevelopDiagram, TrailforgePublicationDiagram, TrailforgeEvidenceDiagram } from "@/components/projects/TrailforgeDiagrams";
import { trailforgeModules } from "@/content/trailforgeDocument";
import styles from "../synapse/SynapseCaseStudy.module.css";
import trailforge from "./TrailforgeCaseStudy.module.css";

export const metadata: Metadata = {
  title: "Trailforge — Abdul Moiz",
  description: "A custom provider-independent agent harness: bounded execution, durable checkpoints, exact evidence, protected verification, and host-controlled approvals.",
};

export default function TrailforgeCaseStudy() {
  return <main className={`${styles.page} ${trailforge.page}`}>
    <nav className={styles.nav} aria-label="Project navigation"><Link href="/#projects" className={styles.back}>← Back to projects</Link><span>Abdul Moiz / Selected work</span></nav>
    <header className={styles.hero}>
      <div className={styles.heroTopline}><p>Projects / Trailforge</p><p>MIT open source / v0.1.0a1 alpha</p></div>
      <h1>Trailforge</h1>
      <div className={styles.heroSummary}>
        <p className={styles.lede}>Bound the work.<br />Preserve the trail.</p>
        <div className={styles.heroActions}>
          <Link href="/projects/trailforge/description" className={styles.primaryAction}>Read the technical study <span aria-hidden="true">↗</span></Link>
          <a href="/projects/trailforge/description.pdf" download="Trailforge-Technical-Reference-and-User-Guide-v0.1.0a1.pdf" className={styles.secondaryAction}>Download the full guide <span aria-hidden="true">↓</span></a>
          <a href="https://github.com/codera647/Trailforge" target="_blank" rel="noreferrer" className={styles.secondaryAction}>Explore the repository <span aria-hidden="true">↗</span></a>
        </div>
      </div>
      <ul className={styles.heroTags} aria-label="Project technologies">{["Agent harness", "Python 3.11+", "SQLite", "Durable execution", "Verification", "Linux Docker", "Provider independent"].map(tag => <li key={tag}>{tag}</li>)}</ul>
    </header>

    <figure className={`${styles.heroMedia} ${trailforge.cover}`}><div className={trailforge.coverGraphic}><TrailforgeThumbnail /></div><figcaption>An execution system, not a simulated interface. A scoped goal, bounded work, and host verification share a durable trail.</figcaption></figure>

    <section className={styles.intro} aria-labelledby="trailforge-overview">
      <p className={styles.sectionIndex}>00 / The idea</p>
      <div className={styles.introGrid}>
        <h2 id="trailforge-overview">Intelligence proposes.<br />Authority stays<br />with the host.</h2>
        <div className={styles.introCopy}>
          <p>I built Trailforge to make agent execution bounded, recoverable, and inspectable. It separates a model's proposal from a verified result—and a verified result from permission to act outside the system. It is also the harness behind Diffwise.</p>
          <dl>
            <div><dt>Challenge</dt><dd>Opaque agent runs, unsafe retries, and completion claims without retained evidence.</dd></div>
            <div><dt>Approach</dt><dd>Finite contracts, durable checkpoints, digest-bound receipts, and explicit uncertainty.</dd></div>
            <div><dt>Host owns</dt><dd>Identity, actual models/tools, policy, real provider limits, protected criteria, and publishers.</dd></div>
            <div><dt>Release</dt><dd>MIT alpha v0.1.0a1. Zero third-party base dependencies; no production certification.</dd></div>
          </dl>
        </div>
      </div>
    </section>

    <section id="system" className={styles.system} aria-labelledby="trailforge-system">
      <header className={styles.sectionHeading}><p className={styles.sectionIndex}>01 / System architecture</p><h2 id="trailforge-system">A small kernel.<br />Explicit boundaries.</h2><p>The neutral Goal/Task Harness uses SQLite as its authority. Develop extends that execution path; the fixed Offline Review controller is separate. Optional integrations expose the kernel without making model output an authority source.</p></header>
      <div data-lenis-prevent-horizontal><TrailforgeArchitectureDiagram /></div>
      <div className={styles.architectureNotes}>
        <article><span>Work</span><h3>Admit a finite plan.</h3><p>Bind scope, inputs, dependencies, effects, required checks, and declared limits before execution.</p></article>
        <article><span>Evidence</span><h3>Preserve observations.</h3><p>Checkpoints, task receipts, candidate/check digests, and explicit gaps keep the trail inspectable.</p></article>
        <article><span>Authority</span><h3>Keep approval separate.</h3><p>Model proposals do not grant capabilities. Host-controlled checks and exact publication approvals remain distinct.</p></article>
      </div>
    </section>

    <section className={styles.pipeline} aria-labelledby="trailforge-runtime">
      <header className={styles.sectionHeading}><p className={styles.sectionIndex}>02 / Durable execution</p><h2 id="trailforge-runtime">Resume the work.<br />Not the guess.</h2><p>Admission, reservation, and an active attempt are persisted before a callback runs. Valid outputs receive bound receipts. Reconstructed hosts reuse completed task results rather than starting the run over.</p></header>
      <div data-lenis-prevent-horizontal><TrailforgeRuntimeDiagram /></div>
      <div className={styles.architectureNotes}>
        <article><span>Typed checks</span><h3>PASS is not just JSON.</h3><p>Required checks return a host VerifiedResult bound to the same goal. A verdict-shaped model response is not verifier authority.</p></article>
        <article><span>Recovery</span><h3>Retain UNKNOWN.</h3><p>Ambiguous attempts hold the run. Explicit host RETRY or CANCEL retains admitted units and attempt counts.</p></article>
        <article><span>Limits</span><h3>Bound, don&apos;t overclaim.</h3><p>Declared units are not tokens or dollars. Leases fence stale commits, not running Python or provider calls.</p></article>
      </div>
    </section>

    <section className={styles.visuals} aria-labelledby="trailforge-develop">
      <header className={styles.sectionHeading}><p className={styles.sectionIndex}>03 / The Develop profile</p><h2 id="trailforge-develop">Build the candidate.<br />Protect acceptance.</h2><p>One to three explicitly planned rounds run through six phases. BUILD alone receives candidate-write capability. VERIFY checks the exact candidate; HEALTH confirms its continuity before a handoff is issued.</p></header>
      <div data-lenis-prevent-horizontal><TrailforgeDevelopDiagram /></div>
      <p className={trailforge.note}>Candidate/check integrity is checked before and after phase work. Trusted host callbacks are not an OS sandbox; an unchanged, checked handoff is not merge or deployment permission.</p>
    </section>

    <section className={styles.agents} aria-labelledby="trailforge-evidence">
      <header className={styles.sectionHeading}><p className={styles.sectionIndex}>04 / Evidence-bound review</p><h2 id="trailforge-evidence">A finding needs<br />a source trail.</h2><p>The separate Offline Review demonstration binds paths, line ranges, preserved quotes, content digests, and revisions to captured source. Missing coverage stays visible. Its configured review roles use mock output, not bundled live LLM agents.</p></header>
      <div data-lenis-prevent-horizontal><TrailforgeEvidenceDiagram /></div>
    </section>

    <section className={styles.pipeline} aria-labelledby="trailforge-publication">
      <header className={styles.sectionHeading}><p className={styles.sectionIndex}>05 / External-effect boundary</p><h2 id="trailforge-publication">Approve precisely.<br />Never resend blindly.</h2><p>A publication intent binds scope, goal, policy, revision, action, and exact payload. Approval is consumed and a stable SENDING operation is recorded before dispatch. A lost response remains UNKNOWN until the same operation can be inspected.</p></header>
      <div data-lenis-prevent-horizontal><TrailforgePublicationDiagram /></div>
      <p className={trailforge.note}>The included publisher is a durable local simulator. Real customer authentication and external publishers are host integrations; intent deduplication is not a universal exactly-once provider guarantee.</p>
    </section>

    <section className={styles.foundation} aria-labelledby="trailforge-engineering">
      <header className={styles.sectionHeading}><p className={styles.sectionIndex}>06 / Engineering underneath</p><h2 id="trailforge-engineering">Keep the kernel<br />independent.</h2><p>Python&apos;s standard library supplies the base runtime. Optional LangGraph scheduling, legacy PostgreSQL/broker integration, Linux Docker isolation, exact retrieval, artifacts, and allowlisted telemetry are composed deliberately by the host.</p></header>
      <ul className={styles.agentList} aria-label="Trailforge implementation modules">{trailforgeModules.map(([name, detail], index) => <li key={name}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{name}</h3><p>{detail}</p></div></li>)}</ul>
    </section>

    <section className={styles.evaluation} aria-labelledby="trailforge-validation">
      <header className={styles.sectionHeading}><p className={styles.sectionIndex}>07 / Release evidence</p><h2 id="trailforge-validation">Test the boundaries.<br />Name the limits.</h2><p>The v0.1.0a1 guide records installed-wheel, optional integration, and native Linux container conformance. These are documented release results, not new portfolio benchmarks or model-accuracy measurements.</p></header>
      <dl className={trailforge.releaseGrid}>
        <div><dt>Portable matrix</dt><dd>62 <span>cases per OS / Python cell</span></dd></div>
        <div><dt>Legacy PostgreSQL</dt><dd>56 <span>Linux installed-extra cases</span></dd></div>
        <div><dt>Linux Docker</dt><dd>5 <span>container-boundary cases</span></dd></div>
        <div><dt>LangGraph</dt><dd>2 <span>installed-extra cases</span></dd></div>
      </dl>
      <p className={trailforge.note}>The portable matrix covers Ubuntu 24.04 / Windows 2022 × Python 3.11 / 3.13.15. The guide reports zero failures, errors, skips, or expected failures in accepted reports. Alpha APIs can change; independent acceptance and real-provider quality evaluation remain separate gates.</p>
      <div className={trailforge.readMore}><Link href="/projects/trailforge/description" className={styles.primaryAction}>Read the complete engineering study <span aria-hidden="true">↗</span></Link><a href="https://github.com/codera647/Trailforge/releases/tag/v0.1.0a1" target="_blank" rel="noreferrer" className={styles.secondaryAction}>Inspect the alpha release <span aria-hidden="true">↗</span></a></div>
    </section>

    <footer className={styles.footer}><p>Next project / Brand-aware content creation</p><Link href="/projects/contentforge">Explore ContentForge AI <span aria-hidden="true">↗</span></Link><Link href="/#projects">← Back to selected work</Link></footer>
  </main>;
}
