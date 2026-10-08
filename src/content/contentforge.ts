import type { WalkthroughScreen } from "@/components/projects/SynapseWalkthrough";

export const contentforgeScreens: readonly WalkthroughScreen[] = [
  { src: "/projects/contentforge/screens/1.png", width: 1908, height: 705, title: "The product promise", note: "Create marketing content that still sounds like your brand." },
  { src: "/projects/contentforge/screens/2.png", width: 1920, height: 674, title: "Your workspace", note: "Usage, saved content, brands, and upcoming plans in one dashboard." },
  { src: "/projects/contentforge/screens/6.png", width: 1891, height: 874, title: "Define the voice", note: "Identity, audience, values, writing style, and examples become reusable context." },
  { src: "/projects/contentforge/screens/3.png", width: 1902, height: 798, title: "Write the brief", note: "Choose a format, topic, audience, tone, and up to three distinct variations." },
  { src: "/projects/contentforge/screens/4.png", width: 1920, height: 712, title: "Keep the work", note: "Search, edit, repurpose, duplicate, and schedule saved content." },
  { src: "/projects/contentforge/screens/5.png", width: 1920, height: 809, title: "Plan the next release", note: "A monthly planning calendar, with optional Google Calendar synchronization." },
];

export const contentforgeFormats = ["LinkedIn", "X / Twitter", "Instagram", "Facebook", "Marketing email", "Ad copy", "Product description", "Blog post"];

export const contentforgeModules = [
  ["auth", "Resolves the Clerk identity to an active database user and provisions the workspace before authenticated rendering."],
  ["prompt-builder", "Combines the brief, brand voice, format constraints, and variation strategy into a structured generation prompt."],
  ["generators", "Runs independent variation requests in parallel and adapts saved content into another format."],
  ["provider", "Switches OpenAI-compatible, Anthropic, or mock adapters; bounds retries and handles upstream timeouts."],
  ["validation / limits", "Validates request fields and generated JSON, caps brands, and atomically reserves daily AI operations."],
  ["scheduling / calendar", "Keeps content and planning records consistent, then optionally synchronizes Google Calendar events."],
] as const;

export const contentforgeProviders = [
  ["OpenAI-compatible", "gpt-4o", "Default model identifier; the model and base URL can be configured for a compatible gateway."],
  ["Anthropic", "claude-sonnet-4-20250514", "Configurable default for the Messages API adapter."],
  ["Mock", "Deterministic templates", "Strategy-aware local outputs for offline development and tests; not model inference."],
] as const;
