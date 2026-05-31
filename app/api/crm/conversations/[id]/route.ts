import { NextRequest } from "next/server";
import { apiError, json, parseJson } from "@/src/server/http";
import { canReadWorkspaceId, requireRole, requireSession } from "@/src/server/route-auth";
import { validateConversationUpdate } from "@/src/server/schemas";
import { crmStore } from "@/src/server/store";

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

  const conversation = await crmStore.getConversation(params.id);

  if (!conversation) {
    return apiError("Conversacion no encontrada.", 404);
  }

  if (!canReadWorkspaceId(session.user, conversation.workspaceId)) {
    return apiError("No tienes acceso a este cliente.", 403);
  }

  return json(conversation);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = requireRole(request, "OPERATOR");

  if (!session.ok) {
    return session.response;
  }

  const result = validateConversationUpdate(await parseJson(request));

  if (!result.ok) {
    return apiError("Datos invalidos.", 422, result.errors);
  }

  const current = await crmStore.getConversation(params.id);

  if (!current) {
    return apiError("Conversacion no encontrada.", 404);
  }

  if (!canReadWorkspaceId(session.user, current.workspaceId)) {
    return apiError("No tienes acceso a este cliente.", 403);
  }

  const conversation = await crmStore.updateConversation(params.id, result.data);

  if (!conversation) {
    return apiError("Conversacion no encontrada.", 404);
  }

  return json(conversation);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = requireRole(request, "OPERATOR");

  if (!session.ok) {
    return session.response;
  }

  const current = await crmStore.getConversation(params.id);

  if (!current) {
    return apiError("Conversacion no encontrada.", 404);
  }

  if (!canReadWorkspaceId(session.user, current.workspaceId)) {
    return apiError("No tienes acceso a este cliente.", 403);
  }

  const deleted = await crmStore.deleteConversation(params.id);

  if (!deleted) {
    return apiError("Conversacion no encontrada.", 404);
  }

  return json({ ok: true });
}
