export type SuggestedQuestion = {
  intentId: string;
  label: string;
};

export type IntentDefinition = {
  id: string;
  keywords: string[];
};

// Keyword/phrase groups used to match free-text visitor questions to an intent.
// Matching is substring-based on normalized (lowercased, punctuation-stripped) input.
export const intents: IntentDefinition[] = [
  {
    id: "services",
    keywords: ["service", "what do you offer", "what can you do", "hire you for"],
  },
  {
    id: "projects",
    keywords: ["project", "built", "have you built", "portfolio work", "case stud", "what have you made"],
  },
  {
    id: "skills",
    keywords: ["skill", "technolog", "tech stack", "what do you know", "expertise", "what can he do", "what can dominic do"],
  },
  {
    id: "education",
    keywords: ["education", "qualification", "college", "degree", "diploma", "study", "studied"],
  },
  {
    id: "experience",
    keywords: ["experience", "career", "work history", "job history", "background", "how long have you worked", "how much experience"],
  },
  {
    id: "gallery",
    keywords: ["gallery", "photo", "picture", "image"],
  },
  {
    id: "contact",
    keywords: ["contact", "get in touch", "reach you", "reach dominic"],
  },
  {
    id: "email",
    keywords: ["email", "e-mail"],
  },
  {
    id: "accessibility",
    keywords: ["accessibility", "wcag", "screen reader", "a11y", "accessible"],
  },
  { id: "sky", keywords: ["sky"] },
  { id: "lloyds", keywords: ["lloyds"] },
  { id: "react", keywords: ["react"] },
  { id: "typescript", keywords: ["typescript"] },
  { id: "javascript", keywords: ["javascript", "js "] },
  { id: "html", keywords: ["html"] },
  { id: "css", keywords: ["css"] },
  { id: "nodejs", keywords: ["node.js", "nodejs", "node js"] },
  { id: "d3", keywords: ["d3.js", "d3"] },
  { id: "aws", keywords: ["aws", "amazon web services"] },
  { id: "uiux", keywords: ["ui/ux", "ui ux", "ux/ui", "user experience", "user interface"] },
  { id: "design", keywords: ["design"] },
  { id: "innovation", keywords: ["innovation"] },
  { id: "aiDevelopment", keywords: ["ai development", "ai developer", "generative ai", "llm", "ai agent", "artificial intelligence"] },
  { id: "testing", keywords: ["testing", "test coverage", "qa", "quality assurance"] },
  { id: "frontendDevelopment", keywords: ["frontend development", "front-end development", "front end development", "frontend developer"] },
  { id: "softwareEngineering", keywords: ["software engineering", "software engineer"] },

  {
    id: "salary",
    keywords: ["salary", "salary expectation", "how much do you want", "pay expectation", "compensation"],
  },
  {
    id: "availability",
    keywords: ["when can you start", "notice period", "how soon are you available", "availability", "start date"],
  },
  {
    id: "teams",
    keywords: ["microsoft teams", "video call", "video interview", "teams interview", "arrange a call", "arrange an interview"],
  },
  {
    id: "recruiterInterest",
    keywords: ["interested in your profile", "interested in your experience", "like your profile", "your profile and experience"],
  },
  {
    id: "phone",
    keywords: ["call you", "phone number", "telephone", "can i call"],
  },
  {
    id: "resume",
    keywords: ["cv", "resume", "download your cv", "see your cv", "see your resume"],
  },
  {
    id: "reasonForLeaving",
    keywords: ["why did you leave", "why are you looking for another role", "reason for leaving", "why did you quit"],
  },
  {
    id: "jobDescription",
    keywords: ["job description", "send you a role", "send you details of a role", "send you the jd"],
  },
  {
    id: "linkedin",
    keywords: ["linkedin"],
  },
  {
    id: "github",
    keywords: ["github", "where can i see your code", "your repositories"],
  },
];

export const suggestedQuestions: SuggestedQuestion[] = [
  { intentId: "experience", label: "Experience" },
  { intentId: "projects", label: "Projects" },
  { intentId: "skills", label: "Skills" },
  { intentId: "availability", label: "Availability" },
  { intentId: "resume", label: "Resume" },
  { intentId: "contact", label: "Contact" },
];
