export type ChatAction = {
  label: string;
  href: string;
  external?: boolean;
};

export type IntentResponse = {
  content: string;
  actions?: ChatAction[];
};

export type Intent = {
  id: string;
  keywords: string[];
  respond: () => IntentResponse;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  actions?: ChatAction[];
};
