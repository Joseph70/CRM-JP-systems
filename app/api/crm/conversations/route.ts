import { NextRequest } from "next/server";
import { apiError, json, parseJson } from "@/src/server/http";
import { getWorkspaceScope, requireRole, requireSession } from "@/src/server/route-auth";
import { validateConversationCreate } from "@/src/server/schemas";
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
    return json(await crmStore.listConversations());
  }

  const conversations = await Promise.all(scope.workspaceIds.map((id) => crmStore.listConversations(id)));
  return json(conversations.flat());
}

export async function POST(request: NextRequest) {
  const session = requireRole(request, "OPERATOR");

  if (!session.ok) {
    return session.response;
  }

  const result = validateConversationCreate(await parseJson(request));

  if (!result.ok) {
    return apiError("Datos invalidos.", 422, result.errors);
  }

  const scope = getWorkspaceScope(session.user, result.data.workspaceId);

  if (!scope.ok) {
    return scope.response;
  }

  const conversation = await crmStore.createConversation(result.data);

  if (!conversation) {
    return apiError("Workspace no encontrado.", 404);
  }

  return json(conversation, { status: 201 });
}
