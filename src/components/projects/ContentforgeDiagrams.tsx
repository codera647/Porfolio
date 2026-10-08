import { Arrow, FlowRow, Node, Shell } from "./SynapseDiagrams";
import styles from "./SynapseDiagrams.module.css";

export function ContentforgeArchitectureDiagram() {
  return <Shell project="ContentForge AI" title="One application. Explicit server boundaries."
    columns={["Product", "Authenticated API", "Services & state"]}
    caption="Next.js serves the interface and route handlers. AI credentials stay server-side; records are scoped to the authenticated user.">
    <div className={styles.architecture}>
      <div className={styles.stack}>
        <Node title="Next.js interface" detail="dashboard · create · library · calendar · brands" />
        <Arrow down />
        <Node title="Clerk session" detail="sign in → authenticated workspace" accent />
        <Arrow down />
        <Node title="Typed API client" detail="validated requests · loading & error states" />
      </div>
      <Arrow />
      <div className={styles.stack}>
        <Node title="Route handlers" detail="resolve active user · validate input" accent />
        <Arrow down />
        <Node title="Ownership & limits" detail="user-scoped queries · atomic AI allowance" />
        <Arrow down />
        <Node title="Application services" detail="generate · repurpose · schedule · synchronize" accent />
      </div>
      <Arrow />
      <div className={styles.stack}>
        <Node title="AI provider adapter" detail="OpenAI-compatible / Anthropic / mock" accent />
        <Node title="Prisma → PostgreSQL" detail="brands · content · schedules · usage" />
        <Node title="Google Calendar" detail="optional consent-based event synchronization" />
      </div>
    </div>
  </Shell>;
}

export function ContentforgeGenerationDiagram() {
  return <Shell project="ContentForge AI" title="A shared voice. Distinct creative directions."
    columns={["Context", "Strategy fan-out", "Validate & retain"]}
    caption="Up to three independent requests run in parallel. A single variation chooses one strategy; two use Direct and Story-driven; three include Educational.">
    <div className={styles.architecture}>
      <div className={styles.stack}>
        <Node title="Brand voice" detail="identity · audience · phrases · style · examples" />
        <Arrow down />
        <Node title="Content brief" detail="format · topic · objective · tone · length · CTA" />
        <Arrow down />
        <Node title="Prompt builder" detail="format rules + voice + chosen strategy" accent />
      </div>
      <Arrow />
      <div className={styles.stack}>
        <Node title="Direct" detail="clear benefit · immediate hook · focused CTA" accent />
        <Node title="Story-driven" detail="narrative opening · tension · resolution" />
        <Node title="Educational" detail="explanation · practical steps · takeaway" />
      </div>
      <Arrow />
      <div className={styles.stack}>
        <Node title="Provider responses" detail="bounded retries · structured title / body" />
        <Arrow down />
        <Node title="JSON validation" detail="parse response · reject unreadable output" accent />
        <Arrow down />
        <Node title="Preview or save" detail="transactional draft records when requested" />
      </div>
    </div>
  </Shell>;
}

export function ContentforgeWorkflowDiagram() {
  return <Shell project="ContentForge AI" title="From a saved idea to a planned release"
    columns={["Library", "Adapt", "Plan", "Optional sync"]}
    caption="Repurposed drafts retain sourceContentId. The calendar is a planning tool: a saved schedule is not an automatic social-media publication.">
    <FlowRow nodes={[
      { title: "Saved content", detail: "search · edit · copy · duplicate" },
      { title: "Repurpose", detail: "source text + brand voice → another format", accent: true },
      { title: "Schedule", detail: "platform + date/time → monthly calendar" },
      { title: "Google event", detail: "opt-in synchronization · retryable errors", accent: true },
    ]} />
    <div className={styles.persisted}>Schedule mutations use database transactions. Google updates use a per-schedule advisory lock and deterministic event identity.</div>
  </Shell>;
}

export function ContentforgeDataDiagram() {
  return <Shell project="ContentForge AI" title="A workspace anchored to one identity"
    columns={["Identity", "Creative records", "Operational records"]}
    caption="User ownership is carried through brands, content, schedules, usage, and the calendar connection. OAuth tokens are retrieved through Clerk rather than stored as application records.">
    <div className={styles.architecture}>
      <div className={styles.stack}>
        <Node title="User" detail="Clerk identity · active workspace" accent />
        <Arrow down />
        <Node title="Lifecycle synchronization" detail="signed webhooks · active-user checks" />
      </div>
      <Arrow />
      <div className={styles.stack}>
        <Node title="Brand" detail="voice fields · owned by user" />
        <Arrow down />
        <Node title="Content" detail="format · body · status · brand · source link" accent />
      </div>
      <Arrow />
      <div className={styles.stack}>
        <Node title="ScheduledContent" detail="date/time · platform · event sync state" />
        <Node title="AiUsage" detail="unique user + UTC day · operation count" accent />
        <Node title="GoogleCalendarConnection" detail="consent preference · external account ID" />
      </div>
    </div>
  </Shell>;
}
