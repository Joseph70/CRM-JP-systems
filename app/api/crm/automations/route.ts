import { NextRequest } from "next/server";
import { json } from "@/src/server/http";
import { getWorkspaceScope, requireSession } from "@/src/server/route-auth";
import { crmStore } from "@/src/server/store";

export async function GET(request: NextRequest) {
  const session = requireSession(request);

  if (!session.ok) {
    return session.response;
  }

  const workspaceId = request.nextUrl.searchParams.get("workspaceId") ?? undefined;
  const scope = getWorkspaceScope(session.user, workspaceId);

  if (!scope.ok) {
    return scope.response;
  }

  if (!scope.workspaceIds) {
    return json(await crmStore.listAutomationRules());
  }

  const rules = await Promise.all(scope.workspaceIds.map((id) => crmStore.listAutomationRules(id)));
  return json(rules.flat());
}
