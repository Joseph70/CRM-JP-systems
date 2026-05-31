import { NextRequest } from "next/server";
import { canAccessWorkspace, getSessionFromRequest, hasRole } from "@/src/server/auth";
import { apiError, json, parseJson } from "@/src/server/http";
import { getWorkspaceScope, requireSession } from "@/src/server/route-auth";
import { crmStore } from "@/src/server/store";
import { asObject, readEnum, readString } from "@/src/server/validation";
import type { WhatsAppTemplate } from "@/src/server/types";

const templateStatuses = ["draft", "pending_approval", "approved", "rejected"] as const;

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
    return json(await crmStore.listWhatsAppTemplates());
  }

  const templates = await Promise.all(scope.workspaceIds.map((id) => crmStore.listWhatsAppTemplates(id)));
  return json(templates.flat());
}

export async function POST(request: NextRequest) {
  const user = getSessionFromRequest(request);

  if (!user || !hasRole(user, "CLIENT_ADMIN")) {
    return apiError("Permisos insuficientes.", user ? 403 : 401);
  }

  const source = asObject(await parseJson(request));
  const errors: Record<string, string> = {};
  const workspaceId = readString(source, "workspaceId", errors, { required: true, maxLength: 80 });
  const name = readString(source, "name", errors, { required: true, maxLength: 80 });
  const language = readString(source, "language", errors, { required: true, maxLength: 8 });
  const category = readString(source, "category", errors, { required: true, maxLength: 40 });
  const body = readString(source, "body", errors, { required: true, maxLength: 1024 });
  const status = readEnum<WhatsAppTemplate["status"]>(source, "status", templateStatuses, errors);

  if (workspaceId && !canAccessWorkspace(user, workspaceId)) {
    return apiError("No tienes acceso a este cliente.", 403);
  }

  if (Object.keys(errors).length > 0) {
    return apiError("Datos invalidos.", 422, errors);
  }

  const template = await crmStore.createWhatsAppTemplate({
    workspaceId: workspaceId!,
    name: name!,
    language: language!,
    category: category!,
    body: body!,
    status: status ?? "draft",
  });

  if (!template) {
    return apiError("Workspace no encontrado.", 404);
  }

  await crmStore.recordAuditLog({
    workspaceId: template.workspaceId,
    actorUserId: user.id,
    action: "whatsapp_template.create",
    entityType: "WhatsAppTemplate",
    entityId: template.id,
    metadata: { name: template.name, status: template.status },
  });

  return json(template, { status: 201 });
}
