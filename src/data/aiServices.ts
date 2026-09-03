import {
  Zap,
  Bot,
  Search,
  Plug,
  Terminal,
  Rocket,
  type LucideIcon,
} from "lucide-react";

export type AICapabilityGroup = {
  icon: LucideIcon;
  title: string;
  description: string;
  items: string[];
};

export const aiCapabilities: AICapabilityGroup[] = [
  {
    icon: Zap,
    title: "AI Products & Applications",
    description:
      "Ship AI features that solve real business problems on day one — built fast, tested against real usage, and ready to scale from launch.",
    items: [
      "Fast AI Solutions",
      "Generative AI Applications",
      "AI Chatbots & Virtual Assistants",
      "AI-Powered Search",
      "Document AI & Data Extraction",
      "Production-Ready AI Applications",
    ],
  },
  {
    icon: Bot,
    title: "LLMs & Agentic Workflows",
    description:
      "Design language-model systems and autonomous agents that automate multi-step work reliably, with predictable, structured results.",
    items: [
      "Large Language Models (LLMs)",
      "AI Agents & Agentic Workflows",
      "Prompt Engineering",
      "Tool / Function Calling",
      "Structured AI Outputs",
      "Streaming AI Responses",
    ],
  },
  {
    icon: Search,
    title: "RAG & Intelligent Search",
    description:
      "Ground AI in your own data so answers are accurate, current and traceable — turning static content into an intelligent, searchable asset.",
    items: [
      "Retrieval-Augmented Generation (RAG)",
      "Vector Databases",
      "Embeddings & Semantic Search",
      "Natural Language Processing (NLP)",
      "Machine Learning Integration",
    ],
  },
  {
    icon: Plug,
    title: "AI API & Model Integrations",
    description:
      "Securely connect leading AI providers and internal systems, so your product stays flexible across models without vendor lock-in.",
    items: [
      "OpenAI API Integration",
      "Anthropic / Claude API Integration",
      "Gemini API Integration",
      "Model Context Protocol (MCP)",
      "AI API Development",
      "REST API Integration",
      "Secure AI API Integration",
    ],
  },
  {
    icon: Terminal,
    title: "AI Backend & Python Development",
    description:
      "Engineer robust backend foundations for AI products — fast APIs, clean data layers and architecture built to handle real production load.",
    items: [
      "AI Development Environments",
      "FastAPI Development",
      "Python AI Development",
      "AI Backend Architecture",
      "Database Integration",
      "PostgreSQL / SQL Integration",
    ],
  },
  {
    icon: Rocket,
    title: "Deployment & Production Readiness",
    description:
      "Take AI features from prototype to production with automated pipelines, monitoring and evaluation, so quality and cost stay under control at scale.",
    items: [
      "AI Automation",
      "Workflow Automation",
      "Cloud AI Deployment",
      "Docker & Containerization",
      "AWS AI Solutions",
      "CI/CD for AI Applications",
      "AI Testing & Evaluation",
      "LLM Observability",
      "Performance Optimization",
    ],
  },
];
