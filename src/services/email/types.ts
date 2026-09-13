export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export interface EmailProvider {
  send(options: SendEmailOptions): Promise<SendEmailResult>;
}
