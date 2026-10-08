/** Source-backed engineering notes, shared by the reading pages and PDF exports. */
export type DiagramId =
  | "synapse-architecture" | "synapse-chat" | "synapse-pipeline"
  | "synapse-artifacts" | "synapse-graph" | "synapse-data"
  | "synapse-deployment" | "synapse-evaluation" | "synapse-results"
  | "autobg-architecture" | "autobg-matting" | "autobg-template"
  | "autobg-reflection" | "autobg-background" | "autobg-plate"
  | "autobg-relight" | "autobg-runtime"
  | "contentforge-architecture" | "contentforge-generation"
  | "contentforge-workflow" | "contentforge-data";

export type DocumentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; columns: string[]; rows: string[][] }
  | { type: "note"; label: string; text: string }
  | { type: "code"; label: string; text: string }
  | { type: "diagram"; id: DiagramId }
  | { type: "image"; src: string; alt: string; caption: string; width: number; height: number };

export type DocumentSection = {
  id: string;
  number: string;
  part: string;
  title: string;
  blocks: DocumentBlock[];
};

export type ProjectDocument = {
  slug: "synapse" | "autobg" | "contentforge";
  name: string;
  title: string;
  subtitle: string;
  abstract: string;
  tags: string[];
  sections: DocumentSection[];
};

const p = (text: string): DocumentBlock => ({ type: "paragraph", text });
const h = (text: string): DocumentBlock => ({ type: "heading", text });
const note = (label: string, text: string): DocumentBlock => ({ type: "note", label, text });
const diagram = (id: DiagramId): DocumentBlock => ({ type: "diagram", id });
const list = (...items: string[]): DocumentBlock => ({ type: "list", items });
const table = (columns: string[], rows: string[][]): DocumentBlock => ({ type: "table", columns, rows });
const code = (label: string, text: string): DocumentBlock => ({ type: "code", label, text });
const screen = (file: string, alt: string, caption: string): DocumentBlock => ({
  type: "image", src: `/projects/synapse/screens/${file}.png`, alt, caption, width: 1600, height: 900,
});

export const synapseDocument: ProjectDocument = {
  slug: "synapse",
  name: "Synapse",
  title: "Engineering answers you can trace.",
  subtitle: "A technical study of multi-agent document intelligence",
  abstract: "From a raw document to a cited answer: the architecture, retrieval decisions, GPU pipeline, visual artifacts, and evaluation behind a multi-tenant research workspace.",
  tags: ["Agentic RAG", "Document AI", "GPU workers", "Evaluation"],
  sections: [
    { id: "intent", number: "01", part: "Part I / The problem", title: "Research software should show its work.", blocks: [
      p("Synapse addresses a familiar failure in document-based AI: an answer sounds convincing, but the reader cannot tell which passage supports it, whether a table was read correctly, or whether important evidence was missed. The product is a research workspace, not just a prompt box over a vector database."),
      p("A user connects a collection of documents, waits for structured ingestion, and asks questions across one or many files. The answer should preserve the relationship between claims, source chunks, pages, and relevant figures. Teams can collaborate over explicitly shared libraries while personal conversations remain separate."),
      table(["Input", "System responsibility", "Output"], [
        ["PDFs and connected Google Drive libraries", "Preserve layout, text, visuals, and document identity", "Searchable, attributed evidence"],
        ["A question and its conversation context", "Select a retrieval strategy and test evidence coverage", "A grounded answer with citations"],
        ["A visual or relationship-building request", "Acquire source data, validate a specification, retain provenance", "Charts, diagrams, and knowledge graphs"],
      ]),
      note("The engineering principle", "The model can decide what to investigate; the runtime limits how far the investigation may go. Citations, retained artifacts, and explicit evaluation make the output inspectable, not automatically correct."),
      screen("library", "Synapse document library with processing statuses", "Figure 1. Libraries are the unit of connected knowledge. Processing status makes ingestion visible before chat begins."),
    ] },
    { id: "architecture", number: "02", part: "Part II / The system", title: "Three planes, different responsibilities.", blocks: [
      p("The system separates a responsive edge product, a GPU execution plane, and durable shared state. Next.js 16 and React 19 provide the interface. OpenNext hosts the application on Cloudflare Workers, where route handlers proxy authenticated requests, manage product state, and connect to object storage and email services."),
      p("FastAPI exposes chat, pipeline, agent, and graph services on a dedicated compute host. Ingestion is queue-backed rather than tied to a long browser request. Worker processes perform specialized stages, while the reasoning layer assembles evidence and answers. Supabase Postgres holds the tenant model, job state, conversation records, and pgvector embeddings. Cloudflare R2 holds raw and derived files."),
      diagram("synapse-architecture"),
      h("One upload, two persistence layers"),
      p("A file is stored in R2 and a durable preprocessing job is created in Postgres. Workers claim the job's stages and persist intermediate outputs. This keeps expensive layout, OCR, captioning, and embedding work outside the edge request lifetime. Chat can then retrieve the processed representation without re-parsing the entire collection on every question."),
      table(["Plane", "Owns", "Does not own"], [
        ["Edge application", "User experience, authenticated API routes, library and team workflows", "Long-running GPU inference"],
        ["Compute service", "Document processing, retrieval, reasoning, artifact generation", "The browser's local presentation state"],
        ["Shared state", "Tenant records, job state, embeddings, source and derived artifacts", "Decisions about the truth of a generated answer"],
      ]),
    ] },
    { id: "ingestion", number: "03", part: "Part II / The system", title: "A document is more than extracted text.", blocks: [
      p("Flattening a PDF into one text string discards the structure that often carries its meaning. A heading changes the interpretation of a passage; a table encodes relationships; a figure can be the only evidence for a result. Synapse turns source files into a structured intermediate representation before retrieval."),
      diagram("synapse-pipeline"),
      table(["Stage", "Responsibility", "Retained representation"], [
        ["Sync", "Fetch source files and prepare page inputs", "Document identity and source artifacts"],
        ["Layout", "Detect regions with DocLayout-YOLO", "Paragraph, heading, table, figure, and other region boundaries"],
        ["Text extraction", "Read born-digital text and OCR scanned content", "Text associated with document/page context"],
        ["Image captioning", "Describe or transcribe visual regions using a VLM", "Captions, visual artifacts, and source links"],
        ["Chunking", "Construct retrieval-sized pieces with contextual and visual links", "Text chunks with attribution"],
        ["Embedding", "Encode text and persist vectors", "pgvector records linked to the underlying chunks"],
        ["Clustering", "Organize related content into topical groups", "Semantic groupings over the processed library"],
      ]),
      p("The diagram presents the logical stage order. Extraction and captioning have separate worker paths after layout; their outputs are brought into the representation used for chunking. Individual stage processes let the worker planner balance model-heavy tasks against the host's available VRAM rather than loading every model in every process."),
      note("Recoverability", "Queue-backed stages and persisted artifacts support resuming work after interruption. This is an architectural mechanism, not a claim that every failure is automatically recoverable or that the platform has a measured availability SLA."),
    ] },
    { id: "models", number: "04", part: "Part III / Execution", title: "Specialists for structure; configuration for reasoning.", blocks: [
      p("The model roster separates document perception from text reasoning. A layout detector locates regions, an OCR system reads text, a vision-language model handles visual content, and retrieval uses a dense encoder with an optional cross-encoder reranker. Reasoning roles can select different model identifiers through configuration."),
      table(["Role", "Model / configuration", "Implementation note"], [
        ["Layout detection", "DocLayout-YOLO / DocStructBench weights", "Region-aware document parsing"],
        ["OCR", "Surya; optional GLM-OCR fallback", "Scanned-text extraction alongside born-digital parsing"],
        ["Remote VLM", "qwen/qwen2.5-vl-72b-instruct", "Default caption API identifier through OpenRouter"],
        ["Local VLM", "Qwen/Qwen2-VL-2B-Instruct", "Local configuration path when used"],
        ["Embedding", "BAAI/bge-large-en-v1.5", "Default dense encoder; 1024-dimensional vectors"],
        ["Inline reranking", "BAAI/bge-reranker-v2-m3", "Gated by retrieval configuration"],
        ["Worker reranking", "BAAI/bge-reranker-base", "Worker-mode default; configurable separately"],
        ["Reasoning", "CHAT_GPT_MODEL plus per-role overrides", "Planner, extractor, critic, grader, verifier, and synthesis configuration"],
      ]),
      note("Defaults are not deployment claims", "These identifiers describe the reviewed code and project configuration. The evaluation guide recommends bge-m3 for its benchmark setup. Results must be paired with their actual encoder, reranker, thinking mode, dataset slice, and run configuration; a default in the code is not proof of what ran in a particular deployment."),
    ] },
    { id: "retrieval", number: "05", part: "Part III / Execution", title: "Retrieval follows the question.", blocks: [
      p("A precise lookup and a comparison across many documents need different retrieval behavior. The planner classifies the request, rewrites it when useful, and decomposes complex questions into sub-queries. Spotlight questions can remain narrow; comparison, aggregation, multi-hop, and multi-entity questions may need broader evidence and follow-up searches."),
      p("The runtime fans out retrieval, combines dense and lexical candidates where enabled, expands neighboring chunks, and applies cross-encoder reranking. Retrieved material is distilled into an evidence brief while preserving attribution. A relevance/sufficiency grader and a completeness critic can identify gaps before synthesis. These checks are bounded by the selected reasoning mode."),
      diagram("synapse-chat"),
      table(["Role", "Decision or output"], [
        ["Planner", "Intent, query class, rewritten query, and decomposition"],
        ["Retriever", "Ranked source passages and associated evidence"],
        ["Extractor", "A compact, source-anchored evidence brief"],
        ["Retrieval grader", "Whether the evidence is relevant and sufficient"],
        ["Gap finder / completeness critic", "Missing entities, attributes, or bridging questions"],
        ["Synthesizer", "An answer grounded in the consolidated evidence"],
        ["Faithfulness verifier", "Unsupported claims and a possible correction pass"],
      ]),
      h("Depth is a budget, not a promise of quality"),
      table(["UI mode / API value", "Critic rounds", "Sub-queries", "Breadth", "Answer token cap"], [
        ["Fast / low", "0", "0", "1.0x", "1600"],
        ["Balanced / medium", "1", "2", "1.25x", "3200"],
        ["Deep / high", "2", "4", "1.5x", "5500"],
      ]),
      p("The runtime can lower these limits with environment caps. More searches or critic calls consume latency and model budget; they do not guarantee a better answer. The useful question is whether a deeper mode recovers missing evidence on a defined evaluation slice."),
      note("An important limit", "The reviewed faithfulness verifier has a fail-open fallback when its call fails. A verifier outage therefore must not be interpreted as a successful grounding check. Stronger degraded-status reporting and stricter policies for high-stakes use are sensible hardening work, not features claimed as already proven here."),
    ] },
    { id: "evidence", number: "06", part: "Part III / Execution", title: "A citation is part of the answer contract.", blocks: [
      p("The synthesizer emits references that the server resolves to real source records. Citation and visual markers connect the narrative to retrieved chunks and visual artifacts; the client renders them as inspectable source chips and figure cards. This makes the evidence path available to the reader instead of hiding it behind a generic filename."),
      code("Evidence-linked answer representation", "Question\n  -> retrieved chunks + document/page identity\n  -> distilled evidence brief\n  -> answer with [[CITE:n]] and [[VISUAL:id]] markers\n  -> resolved source records and visual artifacts\n  -> inspectable citation chips and inline figures"),
      p("Source attribution and correctness are different measurements. A cited passage may be real but irrelevant, or a sentence may overstate what the passage establishes. That is why retrieval relevance, answer correctness, citation quality, and honesty are evaluated separately rather than combined into a single unqualified 'accuracy' number."),
      screen("chat", "Synapse chat interface displaying an answer and source area", "Figure 2. The answer surface keeps sources alongside the response so the reader can inspect the supporting material."),
    ] },
    { id: "artifacts", number: "07", part: "Part III / Execution", title: "From an answer to a reusable artifact.", blocks: [
      p("Agent mode handles requests whose output is not only prose. It plans the task, acquires data through parsing and retrieval, chooses an artifact form, and builds a Vega-Lite or Mermaid specification. Validation and a bounded repair path sit between specification generation and delivery."),
      diagram("synapse-artifacts"),
      p("Numerical data is bound by code rather than left for the model to invent. The generated specification describes how the data should be presented; it is not permission to fabricate the underlying values. A narrative explains the result, assumptions, and sources after the artifact is produced."),
      screen("generate-visuals", "Synapse generated visual artifacts", "Figure 3. Visual outputs are delivered inside the workspace rather than as disconnected model text."),
      note("Keep two tests separate", "A specification can be syntactically valid while displaying the wrong data. Validation needs both a structural check and a source-value check; successful rendering alone does not establish numerical correctness."),
    ] },
    { id: "knowledge-graph", number: "08", part: "Part III / Execution", title: "Relationships retain their provenance.", blocks: [
      p("The graph pipeline starts with processed library content, extracts entities and relationships, resolves duplicate names, and builds nodes and edges with confidence and source references. The resulting graph is persisted and served to the interface for exploration."),
      diagram("synapse-graph"),
      p("A graph is another representation of the evidence, not an independent source of truth. Entity resolution can merge distinct subjects; extraction can infer a relationship that a passage does not actually state. Retaining the originating chunk allows a user to inspect a graph claim and provides a basis for targeted evaluation of extraction and resolution quality."),
      screen("knowledge-graph-representation", "Synapse interactive knowledge graph", "Figure 4. Graph exploration offers a relationship-oriented view of the processed collection."),
    ] },
    { id: "tenancy", number: "09", part: "Part IV / Platform boundaries", title: "Collaboration does not mean unrestricted access.", blocks: [
      p("Organizations, members, roles, libraries, conversations, and sharing relationships are modeled explicitly. Personal chats remain private, while shared team conversations can use libraries from participating organizations only through the sharing workflow. Postgres row-level security is part of the data boundary."),
      diagram("synapse-data"),
      p("Every access path still needs to enforce the caller's permissions: listing files, retrieving chunks, resolving citation previews, downloading artifacts, and accessing graphs. In particular, server-side service-role access must be paired with application authorization; database RLS by itself does not prove a service-role request is correctly scoped."),
      list("Treat library sharing as an explicit grant, not an implicit consequence of joining a conversation.", "Test organization isolation on retrieval and artifact endpoints as well as the UI.", "Retain document and chunk identity when evidence moves between agents.", "Do not publish secret keys or infer security certification from the presence of an RLS policy."),
      note("Scope of this study", "The repository includes tenancy and collaboration mechanisms; its roadmap also calls out permissions hardening. This document describes the architecture without claiming a completed independent security audit."),
    ] },
    { id: "evaluation", number: "10", part: "Part V / Evidence and evaluation", title: "Measure retrieval before judging the answer.", blocks: [
      p("The evaluation harness uses DOUBLE-BENCH-oriented methodology with single-hop and multi-hop questions. Its full ingestion path converts sampled page images into PDFs and runs the actual parsing, captioning, chunking, embedding, and clustering pipeline. A cheaper OCR-text path starts at chunking and must be reported as a different ingestion condition."),
      diagram("synapse-evaluation"),
      p("Retrieval-only runs test whether the expected evidence is found without paying for answer synthesis and judging. Answer runs add dual judges, RAGAS-related measurements, citation checks, honesty/overconfidence, latency, throughput, and spend accounting. Persisted run records support aggregation and resuming work."),
      h("Page-level and document-level hits are not interchangeable"),
      p("Rebuilt text PDFs may not preserve the benchmark's original page indices. A document-level match asks whether a retrieved passage belongs to the correct document. A page-level match asks a stricter question about the expected evidence page. The supplied graph below is explicitly document-level hit@5, not page-level retrieval accuracy."),
      diagram("synapse-results"),
      note("Result provenance and limits", "These values reproduce the supplied portfolio benchmark snapshots: overall document hit@5 = 0.839; 1-hop = 1.000; 2-hop = 1.000; 3-hop = 0.773; born-digital = 0.857; scanned = 0.824. Judge A reports 80% correct / 14% partial / 6% incorrect, and Judge B reports 70% / 12% / 18%. The snapshots do not establish the judged sample count, confidence intervals, or a full-suite result. No new evaluation run was performed for this document."),
      table(["Measurement", "What it establishes", "What it does not establish"], [
        ["Document hit@5", "The correct source document appeared among the retrieved candidates", "The exact page was found, or the answer is correct"],
        ["Judge distribution", "The supplied judgments for the tested answer slice", "Universal reliability or an independently verified ground truth"],
        ["Citation checks", "Agreement between claims, references, and supporting evidence under the metric", "A security guarantee or complete factual verification"],
      ]),
    ] },
    { id: "operations", number: "11", part: "Part VI / Operating the system", title: "The job queue is part of the product.", blocks: [
      diagram("synapse-deployment"),
      p("The documented deployment uses Cloudflare for the edge application, R2 for artifacts, Supabase for shared state, and a dedicated GPU host such as an NVIDIA L4 VM. Worker planning responds to the available hardware and queued stages. API-only operation is possible when GPU workers are disabled."),
      table(["Operational surface", "Purpose"], [
        ["GET /health", "Liveness of the API service"],
        ["GET /ready", "Configuration and GPU readiness checks"],
        ["GET /hardware", "Hardware information and worker planning visibility"],
        ["Processing jobs and stage records", "Durable progress and recovery context"],
        ["Model and thinking-mode configuration", "Explicit cost, depth, and latency controls"],
      ]),
      p("Useful monitoring separates queue delay, stage execution time, model/API failures, retrieval behavior, and answer-generation latency. Model names, prompt versions, dataset identity, and run settings should accompany evaluation reports. Otherwise a score change cannot be attributed to a particular code, data, or model change."),
      h("Repository responsibility map"),
      table(["Modules", "Responsibility"], [
        ["app / pipeline_api / worker_bootstrap", "Service composition, pipeline control, and worker lifecycle"],
        ["sync_worker / layout_worker / extraction_worker / caption_worker", "Document acquisition and perception"],
        ["chunk_worker / embed_worker / cluster_worker", "Searchable representations"],
        ["chat_api / chat_agents / chat_runtime / chat_queue", "Question orchestration, role decisions, retrieval, and queued work"],
        ["agent_api / agent_agents / agent_data / agent_specs", "Artifact planning, data acquisition, and specification construction"],
        ["kg_extract / kg_resolve / kg_build / kg_api", "Knowledge-graph construction and serving"],
        ["eval", "Dataset preparation, query runs, metrics, and reports"],
      ]),
    ] },
    { id: "takeaways", number: "12", part: "Closing / Engineering judgment", title: "A system that exposes its assumptions.", blocks: [
      p("The useful engineering lesson is not that more agents make a better product. It is that each responsibility has an explicit place: perception produces structure, retrieval produces candidate evidence, reasoning identifies gaps, synthesis produces a narrative, and evaluation tests those claims independently."),
      list("Preserve structure before building search: tables and figures are evidence, not decoration.", "Bound autonomous work with runtime limits and observable stages.", "Separate retrieval success, citation correctness, and answer quality.", "Treat graphs and generated artifacts as derived views that still need provenance.", "Report uncertainty, degraded checks, and benchmark scope instead of turning a demo into an unqualified reliability claim."),
    ] },
  ],
};

export const autobgDocument: ProjectDocument = {
  slug: "autobg",
  name: "AutoBG",
  title: "Change the setting. Keep the car.",
  subtitle: "A technical study of controlled automotive imaging",
  abstract: "High-resolution matting, deterministic studio compositing, and carefully bounded diffusion. How AutoBG turns everyday vehicle photographs into grounded studio scenes without asking a model to redraw the vehicle.",
  tags: ["Computer vision", "BiRefNet HR", "SDXL", "ControlNet"],
  sections: [
    { id: "intent", number: "01", part: "Part I / The problem", title: "Background removal is only the beginning.", blocks: [
      p("A clean cutout is not a believable studio image. A vehicle can have sharp edges and still look pasted onto a floor because the wheels do not touch their shadows, the reflection starts at the wrong height, or the old background's color survives around the mirrors. AutoBG addresses the whole composition rather than stopping at segmentation."),
      p("The product takes an uploaded car photograph, separates the vehicle with a high-resolution alpha matte, places it in a selected studio, and returns a downloadable PNG. Geometry and image-processing operations handle placement, contact, and edge integration. Diffusion is reserved for the parts of the scene where generation is useful."),
      note("The design constraint", "Retain the vehicle as the visual subject. Generated surroundings must adapt to the cutout, not silently replace the car's shape or details. Color correction and edge refinement still alter pixels, so 'keep the car' means retaining its source appearance and structure, not claiming every output vehicle pixel is bit-identical."),
      { type: "image", src: "/projects/autobg/poster.jpg", alt: "AutoBG upload and result interface", caption: "Figure 1. The demonstrated product workflow is upload, generate, preview, and download. The interface requests the White Studio reflection mode.", width: 1600, height: 900 },
    ] },
    { id: "architecture", number: "02", part: "Part II / The system", title: "One matte, three rendering paths.", blocks: [
      p("The frontend sends a multipart request to FastAPI. Input decoding, validation, downscaling, and segmentation are shared across modes. The resulting RGBA cutout is dispatched to a deterministic template compositor, a floor-reflection generator, or a full-background generator."),
      diagram("autobg-architecture"),
      table(["Mode", "What changes", "Primary implementation"], [
        ["template", "Prepared studio, geometric reflection, shadows, and integration", "compositing; no diffusion after matting"],
        ["reflect_ai", "A bounded floor reflection band within the prepared studio", "reflect_gen using the shared SDXL pipeline"],
        ["ai", "The wider background, followed by source-cutout reintegration", "aigen using SDXL and Canny ControlNet"],
      ]),
      p("The API defaults to template when no mode is supplied. The current browser interface explicitly sends reflect_ai and white_studio. The API therefore exposes more rendering choices than the present UI. In the reviewed dispatcher, any unrecognized mode also falls through to template; it is not a strict enum-validation endpoint."),
    ] },
    { id: "matting", number: "03", part: "Part III / Image formation", title: "Continuous alpha preserves the edge.", blocks: [
      p("BiRefNet HR produces a continuous opacity estimate instead of a coarse binary foreground mask. This matters around mirrors, tires, chrome, and fine silhouette details, where a hard yes/no cutout can discard structure or preserve the old background."),
      diagram("autobg-matting"),
      p("The default model identifier is ZhengPeng7/BiRefNet_HR and the internal inference size is 2048 by 2048. RGB input is resized and ImageNet-normalized, passed through the model, and converted from the final prediction through sigmoid into alpha. The alpha map is resized with LANCZOS back to the processed input's dimensions and attached to the RGB image."),
      code("Alpha compositing", "I = alpha * F + (1 - alpha) * B\n\nI : observed image color\nF : foreground vehicle color\nB : background color\nalpha : continuous opacity in [0, 1]"),
      p("The API may first reduce a large upload to MAX_INPUT_SIDE, default 2048. Returning alpha at the input resolution therefore refers to the downscaled image passed to segmentation, not necessarily the original camera file's full resolution. Segmentation selects CUDA when available; the SDXL generation path explicitly requires CUDA."),
      note("Model caching", "The matting model is cached after loading and warmed at application startup. A warm request and a first model download are different performance conditions and should never be combined into one latency claim."),
    ] },
    { id: "edges", number: "04", part: "Part III / Image formation", title: "Solve the color contamination, not only the mask.", blocks: [
      p("Semi-transparent edge pixels mix the foreground with the old background. Simply placing those pixels on a white studio can leave a colored fringe. The compositor first attempts foreground-color estimation with PyMatting. If that path is unavailable, a guided color-diffusion fallback propagates interior colors into the edge band."),
      p("Alpha tightening then suppresses faint low-opacity glow, contracts the matte by roughly one pixel with a small elliptical erosion, and applies anti-aliasing. The objective is a cleaner boundary without indiscriminately blurring the entire subject."),
      table(["Operation", "Why it exists", "Failure to watch"], [
        ["Foreground recovery", "Remove background color mixed into translucent edge pixels", "Residual color fringe or overcorrected paint color"],
        ["Alpha tightening", "Reduce the faint halo outside the silhouette", "Thin mirrors or fine details eroded away"],
        ["Anti-aliasing", "Avoid visibly jagged boundaries", "An overly soft tire or body edge"],
        ["Lighting integration", "Reduce the pasted-on appearance", "Unintended exposure or color changes"],
      ]),
      note("Evaluation consequence", "Mask overlap alone cannot describe this quality. Edge-band error, fine-detail retention, and source-color preservation need separate checks on a representative vehicle set."),
    ] },
    { id: "compositing", number: "05", part: "Part III / Image formation", title: "Ground the wheels before adding atmosphere.", blocks: [
      diagram("autobg-template"),
      p("The template path uses a saved studio plate when one exists, otherwise a procedural wall/floor background. The cutout is cropped, scaled, and positioned on the canvas. Placement is paired with a per-column ground contour computed from the lowest opaque pixel of the vehicle silhouette."),
      p("The reflection mirrors each column about its own contact height, rather than flipping the whole bounding box about one horizontal line. This distinction matters for a three-quarter view where the front and rear wheels occupy different image heights. Reflection opacity fades with distance and blur increases away from contact."),
      p("Contact shadows combine a soft ambient layer along the underside with darker cores around wheel-contact columns. White-balance adjustment, ambient floor bounce, edge light wrap, and seeded grain integrate the subject and background after geometry has been established."),
      table(["Layer", "Geometric or photometric responsibility"], [
        ["Studio plate / procedural scene", "A consistent wall, floor, horizon, and perspective"],
        ["Per-column ground contour", "Contact height appropriate to the photographed viewpoint"],
        ["Reflection", "A fading, depth-softened mirror anchored to the contour"],
        ["Shadow", "Soft body occlusion plus darker wheel contact"],
        ["Realism pass", "White balance, floor bounce, edge light, and texture consistency"],
      ]),
      note("Deterministic does not mean physically exact", "These operations are practical image-space approximations. They avoid another generative-model call and can be reproducible with fixed settings, but they do not reconstruct a complete 3D lighting or camera model."),
    ] },
    { id: "reflection", number: "06", part: "Part IV / Bounded generation", title: "Generate only the part that needs generation.", blocks: [
      p("The default UI path builds a prepared car-and-studio composite, initializes a geometric reflection, and asks SDXL to refine a masked floor band. A contour-following mask restricts the edit. Canny edges provide structural conditioning, while a fixed seed and configurable diffusion settings make experiments easier to compare."),
      diagram("autobg-reflection"),
      table(["Reflection control", "Reviewed default", "Meaning"], [
        ["REFL_STEPS", "22", "Configured inference-step budget"],
        ["REFL_STRENGTH", "0.32", "Denoising strength relative to the initialized reflection"],
        ["REFL_CN", "0.70", "ControlNet conditioning scale"],
        ["REFL_GUIDE", "6.0", "Text guidance scale"],
        ["REFL_BLEND", "0.50", "Geometric contribution to the AI/geometric mixture"],
        ["REFL_SEED", "7", "Generator seed"],
      ]),
      p("The generated result is blended with the geometric initialization, softened, and pasted back through the floor mask. This avoids using an unconstrained generated image as the entire final result. A stronger diffusion setting can add detail, but it can also introduce duplicates, distorted wheels, or a reflection that no longer corresponds to the subject."),
      note("A seed is not a universal reproducibility guarantee", "Matching the seed and configuration helps controlled comparisons. Exact results can still depend on model revisions, package versions, device kernels, and numerical settings."),
    ] },
    { id: "background", number: "07", part: "Part IV / Bounded generation", title: "A broader edit needs a stronger reintegration path.", blocks: [
      p("Full-background mode places the vehicle on a working canvas and marks the background for inpainting. The shared SDXL ControlNet pipeline generates the surrounding scene with template-specific prompts and Canny guidance. The source cutout is subsequently cleaned and composited back into the generated scene."),
      diagram("autobg-background"),
      p("Post-processing suppresses the bright floor halo sometimes produced near the car, adds dedicated contact shadows, harmonizes exposure and color statistics, refines the edge with a guided filter, and applies light wrap and grain. These operations are necessary because a plausible background and a good matte do not automatically form a coherent photograph."),
      table(["Model", "Responsibility"], [
        ["stabilityai/stable-diffusion-xl-base-1.0", "The base diffusion model"],
        ["diffusers/controlnet-canny-sdxl-1.0", "Edge-conditioned structural guidance"],
        ["madebyollin/sdxl-vae-fp16-fix", "FP16 VAE used by the CUDA pipeline"],
      ]),
      p("The default working size is 1024 by 1024, with 30 configured inference steps, guidance 7.0, and ControlNet scale 0.5. These are code defaults, not a measured best setting for every input image. The renderer's output size also differs from the template compositor, so the API should not be described as returning one universal dimension for all modes."),
    ] },
    { id: "supporting-tools", number: "08", part: "Part IV / Bounded generation", title: "Prepare reusable studios; isolate experiments.", blocks: [
      h("Offline plate preparation"),
      p("The make_plate utility takes a reference studio photo, segments the car, expands the removal mask to cover nearby shadow/reflection, and inpaints an empty studio. The saved plate can be reused by the deterministic compositor. This is an offline preparation step, not an extra generation pass in every request."),
      diagram("autobg-plate"),
      h("Conditioned relighting"),
      p("A separate IC-Light FBC module experiments with foreground/background-conditioned relighting. It uses a Realistic Vision V5.1 SD1.5 base, patches the UNet input to accept the noisy latent plus foreground and background conditioning latents, and merges IC-Light offset weights. The documented inference works at SD1.5's 512-scale before upscaling."),
      diagram("autobg-relight"),
      note("Implementation boundary", "IC-Light is not a mode exposed by the current /process dispatcher. It is a supporting experiment, not a feature implied by the current browser demo or a dependency of every AutoBG request."),
    ] },
    { id: "api", number: "09", part: "Part V / Product and runtime", title: "A small API with an explicit output contract.", blocks: [
      table(["Endpoint", "Behavior"], [
        ["GET /", "Returns service status and active matting model identifier"],
        ["GET /templates", "Lists available studio templates"],
        ["POST /process", "Accepts an image plus template/mode fields; returns image/png bytes"],
      ]),
      code("Multipart request", "POST /process\nContent-Type: multipart/form-data\n\nfile     = uploaded image\ntemplate = white_studio\nmode     = reflect_ai\n\nResponse: image/png (binary)"),
      p("Empty uploads and unreadable images return 400 errors. Segmentation and renderer failures return 500 responses with the failing stage's message. The frontend receives the PNG as a blob, creates an object URL, previews it, and offers a local download."),
      p("The browser's progress bar is estimated, not backend telemetry: it approaches 90% using an elapsed-time curve and completes when the server response arrives. This avoids pretending that a waiting browser knows the actual diffusion step count. It must not be presented as a real-time GPU progress feed."),
      note("Production hardening", "The reviewed service allows wildcard CORS, reads the uploaded file into memory, and runs model work directly in the request path. Authentication, strict mode validation, upload limits, GPU concurrency control, timeouts, and structured error handling are appropriate hardening work; their presence is not claimed here."),
    ] },
    { id: "runtime", number: "10", part: "Part V / Product and runtime", title: "Spend GPU time where it changes the result.", blocks: [
      p("The README reports approximate NVIDIA L4 request timings of 0.7 seconds for template composition, 13 seconds for AI reflection, and 18 seconds for full-background generation. The graph reproduces those reported values on one seconds axis. It is a mode-cost comparison, not a new benchmark performed for this portfolio."),
      diagram("autobg-runtime"),
      p("The template mode avoids diffusion after matting. Reflection mode pays for a constrained generated region. Full-background mode pays for a wider generative scene and a reintegration chain. This separation gives the caller a meaningful quality/consistency/cost choice instead of running the largest available model for every operation."),
      p("Startup warms matting and, by default, attempts to preload SDXL through WARM_SDXL. The SDXL and ControlNet objects are reused by reflection and background modes. Cold model download/loading, GPU memory pressure, input dimensions, package versions, and renderer settings can all change end-to-end latency."),
      note("No invented quality score", "No standardized matting, vehicle-identity, or reflection-quality benchmark was supplied. This study therefore reports architecture and approximate README timings, not a fabricated accuracy, throughput, or photorealism percentage."),
    ] },
    { id: "modules", number: "11", part: "Part VI / Operating the system", title: "Keep responsibilities small enough to inspect.", blocks: [
      table(["Module", "Responsibility"], [
        ["main", "Decode, validate, downscale, segment, dispatch, and return PNG"],
        ["segment", "Cached BiRefNet inference and continuous-alpha RGBA output"],
        ["compositing", "Studio assets, edge recovery, placement, reflections, shadows, and realism"],
        ["reflect_gen", "Reflection mask, initialized mirror, SDXL conditioning, and local paste-back"],
        ["aigen", "Shared diffusion loader, background generation, and scene integration"],
        ["make_plate", "Offline construction of reusable empty studio plates"],
        ["iclight", "Independent experimental conditioned-relighting path"],
        ["Frontend", "Upload state, estimated progress, before/after previews, and PNG download"],
      ]),
      h("What to evaluate next"),
      list("Use a held-out set of side, front, and three-quarter views, including mirrors and fine trim.", "Measure silhouette/edge quality separately from foreground color preservation.", "Inspect wheel contact, reflection correspondence, duplicate-car artifacts, and floor halos.", "Compare all modes with fixed inputs and explicit settings, recording cold and warm timings separately.", "Test empty, oversized, malformed, no-car, and concurrent requests before making an operational reliability claim."),
      p("Observability should distinguish decode errors, segmentation failures, model-load failures, out-of-memory conditions, and renderer errors. Stage timings and the selected mode/model/configuration are more actionable than a single total request duration. Any production queue or retry layer should also make GPU work idempotent and avoid silently duplicating expensive generation."),
    ] },
    { id: "takeaways", number: "12", part: "Closing / Engineering judgment", title: "The boundary is the feature.", blocks: [
      p("AutoBG's central choice is selective generation. Continuous matting protects the silhouette; deterministic compositing establishes placement and ground contact; diffusion is given a bounded region or an explicit reintegration path. The result is easier to reason about than a single unconstrained prompt to redraw the scene."),
      list("Fix foreground color contamination as well as alpha quality.", "Anchor reflections and shadows to the actual silhouette, not only its bounding box.", "Separate reusable scene preparation from online inference.", "Use explicit generation boundaries, reproducible settings, and source-cutout reintegration.", "Keep prototype behavior, README timings, experiments, and future hardening clearly distinguished."),
    ] },
  ],
};

export function readingMinutes(document: ProjectDocument) {
  const text = document.sections.flatMap((section) => section.blocks.map((block) => {
    if ("text" in block) return block.text;
    if (block.type === "table") return block.rows.flat().join(" ");
    if (block.type === "list") return block.items.join(" ");
    return "";
  })).join(" ");
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200));
}
