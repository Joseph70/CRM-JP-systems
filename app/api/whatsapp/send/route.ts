import { NextRequest } from "next/server";
import { getSessionFromRequest, hasRole } from "@/src/server/auth";
import { apiError, json, parseJson } from "@/src/server/http";
import { canReadWorkspaceId } from "@/src/server/route-auth";
import { crmStore } from "@/src/server/store";
import { asObject, readString } from "@/src/server/validation";

export async function POST(request: NextRequest) {
  const user = getSessionFromRequest(request);

  if (!user || !hasRole(user, "OPERATOR")) {
    return apiError("Permisos insuficientes.", user ? 403 : 401);
  }

  const source = asObject(await parseJson(request));
  const errors: Record<string, string> = {};
  const conversationId = readString(source, "conversationId", errors, { required: true, maxLength: 100 });
  const body = readString(source, "body", errors, { required: true, maxLength: 2000 });

  if (Object.keys(errors).length > 0) {
    return apiError("Datos invalidos.", 422, errors);
  }

  const existingConversation = await crmStore.getConversation(conversationId!);

  if (!existingConversation) {
    return apiError("Conversacion no encontrada.", 404);
  }

  if (!canReadWorkspaceId(user, existingConversation.workspaceId)) {
    return apiError("No tienes acceso a este cliente.", 403);
  }

  let providerResponse: unknown;
  let messageStatus: "sent" | "delivered" | "failed" = "delivered";
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (accessToken && phoneNumberId) {
    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: existingConversation.contactPhone.replace(/[^\d]/g, ""),
        type: "text",
        text: {
          preview_url: false,
          body: body!,
        },
      }),
    });

    providerResponse = await response.json().catch(() => ({}));
    messageStatus = response.ok ? "sent" : "failed";
  }

  const conversation = await crmStore.appendConversationMessage(conversationId!, {
    direction: "outbound",
    body: body!,
    status: messageStatus,
  });

  if (!conversation) {
    return apiError("Conversacion no encontrada.", 404);
  }

  await crmStore.recordAuditLog({
    workspaceId: conversation.workspaceId,
    actorUserId: user.id,
    action: "whatsapp.message.send",
    entityType: "Conversation",
    entityId: conversation.id,
    metadata: {
      mode: accessToken && phoneNumberId ? "cloud_api" : "local_simulation",
      status: messageStatus,
    },
  });

  return json({
    ok: messageStatus !== "failed",
    mode: accessToken && phoneNumberId ? "cloud_api" : "local_simulation",
    providerResponse,
    conversation,
  }, { status: messageStatus === "failed" ? 502 : 200 });
}
