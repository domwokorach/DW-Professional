export type ChatAction = {
  label: string;
  href: string;
  external?: boolean;
};

export type LiveChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  actions?: ChatAction[];
  pending?: boolean;
};

export type ConnectionState = "connecting" | "online" | "reconnecting" | "offline";

export type PanelState = "closed" | "open" | "minimised";

/** Payload the client emits to request an assistant reply. */
export type SendMessagePayload = {
  id: string;
  message: string;
  senderId: string;
};

/** Payload the server emits for an assistant reply. */
export type ReceiveMessagePayload = {
  id: string;
  message: string;
  senderId: string;
  timestamp: number;
  actions?: ChatAction[];
};
