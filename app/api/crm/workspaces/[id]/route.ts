import { NextRequest } from "next/server";
import { apiError, json, parseJson } from "@/src/server/http";
import { canReadWorkspaceId, requireRole, requireSession } from "@/src/server/route-auth";
import { validateWorkspaceUpdate } from "@/src/server/schemas";
import { crmStore } from "@/src/server/store";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const session = requireSession(request);

  if (!session.ok) {
    return session.response;
  }

  if (!canReadWorkspaceId(session.user, params.id)) {
    return apiError("No tienes acceso a este cliente.", 403);
  }

  const workspace = await crmStore.getWorkspace(params.id);

  if (!workspace) {
    return apiError("Empresa no encontrada.", 404);
  }

  return json(workspace);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = requireRole(request, "CLIENT_ADMIN");

  if (!session.ok) {
    return session.response;
  }

  if (!canReadWorkspaceId(session.user, params.id)) {
    return apiError("No tienes acceso a este cliente.", 403);
  }

  const result = validateWorkspaceUpdate(await parseJson(request));

  if (!result.ok) {
    return apiError("Datos invalidos.", 422, result.errors);
  }

  const workspace = await crmStore.updateWorkspace(params.id, result.data);

  if (!workspace) {
    return apiError("Empresa no encontrada.", 404);
  }

  return json(workspace);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = requireRole(request, "AGENCY_ADMIN");

  if (!session.ok) {
    return session.response;
  }

  if (!canReadWorkspaceId(session.user, params.id)) {
    return apiError("No tienes acceso a este cliente.", 403);
  }

  const deleted = await crmStore.deleteWorkspace(params.id);

  if (!deleted) {
    return apiError("Empresa no encontrada.", 404);
  }

  return json({ ok: true });
}
