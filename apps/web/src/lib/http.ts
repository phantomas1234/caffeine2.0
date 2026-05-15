import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError } from "./errors";

export type ApiError = {
  error: string;
  details?: unknown;
};

export function jsonError(
  status: number,
  message: string,
  details?: unknown,
): NextResponse<ApiError> {
  return NextResponse.json({ error: message, details }, { status });
}

export function handleError(err: unknown): NextResponse<ApiError> {
  if (err instanceof UnauthorizedError) return jsonError(401, "unauthorized");
  if (err instanceof ZodError)
    return jsonError(400, "invalid input", err.flatten());
  if (err instanceof Error) {
    console.error("[api error]", err);
    return jsonError(500, err.message);
  }
  console.error("[api error]", err);
  return jsonError(500, "internal error");
}
