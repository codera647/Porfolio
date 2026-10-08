import type { DocumentBlock, DiagramId, ProjectDocument } from "./projectDocuments";

const p = (text: string): DocumentBlock => ({ type: "paragraph", text });
const note = (label: string, text: string): DocumentBlock => ({ type: "note", label, text });
const diagram = (id: DiagramId): DocumentBlock => ({ type: "diagram", id });
const table = (columns: string[], rows: string[][]): DocumentBlock => ({ type: "table", columns, rows });
const list = (...items: string[]): DocumentBlock => ({ type: "list", items });

export const trailforgeModules = [
  ["runtime / ports", "Scoped Goal/Task contracts, explicit adapter capabilities, bounded attempts, and typed verifier results."],
  ["store", "SQLite checkpoints, journal consistency, optimistic state versions, and atomic admission with shared local ledgers."],
  ["develop", "Allowlisted candidate writes, protected checks, finite phase rounds, continuity, and verified handoff artifacts."],
  ["evidence / controller", "The separate Offline Review profile: bound snapshots, exact citation validation, coverage gaps, and review drafts."],
  ["publication", "Exact intents, expiring host approvals, durable operation admission, and inspect-only reconciliation."],
  ["adapters / telemetry", "Linux Docker execution, exact retrieval, optional orchestration and legacy database/broker integrations, plus allowlisted event projections."],
] as const;

export const trailforgeDocument: ProjectDocument = {
  slug: "trailforge",
  name: "Trailforge",
  title: "Bound the work. Preserve the trail.",
  subtitle: "A technical study of a custom agent execution harness",
  abstract: "The contracts, durable checkpoints, evidence boundaries, recovery semantics, and host-controlled approvals behind a provider-independent Python agent harness.",
  tags: ["Agent harness", "Durable execution", "Verification", "Python / SQLite"],
  pdfFilename: "Trailforge-Technical-Reference-and-User-Guide-v0.1.0a1.pdf",
  pdfDescription: "The download is the original 46-page v0.1.0a1 Technical Reference and User Guide, including CLI recipes, API signatures, diagrams, release evidence, and operational guidance. This reading page is a concise engineering study of that implementation.",
  sections: [
    { id: "intent", number: "01", part: "Part I / The problem", title: "An agent needs a boundary, not just a prompt.", blocks: [
      p("A capable model can propose work without proving that the work is complete, safe to repeat, or authorized to affect an external system. Trailforge addresses the control layer around that intelligence: admit a finite goal, bound each task, preserve evidence, and keep uncertain outcomes visible."),
      p("The application host owns identity, product policy, model selection, real provider limits, and acceptance criteria. The harness records what was admitted and observed; it does not turn a model's confidence into permission. The public package is an MIT alpha, v0.1.0a1, with a standard-library-only base runtime and Python 3.11 or later."),
      table(["Responsibility", "Trailforge", "Application host"], [
        ["Execution", "Bounded tasks, admission, checkpoints, attempts, receipts", "Choose adapters and finite work"],
        ["Acceptance", "Require typed, goal-bound verification results", "Define and protect meaningful criteria"],
        ["External effects", "Bind approvals and preserve publication uncertainty", "Authenticate people, check live policy, integrate a real publisher"],
        ["Model use", "A provider-independent adapter contract", "Select models, credentials, prompts, tokens, timeouts, and price limits"],
      ]),
      note("Release boundary", "This is reusable execution infrastructure, not a production certification, a built-in live model service, or the complete Diffwise application."),
    ] },
    { id: "architecture", number: "02", part: "Part II / Architecture", title: "One kernel. Separate authority planes.", blocks: [
      p("The neutral Harness executes typed Goal and Task records under SQLite authority. Develop is a profile layered on this kernel. A separate OfflineController runs a fixed Review demonstration using fixtures and mock output; its protocol and database integrations must not be confused with generic execution."),
      diagram("trailforge-architecture"),
      table(["Component", "Purpose", "Important boundary"], trailforgeModules.map(([name, purpose]) => [name, purpose, name === "adapters / telemetry" ? "Optional integrations require explicit host composition." : name === "evidence / controller" ? "Separate fixed Review protocol, not a live multi-model product." : "Trusted host code and configured authority, not implicit model permissions."])),
      p("LangGraph can schedule a kernel advance, but SQLite remains the neutral resume authority. The PostgreSQL, outbox, and broker adapters belong to the legacy Review/controller path. They are not a generic distributed PostgreSQL backend for the neutral Harness."),
    ] },
    { id: "contracts", number: "03", part: "Part II / Architecture", title: "Declare the work before it begins.", blocks: [
      p("A Goal binds tenant, resource, objective, ordered tasks, required checks, allowed effects, and limits. Tasks identify a registered adapter, bounded input, and dependencies on earlier tasks. Between 1 and 128 unique tasks are admitted in topological order; at least one required check must reference a VERIFY adapter."),
      table(["Contract", "What it carries"], [
        ["Task", "task_id, adapter_id, input, earlier dependencies"],
        ["AdapterCapabilities", "MODEL / TOOL / VERIFY kind, effect, protocol, input/output bounds, reservation units"],
        ["TaskRequest", "Run/task identity, exact scope, goal digest, detached input and completed dependency outputs"],
        ["VerifiedResult", "PASS / FAIL / UNKNOWN, the same goal digest, bounded evidence"],
      ]),
      p("PURE, SCOPED_READ, and explicitly admitted CANDIDATE_WRITE effects are supported by the neutral plan. EXTERNAL_WRITE is denied there and belongs at a separate publisher boundary. Adapter kinds are integration roles, not operating-system privileges."),
      note("Identity is not implementation hashing", "Goal hashing binds declared work and input. Adapter metadata is bound too, but callback implementation bytes are not automatically hashed. Hosts must version behavior, model and prompt configuration deliberately."),
    ] },
    { id: "runtime", number: "04", part: "Part III / Execution", title: "Admission is durable before execution.", blocks: [
      p("Start records a READY run. Before each synchronous callback, the kernel reserves declared units and persists the attempt with an active lease. It passes detached JSON observations, validates the returned value, and records a digest-bound result receipt before proceeding."),
      diagram("trailforge-runtime"),
      p("Completed task outputs are reused after reconstructing the host. Resume requires the same goal, adapter metadata, scope, and store; changed bindings are rejected. A pause after a task records its result without granting approval. Tasks execute sequentially within one run, not concurrently."),
      table(["Observation", "Meaning"], [
        ["CHECKING", "A task result is recorded; the complete goal may still have work remaining."],
        ["COMPLETED", "Every required check passed after the declared task sequence."],
        ["FAILED", "A required check failed."],
        ["WAITING_HUMAN", "Unknown evidence, exhausted attempts, or denied budget requires a host decision."],
        ["CANCELLED", "Terminal cancellation; previously admitted units and uncertainty remain."],
      ]),
    ] },
    { id: "recovery", number: "05", part: "Part III / Execution", title: "Unknown is a state, not an invitation to retry.", blocks: [
      p("Exceptions, invalid or oversized output, and expired active attempts retain uncertainty rather than masquerading as success. UNKNOWN holds the run. A trusted host explicitly resolves the affected task with RETRY or CANCEL; retry does not reset the consumed attempts or units."),
      table(["Limit", "Default", "Meaning"], [
        ["Per-goal units", "32", "Declared adapter reservations, not tokens or dollars"],
        ["Attempts per task", "3 maximum", "Retained through explicit recovery"],
        ["Input / output", "65,536 bytes each", "Adapter-specific bounded JSON"],
        ["Lease", "30 seconds", "Commit ownership; supported duration is greater than zero and at most 300 seconds"],
        ["Tenant / global units", "1,000 / 10,000", "Shared only within the same SQLite authority file"],
      ]),
      p("A lease can reject a late commit; it cannot interrupt synchronous Python or undo a provider call. Cancellation likewise revokes commitment without promising remote cancellation. Hosts need actual provider timeouts, spend policies, and idempotency where those services support them."),
      note("Conservative recovery", "Inspect the journal and any provider evidence before retrying. A lost response may conceal a completed remote action; a new request is not automatically safe just because the old result is unavailable."),
    ] },
    { id: "persistence", number: "06", part: "Part III / Execution", title: "A checkpoint must agree with its journal.", blocks: [
      p("SQLite stores a canonical run payload, binding digest, state version, and checksum. The latest journal sequence and state digest must agree with that checkpoint when it is loaded. Compare-and-swap updates reject a stale state version or changed binding."),
      p("Neutral task admission uses BEGIN IMMEDIATE to reserve tenant/global units and commit the new checkpoint and journal event atomically. Reconstructing a host does not reset its ledger, and configured caps cannot be silently changed. Separate database files are separate authorities."),
      table(["Record", "Retained information"], [
        ["runs", "Run identity, version, canonical payload, binding and checksum"],
        ["events", "Run sequence, transition kind and resulting state digest"],
        ["execution_limits", "Authority-scoped caps and admitted reservations"],
        ["publication_approvals / operations", "Exact approval consumption and durable effect observations"],
      ]),
      note("Integrity limit", "These checks are not signed receipts or a complete cryptographic history chain. An administrator who can rewrite the database can also recompute hashes. Protect the store, access policy, backups, and credentials outside the harness."),
    ] },
    { id: "develop", number: "07", part: "Part IV / Profiles & evidence", title: "Build candidates. Protect the checks.", blocks: [
      p("Develop declares one to three six-phase rounds before admission: PLAN, RESEARCH, BUILD, DEBUG, VERIFY, HEALTH. Five phases are host adapters; HEALTH is built in. Only BUILD receives CANDIDATE_WRITE. Other phases may be pure or scoped reads, and protected criteria live outside the candidate tree."),
      diagram("trailforge-develop"),
      p("CandidateWorkspace admits an explicit list of 1–128 canonical paths, rejects case aliases and linked-file variants, bounds file bytes, and replaces writes atomically through a temporary file. Pre/post tree checks detect unauthorized candidate changes and altered protected checks."),
      p("VERIFY binds host evidence to the candidate, check tree, round, and goal. HEALTH checks candidate continuity. The final round's verification and health are required for completion, and a handoff is rejected if the candidate or checks change afterward."),
      note("Trusted callbacks are not a sandbox", "Same-process host callbacks remain trusted Python. Develop's continuity checks do not turn them into adversary-proof code. A handoff is a review artifact, not permission to merge, deploy, or publish."),
    ] },
    { id: "evidence", number: "08", part: "Part IV / Profiles & evidence", title: "An exact quote is evidence, not a verdict.", blocks: [
      p("The fixed Offline Review path captures scoped, revision-bound source bytes and validates findings against exact paths, one-based line ranges, preserved quotes, and receipts. Its security, correctness, tests, and documentation roles are configured outputs of one mock callback, not four built-in live agents."),
      diagram("trailforge-evidence"),
      p("Unsupported files, truncation, malformed findings, and timeouts leave coverage gaps. A draft always needs human review; the critic is not implemented and reliability is unset. COMPLETE means the configured workflow's coverage is complete, not that every reported issue is a real defect."),
      p("LocalArtifactStore provides bounded, content-addressed bytes with scope and integrity receipts. LocalRetrieval performs revision-bound, case-insensitive EXACT_LITERAL matching over allowlisted files. It returns matching files in sorted order—not semantic rankings or vector chunks—and marks them as untrusted source data."),
      note("Do not promote data into authority", "A valid source digest shows correspondence to bytes. It does not authenticate the author, authorize an action, or prove the model's interpretation is correct."),
    ] },
    { id: "publication", number: "09", part: "Part V / Integration boundaries", title: "Approve an exact effect. Inspect ambiguity.", blocks: [
      p("GuardedPublisher binds an intent to tenant, resource, goal and policy digests, revision, action, payload, adapter, and execution mode. A live host guard authorizes approval, execution, revocation, and reconciliation. Approval expiry defaults to 300 seconds and cannot be treated as lasting authority."),
      diagram("trailforge-publication"),
      p("Before dispatch, approval consumption and a stable SENDING operation are persisted. A valid bound acknowledgement yields ACCEPTED. A lost response or invalid acknowledgement yields UNKNOWN. Replaying the same intent observes the stored operation; reconciliation only calls inspect, never blindly executes it again."),
      note("Included integration", "The bundled publisher is a durable local simulator. Actual GitHub, email, or deployment publishers and customer authentication remain host work. Deduplicated intent admission is not a universal exactly-once guarantee from arbitrary providers."),
    ] },
    { id: "integrations", number: "10", part: "Part V / Integration boundaries", title: "Optional integrations retain their own limits.", blocks: [
      table(["Integration", "Implemented role", "Boundary"], [
        ["Linux Docker", "Digest-pinned image, no network, read-only mounts/root, non-root execution, dropped capabilities, bounded resources/output and owned cleanup", "Local Linux-container engine required; no automatic pull or host-shell fallback"],
        ["PostgreSQL", "Legacy Review authority, fenced leases, ledgers, migrations, transactional outbox", "Not the neutral Goal/Task backend; documented database validation is Linux-specific"],
        ["Broker", "Closed proposals checked against roles, scope, policy, session, revisions and versions", "A model proposal is not a credential; broker and neutral approvals are not interchangeable"],
        ["LangGraph", "START → kernel → END scheduling facade", "SQLite remains authoritative; no separate graph checkpoint or approval mechanism"],
        ["JsonEventSink", "Explicit allowlisted operational JSON projections", "No automatic cloud exporter, metrics server, or cross-process delivery guarantee"],
      ]),
      p("Docker execution receipts bind command, image, candidate/check trees, goal, and output. They default to an UNKNOWN criterion verdict: exit code zero alone cannot establish semantic acceptance. A trusted verifier must interpret that execution evidence against the original requirement."),
      p("Telemetry deliberately excludes arbitrary prompts, source text, tokens, and actor/provider fields. Hosts can monitor held attempts, budget denial, stale leases, ambiguous publication, dispatch exhaustion, and cleanup failures while keeping full authority records out of routine operational logs."),
    ] },
    { id: "verification", number: "11", part: "Part VI / Evidence & adoption", title: "Conformance is not model accuracy.", blocks: [
      p("The v0.1.0a1 guide records installed-package conformance coverage for the alpha release. These are documented release results, not new test runs performed by this portfolio and not measurements of real-provider answer quality."),
      table(["Release suite", "Documented execution"], [
        ["Portable installed wheel", "62 cases per matrix cell: Ubuntu 24.04 / Windows 2022 × Python 3.11 / 3.13.15"],
        ["Optional LangGraph", "2 installed-extra cases against the accepted base wheel"],
        ["Legacy PostgreSQL", "56 installed-extra cases on Linux PostgreSQL 18.6"],
        ["Native Linux Docker", "5 installed-wheel container-boundary cases"],
        ["Suite acceptance", "Zero failures, errors, skips, or expected failures in accepted reports"],
      ]),
      p("A separate evaluation would need representative data, independently protected acceptance, diagnostic correctness, cost, latency, and unsafe-action measurements. A repository-owned workflow and test suite cannot substitute for independently administered review."),
      note("Version matters", "Treat release evidence as a snapshot of v0.1.0a1. Later source changes require fresh verification. Alpha APIs can change, and stable-release or production assurances are not implied."),
    ] },
    { id: "limits", number: "12", part: "Part VI / Evidence & adoption", title: "Keep the host responsible.", blocks: [
      list("Pin the release and required extras; keep authority stores and credentials private.", "Define exact tenant/resource identity, finite tasks, explicit effects, and meaningful protected checks.", "Version material adapter/model/prompt choices; enforce real provider timeouts and cost limits separately.", "Make UNKNOWN, exhausted budgets, and cancellation visible to an operator.", "Use a tested Linux runner for untrusted commands; trusted callbacks are not an operating-system isolation boundary.", "Integrate real publishers only with current identity, policy, revision checks and tested inspect/reconciliation behavior."),
      p("Potential extensions include a general distributed-authority adapter, richer retrieval, additional product profiles, calibrated model evaluations, and independent acceptance infrastructure. They are roadmap directions—not shipped capabilities of this alpha."),
      note("The design principle", "Let intelligence propose the next observation. Let the host decide authority. Let the runtime preserve what was admitted, checked, and left uncertain."),
    ] },
  ],
};
