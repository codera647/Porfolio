import type { CSSProperties, ReactNode } from "react";
import styles from "./SynapseDiagrams.module.css";

type FlowNode = {
  title: string;
  detail: string;
  accent?: boolean;
};

export function Node({ title, detail, accent = false }: FlowNode) {
  return (
    <div data-diagram-node className={`${styles.node} ${accent ? styles.accent : ""}`}>
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}

export function Arrow({ down = false, label }: { down?: boolean; label?: string }) {
  return (
    <span className={down ? styles.arrowDown : styles.arrow} aria-hidden="true">
      {label && <small>{label}</small>}{down ? "↓" : "→"}
    </span>
  );
}

export function FlowRow({ nodes }: { nodes: readonly FlowNode[] }) {
  return (
    <div data-diagram-flow className={styles.flowRow}>
      {nodes.map((node, index) => (
        <div data-diagram-step className={styles.flowStep} key={node.title}>
          <Node {...node} />
          {index < nodes.length - 1 && <Arrow />}
        </div>
      ))}
    </div>
  );
}

export function Shell({
  title,
  columns,
  children,
  caption,
  project = "Synapse",
}: {
  title: string;
  columns: readonly string[];
  children: ReactNode;
  caption: string;
  project?: string;
}) {
  return (
    <figure className={styles.figure}>
      <div data-diagram-shell className={styles.shell} tabIndex={0} role="region" aria-label={title}>
        <div data-diagram-title className={styles.diagramTitle}>
          <span>{title}</span>
          <span>{project} / System map</span>
        </div>
        <div data-diagram-columns className={styles.columnLabels} style={{ "--columns": columns.length } as CSSProperties}>
          {columns.map((column) => <span key={column}>{column}</span>)}
        </div>
        {children}
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export function ArchitectureDiagram() {
  return (
    <Shell
      title="System architecture"
      columns={["At the edge", "GPU application server", "Shared state & models"]}
      caption="Next.js at the edge, a FastAPI/GPU execution plane, and durable shared state remain independently scalable."
    >
      <div className={styles.architecture}>
        <div className={styles.stack}>
          <Node title="Web application" detail="Next.js 16 · React 19" />
          <Arrow down />
          <Node title="Cloudflare Worker" detail="OpenNext host · API proxy" accent />
        </div>
        <Arrow />
        <div className={styles.stack}>
          <Node title="FastAPI layer" detail="chat · agent · graph · pipeline" accent />
          <Arrow down />
          <Node title="Worker pool" detail="sync · layout · OCR/VLM · chunk · embed · cluster" />
          <Arrow down />
          <Node title="Retrieval & reasoning" detail="corrective multi-agent loop" />
        </div>
        <Arrow />
        <div className={styles.stack}>
          <Node title="Model APIs" detail="OpenAI · OpenRouter" />
          <Node title="Embedding & rerank" detail="BGE encoder · cross-encoder" />
          <Node title="Supabase + pgvector" detail="tenants · jobs · vectors · chat" accent />
          <Node title="Cloudflare R2" detail="documents · derived artefacts" />
        </div>
      </div>
    </Shell>
  );
}

export function ChatFlowDiagram() {
  return (
    <Shell
      title="Grounded chat"
      columns={["Question", "Corrective retrieval", "Grounded outcome"]}
      caption="Weak evidence loops back through retrieval; sufficient evidence advances to a cited answer."
    >
      <div className={styles.chatFlow}>
        <div className={styles.stack}>
          <Node title="User question" detail="plain-language request" />
          <Arrow down />
          <Node title="Planner" detail="classify · rewrite · decompose" accent />
        </div>
        <Arrow />
        <div className={styles.stack}>
          <Node title="Hybrid retrieval" detail="vector + keyword search · RRF" />
          <Arrow down />
          <Node title="Rerank passages" detail="cross-encoder selects top evidence" />
          <Arrow down />
          <Node title="Grade evidence" detail="relevant and sufficient?" accent />
        </div>
        <Arrow />
        <div className={styles.outcomes}>
          <Node title="Compose answer" detail="citation per supported claim" accent />
          <span className={styles.or}>or</span>
          <Node title="Abstain / retrieve again" detail="never force an unsupported answer" />
        </div>
      </div>
    </Shell>
  );
}

export function PipelineDiagram() {
  const nodes = [
    { title: "Sync", detail: "fetch files from source" },
    { title: "Layout parser", detail: "DocLayout-YOLO regions", accent: true },
    { title: "Text extraction", detail: "born-digital + scanned" },
    { title: "Image captioning", detail: "figures & tables via VLM", accent: true },
    { title: "Chunking", detail: "build text IR" },
    { title: "Embedding", detail: "BGE vectors to pgvector", accent: true },
    { title: "Clustering", detail: "topical groups" },
  ] as const;
  return (
    <Shell
      title="Document ingestion"
      columns={["Source", "Structure & extraction", "Search representation"]}
      caption="Queue-driven stages persist text, layout, visual artefacts, embeddings, and clusters as work advances."
    >
      <FlowRow nodes={nodes} />
      <div className={styles.persisted}>Artefacts persisted → Cloudflare R2 + Supabase / pgvector</div>
    </Shell>
  );
}

export function AgentArtifactDiagram() {
  const nodes = [
    { title: "User goal", detail: "libraries · file · request" },
    { title: "Plan", detail: "intent · data · artefact", accent: true },
    { title: "Acquire data", detail: "exact re-parse + retrieval" },
    { title: "Build the spec", detail: "Vega-Lite or Mermaid", accent: true },
    { title: "Validate & repair", detail: "schema checks · one repair pass" },
    { title: "Render", detail: "interactive + downloadable", accent: true },
    { title: "Narrate", detail: "result · assumptions · sources" },
  ] as const;
  return (
    <Shell
      title="Agent mode"
      columns={["Goal", "Build", "Validate", "Deliver"]}
      caption="Data values are bound in code rather than authored by the model, keeping visuals tied to source evidence."
    >
      <FlowRow nodes={nodes} />
    </Shell>
  );
}

export function KnowledgeGraphDiagram() {
  const nodes = [
    { title: "Processed library", detail: "chunks + captions" },
    { title: "Extract", detail: "entities & relations per chunk", accent: true },
    { title: "Resolve", detail: "merge duplicates · normalize names" },
    { title: "Build graph", detail: "nodes · edges · confidence", accent: true },
    { title: "Serve", detail: "interactive graph in the web app" },
  ] as const;
  return (
    <Shell
      title="Knowledge-graph construction"
      columns={["Evidence", "Entity pipeline", "Interactive graph"]}
      caption="Every node and edge retains provenance back to the source chunk stored with the graph in Supabase."
    >
      <FlowRow nodes={nodes} />
      <div className={styles.persisted}>Provenance retained → graph node / edge → source passage</div>
    </Shell>
  );
}

export function DataModelDiagram() {
  return (
    <Shell
      title="Core data model"
      columns={["Tenant", "Knowledge", "Conversation & graph"]}
      caption="Rows are scoped to an organization and protected with row-level security."
    >
      <div className={styles.dataGrid}>
        <div className={styles.stack}><Node title="organization" detail="tenant boundary" accent /><Arrow down label="has" /><Node title="user" detail="member of an organization" /></div>
        <div className={styles.stack}><Node title="library" detail="connected collection" accent /><Arrow down label="contains" /><Node title="document" detail="file + processing status" /><Arrow down label="split into" /><Node title="chunk_embedding" detail="text chunk + vector" /></div>
        <div className={styles.stack}><Node title="chat_thread" detail="queries a library" /><Arrow down label="has" /><Node title="chat_message" detail="answer + citations" /><Arrow down label="grounds" /><Node title="graph_node / edge" detail="entities + relationships" accent /></div>
      </div>
    </Shell>
  );
}

export function DeploymentDiagram() {
  return (
    <Shell
      title="Deployment view"
      columns={["Browser", "Cloudflare", "GCP GPU VM"]}
      caption="The edge application talks to a dedicated GPU service while R2 and Supabase provide durable shared state."
    >
      <div className={styles.deployment}>
        <Node title="User" detail="web browser" />
        <Arrow />
        <div className={styles.zone}><span>Cloudflare</span><Node title="synapse-web" detail="Next.js via OpenNext" accent /><Node title="R2 bucket" detail="documents + artefacts" /></div>
        <Arrow />
        <div className={styles.zone}><span>GCP · NVIDIA L4</span><Node title="FastAPI service" detail="chat · agent · graph · pipeline" accent /><Node title="Pipeline workers" detail="layout · OCR/VLM · embed · cluster" /><Node title="Local models" detail="BGE encoder + reranker" /></div>
      </div>
    </Shell>
  );
}

export function EvaluationDiagram() {
  const nodes = [
    { title: "DOUBLE-BENCH", detail: "single-hop + multi-hop documents" },
    { title: "Retrieval pass", detail: "hit@1 · hit@3 · hit@5", accent: true },
    { title: "Deep answer pass", detail: "bounded agentic queries" },
    { title: "Dual judges", detail: "answer correctness review", accent: true },
    { title: "RAGAS + citations", detail: "grounding · honesty · recall" },
    { title: "Efficiency", detail: "latency · throughput · spend" },
  ] as const;
  return (
    <Shell
      title="Evaluation design"
      columns={["Dataset", "Retrieval", "Answers", "Operations"]}
      caption="The harness defines the dataset, retrieval, answer-quality, grounding, and operational measurements shown in the result snapshots below."
    >
      <FlowRow nodes={nodes} />
    </Shell>
  );
}
