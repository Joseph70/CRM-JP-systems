import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/src/server/auth";
import { apiError, json } from "@/src/server/http";

export function GET(request: NextRequest) {
  const user = getSessionFromRequest(request);

  if (!user) {
    return apiError("No autenticado.", 401);
  }

  return json({ user });
}
