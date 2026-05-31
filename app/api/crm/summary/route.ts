import { NextRequest } from "next/server";
import { json } from "@/src/server/http";
import { getWorkspaceScope, requireSession } from "@/src/server/route-auth";
import { crmStore } from "@/src/server/store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = requireSession(request);

  if (!session.ok) {
    return session.response;
  }

  const scope = getWorkspaceScope(session.user);

  if (!scope.ok) {
    return scope.response;
  }

  return json(await crmStore.getSummary(scope.workspaceIds));
}
