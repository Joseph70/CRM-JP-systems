import { NextRequest } from "next/server";
import { apiError, json, parseJson } from "@/src/server/http";
import { canReadWorkspaceId, requireRole } from "@/src/server/route-auth";
import { validateConversationTaskCreate } from "@/src/server/schemas";
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

  const result = validateConversationTaskCreate(await parseJson(request));

  if (!result.ok) {
    return apiError("Datos invalidos.", 422, result.errors);
  }

  const activity = await crmStore.createActivityForConversation(params.id, result.data);

  if (!activity) {
    return apiError("No se pudo crear la tarea.", 404);
  }

  return json(activity, { status: 201 });
}
