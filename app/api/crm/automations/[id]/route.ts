import { NextRequest } from "next/server";
import { apiError, json, parseJson } from "@/src/server/http";
import { canReadWorkspaceId, requireRole } from "@/src/server/route-auth";
import { crmStore } from "@/src/server/store";
import { asObject, readString } from "@/src/server/validation";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = requireRole(request, "OPERATOR");

  if (!session.ok) {
    return session.response;
  }

  const current = await crmStore.getAutomationRule(params.id);

  if (!current) {
    return apiError("Automatizacion no encontrada.", 404);
  }

  if (!canReadWorkspaceId(session.user, current.workspaceId)) {
    return apiError("No tienes acceso a este cliente.", 403);
  }

  const source = asObject(await parseJson(request));
  const errors: Record<string, string> = {};
  const name = readString(source, "name", errors, { maxLength: 120 });
  const trigger = readString(source, "trigger", errors, { maxLength: 160 });
  const action = readString(source, "action", errors, { maxLength: 160 });
  const active = typeof source.active === "boolean" ? source.active : undefined;

  if (Object.keys(errors).length) {
    return apiError("Datos invalidos.", 422, errors);
  }

  const automation = await crmStore.updateAutomationRule(params.id, {
    active,
    name,
    trigger,
    action,
  });

  if (!automation) {
    return apiError("Automatizacion no encontrada.", 404);
  }

  return json(automation);
}
