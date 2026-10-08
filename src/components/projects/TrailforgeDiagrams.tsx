import { Arrow, FlowRow, Node, Shell } from "./SynapseDiagrams";
import styles from "./SynapseDiagrams.module.css";

export function TrailforgeArchitectureDiagram() {
  return <Shell project="Trailforge" title="The host owns authority. The harness bounds execution."
    columns={["Trusted application host", "Neutral execution kernel", "Bounded integrations"]}
    caption="SQLite is the neutral runtime's authority. Optional PostgreSQL supports the separate legacy Review profile, not generic Goal/Task execution.">
    <div className={styles.architecture}>
      <div className={styles.stack}>
        <Node title="Identity & policy" detail="tenant · resource · permissions · provider limits" />
        <Arrow down />
        <Node title="Goal + ordered tasks" detail="explicit effects · budget · required checks" accent />
        <Arrow down />
        <Node title="Protected acceptance" detail="host-controlled criteria and verification" />
      </div><Arrow />
      <div className={styles.stack}>
        <Node title="Harness" detail="admit → execute → check → complete or hold" accent />
        <Arrow down />
        <Node title="SQLite authority" detail="checkpoints · journal · reservations · versions" />
        <Arrow down />
        <Node title="Develop profile" detail="finite rounds · candidate/check continuity" />
      </div><Arrow />
      <div className={styles.stack}>
        <Node title="Registered adapters" detail="MODEL · TOOL · VERIFY / trusted host code" accent />
        <Node title="Artifacts & retrieval" detail="bounded bytes · revision-bound exact matches" />
        <Node title="Linux Docker runner" detail="separately configured isolation boundary" />
        <Node title="GuardedPublisher" detail="separate exact approval / effect boundary" accent />
      </div>
    </div>
  </Shell>;
}

export function TrailforgeRuntimeDiagram() {
  return <Shell project="Trailforge" title="Persist admission before executing the task"
    columns={["Bound contract", "Durable admission", "Trusted callback", "Recorded result"]}
    caption="Ambiguous outcomes retain the admitted attempt and units. A trusted host must explicitly choose RETRY or CANCEL; a lease fences commits, not callback execution.">
    <FlowRow nodes={[
      { title: "READY", detail: "scope + goal + adapter binding" },
      { title: "RUNNING", detail: "reserve units · persist attempt + lease", accent: true },
      { title: "Adapter", detail: "bounded input / dependencies → output" },
      { title: "CHECKING", detail: "store result + digest-bound receipt", accent: true },
    ]} />
    <div className={styles.persisted}>Required checks → PASS: COMPLETED / FAIL: FAILED / UNKNOWN: WAITING_HUMAN. Callback uncertainty also holds the run. Cancellation is terminal.</div>
  </Shell>;
}

export function TrailforgeDevelopDiagram() {
  return <Shell project="Trailforge" title="Finite development rounds. Protected acceptance."
    columns={["Understand", "Create & inspect", "Verify & retain"]}
    caption="One to three rounds are declared up front. The final round's VERIFY and HEALTH are required checks. A handoff requires the same candidate and protected check trees.">
    <div className={styles.architecture}>
      <div className={styles.stack}><Node title="PLAN" detail="bounded objective and proposed approach" /><Arrow down /><Node title="RESEARCH" detail="scoped observations · no candidate writes" /></div>
      <Arrow />
      <div className={styles.stack}><Node title="BUILD" detail="only phase granted CANDIDATE_WRITE" accent /><Arrow down /><Node title="DEBUG" detail="inspect outcomes · no candidate writes" /></div>
      <Arrow />
      <div className={styles.stack}><Node title="VERIFY" detail="host criterion + exact candidate/check digests" accent /><Arrow down /><Node title="HEALTH" detail="built-in candidate continuity check" /><Arrow down /><Node title="Handoff" detail="review artifact, not deployment permission" /></div>
    </div>
  </Shell>;
}

export function TrailforgePublicationDiagram() {
  return <Shell project="Trailforge" title="Approval is bound to an exact effect"
    columns={["Intent & authority", "Durable dispatch", "Observe outcome"]}
    caption="The included publisher is a durable local simulation. Real external publishers and customer identity are host integrations; ambiguous publication is inspected, never blindly resent.">
    <div className={styles.architecture}>
      <div className={styles.stack}><Node title="Exact intent" detail="scope · goal · policy · revision · action · payload" /><Arrow down /><Node title="Host approval" detail="live authorization · expiry · revocation" accent /></div>
      <Arrow />
      <div className={styles.stack}><Node title="SENDING" detail="consume approval + persist operation first" accent /><Arrow down /><Node title="Publisher adapter" detail="execute the bound operation" /></div>
      <Arrow />
      <div className={styles.stack}><Node title="ACCEPTED" detail="valid acknowledgement for the same operation" /><Node title="UNKNOWN" detail="lost response or invalid acknowledgement" accent /><Arrow down /><Node title="Reconcile" detail="inspect the same operation · no re-execution" /></div>
    </div>
  </Shell>;
}

export function TrailforgeEvidenceDiagram() {
  return <Shell project="Trailforge" title="Source evidence is data, not authority"
    columns={["Capture", "Propose", "Validate", "Review"]}
    caption="The fixed Offline Review demonstration uses a mock callback. Exact citation validation establishes source correspondence, not that a proposed defect is real.">
    <FlowRow nodes={[
      { title: "Bound snapshot", detail: "scope · revision · paths · byte digests" },
      { title: "Mock finding", detail: "role · path · lines · preserved quote" },
      { title: "Evidence checks", detail: "receipt + exact source correspondence", accent: true },
      { title: "Human review", detail: "retained gaps · COMPLETE or PARTIAL" },
    ]} />
    <div className={styles.persisted}>A complete workflow is not calibrated model quality. Independent acceptance and real-provider evaluations remain separate responsibilities.</div>
  </Shell>;
}
