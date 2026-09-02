export type MediaType = "image" | "video" | "reconstruction";

export type TerminalLine = {
  text: string;
  kind?: "success";
};

export type TerminalBlock = {
  command: string;
  lines?: TerminalLine[];
};

export type TerminalSpec = {
  label: string;
  heading: string;
  subtitle: string;
  intro: string;
  caption: string;
  blocks: TerminalBlock[];
};

export type CaseStudy = {
  slug: string;
  number: string;
  title: string;
  subtitle: string;
  label?: string;
  categories: string[];
  summary: string;
  technology: string[];
  size: "large" | "half";
  visualDirection: string;
  context: string;
  challenge: string;
  idea?: string;
  experience?: string;
  contribution: string[];
  uxApproach?: string;
  engineeringApproach?: string;
  accessibility?: string;
  outcome: { heading: "Outcome" | "What I Learned"; text: string };
  mockup?: "chatbot";
  mediaType?: MediaType;
  mediaSrc?: string;
  mediaAlt?: string;
  externalHref?: string;
  externalLabel?: string;
  prototypeHref?: string;
  workflow?: string[];
  jiraWorkflow?: string[];
  pipelines?: { title: string; stages: string[]; note?: string }[];
  branchDiagrams?: {
    title: string;
    root: string;
    mid?: string;
    branches: string[];
    footer?: string;
    note?: string;
  }[];
  terminal?: TerminalSpec;
};
