export interface SendSmsVerificationResult {
  ok: boolean;
  status?: string;
  error?: string;
}

export interface CheckSmsVerificationResult {
  ok: boolean;
  approved?: boolean;
  error?: string;
}

export interface SmsVerificationProvider {
  send(to: string): Promise<SendSmsVerificationResult>;
  check(to: string, code: string): Promise<CheckSmsVerificationResult>;
}
