import { NextRequest } from "next/server";
import { apiError, json } from "@/src/server/http";
import { canReadWorkspaceId, requireRole } from "@/src/server/route-auth";
import { crmStore } from "@/src/server/store";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(request: NextRequest, { params }: RouteContext) {
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

  const conversation = await crmStore.markConversationRead(params.id);

  if (!conversation) {
    return apiError("Conversacion no encontrada.", 404);
  }

  return json(conversation);
}
