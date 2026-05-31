import { NextRequest } from "next/server";
import { apiError, json, parseJson } from "@/src/server/http";
import { canReadWorkspaceId, requireRole } from "@/src/server/route-auth";
import { crmStore } from "@/src/server/store";
import { asObject, readEnum, readString } from "@/src/server/validation";
import type { MessageDirection } from "@/src/server/types";

const messageDirections = ["inbound", "outbound"] as const;
const messageStatuses = ["received", "sent", "delivered", "read", "failed"] as const;

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

  const source = asObject(await parseJson(request));
  const errors: Record<string, string> = {};

  const direction = readEnum<MessageDirection>(source, "direction", messageDirections, errors, {
    required: true,
  });
  const body = readString(source, "body", errors, { required: true, maxLength: 2000 });
  const status = readEnum(source, "status", messageStatuses, errors, { required: true });

  if (Object.keys(errors).length > 0) {
    return apiError("Datos invalidos.", 422, errors);
  }

  const conversation = await crmStore.appendConversationMessage(params.id, {
    direction: direction!,
    body: body!,
    status: status!,
  });

  if (!conversation) {
    return apiError("Conversacion no encontrada.", 404);
  }

  return json(conversation, { status: 201 });
}
