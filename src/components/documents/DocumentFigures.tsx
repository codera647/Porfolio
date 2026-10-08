import type { DiagramId } from "@/content/projectDocuments";
import {
  ArchitectureDiagram, ChatFlowDiagram, PipelineDiagram, AgentArtifactDiagram,
  KnowledgeGraphDiagram, DataModelDiagram, DeploymentDiagram, EvaluationDiagram,
} from "@/components/projects/SynapseDiagrams";
import {
  AutobgArchitectureDiagram, AutobgMattingDiagram, AutobgTemplateDiagram,
  AutobgReflectionDiagram, AutobgBackgroundDiagram, AutobgPlateDiagram, AutobgRelightDiagram,
} from "@/components/projects/AutobgDiagrams";
import SynapseBenchmarkCharts from "@/components/projects/SynapseBenchmarkCharts";
import { ContentforgeArchitectureDiagram, ContentforgeGenerationDiagram, ContentforgeWorkflowDiagram, ContentforgeDataDiagram } from "@/components/projects/ContentforgeDiagrams";
import styles from "./ProjectDocument.module.css";
import { TrailforgeArchitectureDiagram, TrailforgeRuntimeDiagram, TrailforgeDevelopDiagram, TrailforgePublicationDiagram, TrailforgeEvidenceDiagram } from "@/components/projects/TrailforgeDiagrams";

function RuntimeChart() {
  const modes = [{ name: "Template", value: 0.7 }, { name: "AI reflection", value: 13 }, { name: "AI background", value: 18 }];
  return (
    <figure className={styles.runtimeFigure}>
      <div className={styles.figureLabel}>Figure / README-reported warm-request timings</div>
      <h3>Three modes. Different inference budgets.</h3>
      <svg viewBox="0 0 800 260" role="img" aria-labelledby="runtime-chart-title runtime-chart-desc">
        <title id="runtime-chart-title">Approximate AutoBG request timings on NVIDIA L4</title>
        <desc id="runtime-chart-desc">Template: 0.7 seconds; AI reflection: 13 seconds; AI background: 18 seconds. These are approximate README-reported values, not a new benchmark.</desc>
        {[0, 5, 10, 15, 20].map((tick) => <g key={tick}>
          <line x1={170 + tick * 27} x2={170 + tick * 27} y1="24" y2="216" stroke="currentColor" opacity="0.13" />
          <text x={170 + tick * 27} y="243" textAnchor="middle" className={styles.chartTick}>{tick}s</text>
        </g>)}
        {modes.map(({ name, value }, index) => <g key={name}>
          <text x="150" y={55 + index * 66} textAnchor="end" dominantBaseline="middle" className={styles.chartLabel}>{name}</text>
          <rect x="170" y={35 + index * 66} width={value * 27} height="40" rx="7" fill="var(--rust)" />
          <text x={184 + value * 27} y={55 + index * 66} dominantBaseline="middle" className={styles.chartLabel}>~{value}s</text>
        </g>)}
      </svg>
      <figcaption>One linear seconds axis, from 0 to 20. Model loading and download are separate; image size, configuration, and hardware change actual latency.</figcaption>
    </figure>
  );
}

const figures = {
  "synapse-architecture": ArchitectureDiagram,
  "synapse-chat": ChatFlowDiagram,
  "synapse-pipeline": PipelineDiagram,
  "synapse-artifacts": AgentArtifactDiagram,
  "synapse-graph": KnowledgeGraphDiagram,
  "synapse-data": DataModelDiagram,
  "synapse-deployment": DeploymentDiagram,
  "synapse-evaluation": EvaluationDiagram,
  "synapse-results": SynapseBenchmarkCharts,
  "autobg-architecture": AutobgArchitectureDiagram,
  "autobg-matting": AutobgMattingDiagram,
  "autobg-template": AutobgTemplateDiagram,
  "autobg-reflection": AutobgReflectionDiagram,
  "autobg-background": AutobgBackgroundDiagram,
  "autobg-plate": AutobgPlateDiagram,
  "autobg-relight": AutobgRelightDiagram,
  "autobg-runtime": RuntimeChart,
  "contentforge-architecture": ContentforgeArchitectureDiagram,
  "contentforge-generation": ContentforgeGenerationDiagram,
  "contentforge-workflow": ContentforgeWorkflowDiagram,
  "contentforge-data": ContentforgeDataDiagram,
  "trailforge-architecture": TrailforgeArchitectureDiagram,
  "trailforge-runtime": TrailforgeRuntimeDiagram,
  "trailforge-develop": TrailforgeDevelopDiagram,
  "trailforge-publication": TrailforgePublicationDiagram,
  "trailforge-evidence": TrailforgeEvidenceDiagram,
} satisfies Record<DiagramId, () => React.JSX.Element>;

export function DocumentFigure({ id }: { id: DiagramId }) {
  const Figure = figures[id];
  // Only sideways gestures belong to the figure; vertical gestures must keep
  // the page's easing rather than switching to native scroll under the cursor.
  return <div className={styles.diagram} data-doc-figure={id} data-lenis-prevent-horizontal><Figure /></div>;
}
