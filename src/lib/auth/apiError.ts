import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

export function apiError(code: string, message: string, status: number, fields?: Record<string, string>) {
  const body: ApiErrorBody = { error: { code, message, ...(fields ? { fields } : {}) } };
  return NextResponse.json(body, { status });
}

export function validationError(error: ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_root";
    if (!fields[key]) fields[key] = issue.message;
  }
  return apiError("validation_error", "Please check the highlighted fields.", 422, fields);
}
