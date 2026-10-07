import type { Metadata } from "next";
import Link from "next/link";
import SynapseBenchmarkCharts from "@/components/projects/SynapseBenchmarkCharts";
import ProjectPreviewVideo from "@/components/projects/ProjectPreviewVideo";
import {
  AgentArtifactDiagram,
  ArchitectureDiagram,
  ChatFlowDiagram,
  DataModelDiagram,
  DeploymentDiagram,
  EvaluationDiagram,
  KnowledgeGraphDiagram,
  PipelineDiagram,
} from "@/components/projects/SynapseDiagrams";
import SynapseWalkthrough from "@/components/projects/SynapseWalkthrough";
import styles from "./SynapseCaseStudy.module.css";

const DEMO_URL = "https://drive.google.com/drive/folders/1ISiWyhTqShDfFl5sUXvT1Im0YKf_7RjV?usp=drive_link";

export const metadata: Metadata = {
  title: "Synapse — Abdul Moiz",
  description: "A case study of Synapse, a multi-tenant agentic document-intelligence platform.",
};

const AGENTS = [
  ["Planner", "Classifies intent, rewrites the query, and decomposes complex requests."],
  ["Retriever", "Fans out dense and lexical search, expands neighbours, then reranks evidence."],
  ["Extractor", "Turns retrieved passages into concise notes that retain chunk and page attribution."],
  ["Retrieval grader", "Checks relevance and sufficiency before the answer is allowed to proceed."],
  ["Gap finder", "Runs bounded critique rounds and creates focused searches for missing evidence."],
  ["Synthesizer", "Builds the final answer from the consolidated evidence and available visuals."],
  ["Faithfulness verifier", "Flags unsupported claims and triggers a correction pass when required."],
] as const;

const MODELS = [
  ["Layout", "DocLayout-YOLO · DocStructBench weights"],
  ["OCR", "Surya OCR, with optional GLM-OCR fallback"],
  ["Visual understanding", "Qwen2.5-VL-72B via OpenRouter · Qwen2-VL-2B local fallback"],
  ["Embeddings", "BAAI/bge-large-en-v1.5 · 1024-dimensional vectors"],
  ["Reranking", "BGE reranker v2-m3 inline · BGE reranker base in worker mode"],
  ["Agent reasoning", "OpenAI GPT family · configurable independently for each role"],
] as const;

export default function SynapseCaseStudy() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Project navigation">
        <Link href="/#projects" className={styles.back}>← Back to projects</Link>
        <span>Abdul Moiz / Selected work</span>
      </nav>

      <header className={styles.hero}>
        <div className={styles.heroTopline}>
          <p>Projects / Synapse</p>
          <p>Solo product design &amp; engineering</p>
        </div>
        <h1>Synapse</h1>
        <div className={styles.heroSummary}>
          <p className={styles.lede}>
            A multi-tenant research workspace that turns document collections into
            grounded answers, inspectable evidence, and reusable visual artefacts.
          </p>
          <div className={styles.heroActions}>
            <a href={DEMO_URL} target="_blank" rel="noreferrer" className={styles.primaryAction}>
              Open project demo <span aria-hidden="true">↗</span>
            </a>
            <a href="#system" className={styles.secondaryAction}>Explore the system ↓</a>
          </div>
        </div>
        <ul className={styles.heroTags} aria-label="Project areas">
          <li>Agentic RAG</li><li>Document AI</li><li>Multi-tenant SaaS</li><li>GPU pipeline</li><li>Knowledge graphs</li>
        </ul>
      </header>

      <section className={styles.heroMedia} aria-label="Synapse demo video">
        <ProjectPreviewVideo className={styles.caseVideo} eager />
      </section>

      <section className={styles.intro} aria-labelledby="overview-title">
        <p className={styles.sectionIndex}>00 / Overview</p>
        <div className={styles.introGrid}>
          <h2 id="overview-title">Research software should show its work.</h2>
          <div className={styles.introCopy}>
            <p>
              Synapse ingests PDFs and Google Drive libraries, understands layout and visual
              regions, and answers across one or many documents with page-level evidence.
              The system was built end to end—from the Next.js product and tenant model to the
              FastAPI orchestration layer, GPU workers, retrieval pipeline, and evaluation harness.
            </p>
            <dl>
              <div><dt>Role</dt><dd>Solo builder</dd></div>
              <div><dt>Surface</dt><dd>Web application + GPU backend</dd></div>
              <div><dt>Focus</dt><dd>Grounding, traceability, collaboration</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <SynapseWalkthrough />

      <section id="system" className={styles.system} aria-labelledby="system-title">
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>02 / System</p>
          <h2 id="system-title">Three planes, one traceable path.</h2>
          <p>
            The product separates the edge experience, GPU execution, and shared state so
            ingestion and chat workloads can scale without blurring tenant boundaries.
          </p>
        </div>
        <ArchitectureDiagram />
        <div className={styles.architectureNotes}>
          <article><span>Edge</span><h3>Fast product surface</h3><p>Next.js 16 and React 19 are deployed through OpenNext on Cloudflare Workers, with API proxying and object delivery at the edge.</p></article>
          <article><span>Compute</span><h3>Demand-driven workers</h3><p>FastAPI coordinates queue-backed stages. The worker pool scales against pending work and packs model processes to the available VRAM budget.</p></article>
          <article><span>State</span><h3>Durable and tenant-aware</h3><p>Supabase holds organizations, membership, conversations, jobs, and pgvector embeddings; R2 stores source and derived artefacts.</p></article>
        </div>
      </section>

      <section className={styles.agents} aria-labelledby="agents-title">
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>03 / Multi-agent retrieval</p>
          <h2 id="agents-title">Reasoning is a controlled loop, not one prompt.</h2>
          <p>
            Query classes route work differently. Spotlight questions stay narrow; comparison,
            aggregation, multi-hop, and multi-entity requests widen retrieval and can run bounded
            gap-filling passes before synthesis.
          </p>
        </div>
        <ChatFlowDiagram />
        <ol className={styles.agentList}>
          {AGENTS.map(([name, description], index) => (
            <li key={name}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{name}</h3><p>{description}</p></div></li>
          ))}
        </ol>
      </section>

      <section className={styles.pipeline} aria-labelledby="pipeline-title">
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>04 / Document intelligence</p>
          <h2 id="pipeline-title">Documents become structured, searchable evidence.</h2>
          <p>
            A queue-driven seven-stage pipeline synchronizes files, detects layout, extracts text
            and visual regions, chunks the resulting representation, embeds it, and builds topical
            clusters. Text extraction and image captioning can run in parallel after layout.
          </p>
        </div>
        <PipelineDiagram />
        <div className={styles.modelGrid}>
          <div className={styles.modelIntro}><p>Model roster</p><h3>Specialists where structure matters.</h3></div>
          <dl>
            {MODELS.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </div>
      </section>

      <section className={styles.visuals} aria-labelledby="visuals-title">
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>05 / Agent artefacts</p>
          <h2 id="visuals-title">Answers can become usable outputs.</h2>
          <p>
            A separate agent mode can plan a visual task, acquire data, build a Vega-Lite or
            Mermaid specification, validate it, render it, and narrate assumptions. Data values
            remain bound in code so the model does not invent the chart’s numbers.
          </p>
        </div>
        <AgentArtifactDiagram />
        <KnowledgeGraphDiagram />
      </section>

      <section className={styles.foundation} aria-labelledby="foundation-title">
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>06 / Platform foundation</p>
          <h2 id="foundation-title">Collaboration without collapsing boundaries.</h2>
          <p>
            Organizations own their libraries. Membership, invitations, sharing, and team-chat
            access are modeled explicitly, while the processing plane keeps jobs recoverable and
            auditable.
          </p>
        </div>
        <div className={styles.diagramGrid}>
          <DataModelDiagram />
          <DeploymentDiagram />
        </div>
      </section>

      <section className={styles.evaluation} aria-labelledby="evaluation-title">
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>07 / Evaluation design</p>
          <h2 id="evaluation-title">The evaluation path is designed before the scorecard.</h2>
          <p>
            The repository includes a DOUBLE-BENCH-oriented harness for page/document retrieval,
            dual-judge answer review, RAGAS, citation accuracy, honesty, latency, and throughput.
            The system map explains the measurement path, followed by the supplied retrieval and
            dual-judge benchmark snapshots.
          </p>
        </div>
        <EvaluationDiagram />
        <div className={styles.resultsHeading}>
          <p>Benchmark snapshots</p>
          <h3>Retrieval and answer-quality results</h3>
        </div>
        <SynapseBenchmarkCharts />
      </section>

      <footer className={styles.footer}>
        <p>Next project / AI automotive imaging</p>
        <Link href="/projects/autobg">Explore AutoBG <span aria-hidden="true">↗</span></Link>
        <Link href="/#projects">Back to selected work</Link>
      </footer>
    </main>
  );
}
