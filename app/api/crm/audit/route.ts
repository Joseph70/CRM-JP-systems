import { NextRequest } from "next/server";
import { json } from "@/src/server/http";
import { getWorkspaceScope, requireRole } from "@/src/server/route-auth";
import { crmStore } from "@/src/server/store";

export async function GET(request: NextRequest) {
  const session = requireRole(request, "CLIENT_ADMIN");
  const workspaceId = request.nextUrl.searchParams.get("workspaceId") ?? undefined;

  if (!session.ok) {
    return session.response;
  }

  const scope = getWorkspaceScope(session.user, workspaceId);

  if (!scope.ok) {
    return scope.response;
  }

  if (!scope.workspaceIds) {
    return json(await crmStore.listAuditLogs());
  }

  const logs = await Promise.all(scope.workspaceIds.map((id) => crmStore.listAuditLogs(id)));
  return json(logs.flat());
}
