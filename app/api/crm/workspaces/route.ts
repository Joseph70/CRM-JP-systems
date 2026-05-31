import { NextRequest } from "next/server";
import { apiError, json, parseJson } from "@/src/server/http";
import { getWorkspaceScope, requireRole, requireSession } from "@/src/server/route-auth";
import { validateWorkspaceCreate } from "@/src/server/schemas";
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

  const workspaces = await crmStore.listWorkspaces();

  if (!scope.workspaceIds) {
    return json(workspaces);
  }

  return json(workspaces.filter((workspace) => scope.workspaceIds!.includes(workspace.id)));
}

export async function POST(request: NextRequest) {
  const session = requireRole(request, "AGENCY_ADMIN");

  if (!session.ok) {
    return session.response;
  }

  const result = validateWorkspaceCreate(await parseJson(request));

  if (!result.ok) {
    return apiError("Datos invalidos.", 422, result.errors);
  }

  const workspace = await crmStore.createWorkspace(result.data);

  return json(workspace, { status: 201 });
}
