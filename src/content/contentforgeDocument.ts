import type { DiagramId, DocumentBlock, ProjectDocument } from "./projectDocuments";

const p = (text: string): DocumentBlock => ({ type: "paragraph", text });
const note = (label: string, text: string): DocumentBlock => ({ type: "note", label, text });
const diagram = (id: DiagramId): DocumentBlock => ({ type: "diagram", id });
const table = (columns: string[], rows: string[][]): DocumentBlock => ({ type: "table", columns, rows });
const list = (...items: string[]): DocumentBlock => ({ type: "list", items });

export const contentforgeDocument: ProjectDocument = {
  slug: "contentforge",
  name: "ContentForge AI",
  title: "A voice that survives the workflow.",
  subtitle: "An engineering study of brand-aware content creation",
  abstract: "How reusable brand context, strategy-driven generation, authenticated persistence, and calendar planning turn a content prompt into a complete product workflow.",
  tags: ["Generative AI", "Brand voice", "Content workflows", "Provider resilience"],
  sections: [
    { id: "intent", number: "01", part: "Part I / The product", title: "Content needs context, not just a prompt.", blocks: [
      p("A useful content-generation product has to preserve more than a topic. It needs to know who is speaking, who is reading, what the content should achieve, and how a particular format changes the delivery. Re-entering that information for every request creates friction and inconsistency."),
      p("ContentForge AI combines reusable brand profiles with a structured brief. Generated pieces can be saved, edited, repurposed, and planned on a calendar. The workspace is individual and authenticated; it is not a team collaboration or autonomous publishing platform."),
      table(["Input", "Product responsibility", "Outcome"], [
        ["Brand voice and examples", "Retain reusable writing context", "A consistent starting point for prompts"],
        ["Brief and target format", "Select constraints and creative strategies", "One to three candidate drafts"],
        ["Saved content and date/time", "Manage reuse and planning state", "A searchable library and calendar plan"],
      ]),
      note("Human judgment remains necessary", "Prompt guidance is not a guarantee of factual correctness, brand compliance, or legal suitability. A person reviews the draft before using it."),
    ] },
    { id: "interface", number: "02", part: "Part I / The product", title: "Make the workflow visible.", blocks: [
      p("The interface separates Dashboard, Create, Library, Calendar, Brands, and Settings. The dashboard summarizes usage, content counts, recent work, and upcoming schedules. The creation form puts the brief next to its output rather than hiding the process behind a conversational interface."),
      { type: "image", src: "/projects/contentforge/screens/3.png", width: 1902, height: 798, alt: "ContentForge AI creation form and output area", caption: "The creation workspace pairs explicit controls with a generated-content area." },
      p("The library exposes the lifecycle of a piece through search and filters for format, status, and brand. Editing, copying, duplication, repurposing, scheduling, and deletion remain explicit user actions. The calendar shows the intended release date rather than promising automatic distribution."),
      list("Loading states explain when generation is in progress.", "Empty states separate an unused workspace from a failed request.", "Validation and provider errors are surfaced without returning sensitive upstream details."),
    ] },
    { id: "architecture", number: "03", part: "Part II / The system", title: "One application, several responsibilities.", blocks: [
      p("Next.js 16 App Router and TypeScript provide both the web product and server API route handlers. Tailwind CSS handles the product interface. Clerk manages authentication; Prisma connects application services to PostgreSQL. AI access is isolated in a server-only provider layer."),
      diagram("contentforge-architecture"),
      table(["Layer", "Responsibility", "Boundary"], [
        ["Browser", "Collect briefs and display content", "No AI provider secrets"],
        ["API routes", "Resolve identity, validate requests, enforce ownership", "Do not trust a client-supplied resource ID alone"],
        ["Services", "Generate, repurpose, persist, schedule, synchronize", "Separate local records from external integrations"],
        ["PostgreSQL", "Durable workspace records and concurrency control", "Not a content-quality evaluator"],
      ]),
    ] },
    { id: "voice", number: "04", part: "Part II / The system", title: "The brand profile is reusable context.", blocks: [
      p("The profile has eleven fields: name, description, industry, target audience, personality, tone, values, preferred phrases, avoided phrases, writing style, and example content. A selected profile is loaded with the authenticated user's ownership constraint before being transformed into prompt input."),
      { type: "image", src: "/projects/contentforge/screens/6.png", width: 1891, height: 874, alt: "ContentForge AI brand identity and voice fields", caption: "Identity, voice, phrases, and examples are configured once and reused across generation and repurposing." },
      p("The prompt builder introduces those fields as writing guidance. Preferred phrases are encouraged, avoided phrases are constrained, and example copy helps communicate rhythm and diction. Example text is clipped to 1,200 characters for the prompt, keeping stored profile size separate from inference context size."),
      note("Optional context", "Generation can proceed without a brand. Selecting one adds reusable guidance; it does not train or fine-tune a separate model."),
    ] },
    { id: "generation", number: "05", part: "Part III / Execution", title: "Variation means a different approach.", blocks: [
      p("The brief includes the target format, topic, audience, objective, tone, length, keywords, CTA, and variation count. Eight formats are supported: LinkedIn, X/Twitter, Instagram, Facebook, marketing email, ad copy, product description, and blog post. Each format introduces its own delivery constraints."),
      diagram("contentforge-generation"),
      table(["Strategy", "Creative direction", "Temperature"], [
        ["Direct", "Clear benefit, focused hook and CTA", "0.7"],
        ["Story-driven", "Narrative opening and progression", "0.9"],
        ["Educational", "Explanation and practical takeaways", "0.8"],
      ]),
      p("Three variations use all three strategies; two use Direct and Story-driven. A single variation chooses one strategy. The generator runs the requested variations with Promise.all, so they are independent provider calls, not a sequential multi-agent workflow. A failed variation rejects the group rather than silently returning a partial success."),
      p("The API can return previews without saving. If saving is requested, the variations are persisted together as drafts in a database transaction, retaining the original brief fields and variation index."),
    ] },
    { id: "providers", number: "06", part: "Part III / Execution", title: "Switch the provider, keep the product.", blocks: [
      p("A common adapter interface accepts messages, temperature, and token budget. OpenAI-compatible and Anthropic implementations translate this request to their respective APIs; a deterministic mock provider supports offline workflows and tests."),
      table(["Adapter", "Configurable default", "Purpose"], [
        ["OpenAI-compatible", "gpt-4o", "Chat-completions API; configurable model and base URL"],
        ["Anthropic", "claude-sonnet-4-20250514", "Messages API; configurable model and base URL"],
        ["Mock", "Deterministic templates", "Strategy-aware test and development output"],
      ]),
      p("Transient network failures, rate limits, and selected 5xx responses receive bounded retries with exponential backoff and jitter. Retry-After is capped at five seconds. The ordinary upstream retry policy permits three attempts, and individual request timeouts are bounded at ninety seconds."),
      p("The OpenAI-compatible path also recognizes an empty completion caused by a length finish reason and can retry with an expanded token budget. This is a targeted compatibility mechanism, not a fallback to a different provider."),
      note("Configuration is not deployment evidence", "These identifiers are defaults in the code. They do not identify the model used for every supplied recording, and the mock adapter is not a real language model."),
    ] },
    { id: "validation", number: "07", part: "Part III / Execution", title: "Treat generated output as untrusted input.", blocks: [
      p("Request validation constrains the topic, audience, objective, tone, keywords, CTA, format, length, and variation count. The generation count must be between one and three. Invalid JSON or invalid request fields receive an explicit client error before model work begins."),
      p("The generation prompt asks for a JSON object containing title and body. The response parser accepts clean JSON, markdown-fenced JSON, and a balanced embedded object. It still validates the resulting object: a readable body is required, and an absent or invalid title can fall back to Untitled."),
      p("A structurally valid body can still contain inaccurate claims. Parsing protects the software contract, not the truth of the marketing copy. Provider failures and unreadable outputs return recoverable errors, while sensitive provider diagnostics stay in server logs."),
      list("Validate the request before loading external services.", "Validate generated structure before previewing or persisting it.", "Keep structural validation separate from human content review."),
    ] },
    { id: "ownership", number: "08", part: "Part IV / Durable workflows", title: "Every record belongs to a workspace.", blocks: [
      p("The identity resolver reads the Clerk session and maps it to an active database user. A first login provisions the workspace through the same resolver used by APIs. Signed Clerk lifecycle webhooks keep identity changes synchronized, and inactive-user checks prevent stale access."),
      diagram("contentforge-data"),
      p("Brands, content, schedules, usage, and Google Calendar preferences carry user ownership. API queries scope resource lookups to that owner rather than treating possession of an ID as permission. Brand and content relationships preserve the context needed for later reuse."),
      table(["Entity", "Retained state"], [
        ["User", "Clerk identity and active workspace"],
        ["Brand", "Identity and reusable voice fields"],
        ["Content", "Body, format, status, brand, brief, and source relationship"],
        ["ScheduledContent", "Release plan and external synchronization state"],
        ["AiUsage", "Per-user UTC-day operation count"],
        ["GoogleCalendarConnection", "Consent preference and external account identity"],
      ]),
    ] },
    { id: "reuse", number: "09", part: "Part IV / Durable workflows", title: "Reuse the idea without losing its origin.", blocks: [
      p("Repurposing starts from an owned, saved piece and a different target format. The prompt carries the source text, original and target formats, and available brand context. Source text is clipped to 6,000 characters for this prompt. Same-format repurposing is blocked."),
      p("The result is saved as a new draft linked through sourceContentId. The original remains intact, making adaptation a traceable relationship rather than a destructive edit. Library actions keep direct editing, duplication, and AI-driven repurposing conceptually separate."),
      diagram("contentforge-workflow"),
      note("Status is not publication", "Draft, Scheduled, Published, and Archived are application statuses. Published is a manual lifecycle label, not proof that a social network received a post."),
    ] },
    { id: "calendar", number: "10", part: "Part IV / Durable workflows", title: "Save the plan before synchronizing it.", blocks: [
      p("Scheduling records the content, platform, and intended date/time. A serializable database transaction creates or updates the schedule and adjusts the content status. Cancelling the last pending schedule returns scheduled content to Draft; archived content must be restored before scheduling."),
      { type: "image", src: "/projects/contentforge/screens/5.png", width: 1920, height: 809, alt: "ContentForge AI monthly calendar and optional Google Calendar connection", caption: "The monthly grid displays saved plans. Google Calendar connection is optional and explicitly consented." },
      p("The optional Google integration obtains OAuth tokens through Clerk. A deterministic event identity and a per-schedule PostgreSQL advisory lock coordinate concurrent synchronization attempts. Persisted event IDs and error state support retrying failed updates without discarding the local plan."),
      note("External failure has a boundary", "A Google synchronization error does not imply the content schedule was lost. The user can reconnect or retry; the product does not automatically publish content or promise background delivery to social platforms."),
    ] },
    { id: "limits", number: "11", part: "Part V / Reliability", title: "Budget the work at the server boundary.", blocks: [
      p("The server caps each user at three brands and fifty accepted generation or repurposing operations per UTC day. The daily allowance counts operations, not individual variations or provider retry attempts. A three-variation request is one operation even though it makes multiple upstream calls."),
      p("Usage reservation uses conditional atomic increments and handles concurrent row-creation races. An accepted operation remains consumed if the provider fails. Brand creation uses serializable transactions with bounded retries for transaction conflicts, avoiding a client-only limit that simultaneous requests could bypass."),
      table(["Boundary", "Implemented mechanism", "Remaining judgment"], [
        ["AI usage", "Atomic daily operation reservation", "Quota is not a provider-cost measurement"],
        ["Brand creation", "Serializable limit check and insert", "Product limits may change independently of schema"],
        ["Upstream failures", "Bounded retries and generic client errors", "Not an availability guarantee"],
        ["Calendar updates", "Transactional plans and advisory-locked sync", "External consent and service availability still matter"],
      ]),
    ] },
    { id: "takeaways", number: "12", part: "Closing / Engineering judgment", title: "The workflow is the product.", blocks: [
      p("The repository includes Vitest tests for prompt construction, generators, provider retries, validation, authorization, quotas, calendar behavior, lifecycle webhooks, and workspace provisioning. Opt-in PostgreSQL integration coverage exercises persistence boundaries. These are test surfaces in the implementation, not newly measured quality or latency results."),
      p("No supplied accuracy benchmark establishes brand fidelity or marketing effectiveness. Useful next evaluations would compare strategy diversity, review avoided-phrase behavior, check human-rated voice consistency, and test concurrent usage and calendar updates against a real database. Such evaluations should retain their prompts, models, samples, and failure cases."),
      list("Reusable context reduces repeated setup, but does not eliminate review.", "Creative diversity comes from explicit strategies, not a multi-agent claim.", "Ownership and quotas belong at the server boundary.", "Local planning and external calendar state need separate failure handling.", "A good AI product keeps the work usable after generation ends."),
    ] },
  ],
};
