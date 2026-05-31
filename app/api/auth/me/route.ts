import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/src/server/auth";
import { json } from "@/src/server/http";

export function GET(request: NextRequest) {
  const user = getSessionFromRequest(request);

  return json({ user });
}
