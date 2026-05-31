import { NextResponse } from "next/server";

import type { ApiError } from "./types";

export function json<T>(data: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(data, init);
}

export function apiError(error: string, status = 400, details?: Record<string, string>) {
  const body: ApiError = details ? { error, details } : { error };
  return NextResponse.json(body, { status });
}

export async function parseJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
