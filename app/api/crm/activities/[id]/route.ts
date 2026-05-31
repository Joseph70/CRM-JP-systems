import { NextRequest } from "next/server";

import { apiError, json, parseJson } from "@/src/server/http";
import { canReadWorkspaceId, requireRole, requireSession } from "@/src/server/route-auth";
import { validateActivityUpdate } from "@/src/server/schemas";
import { crmStore } from "@/src/server/store";

type RouteContext = {
  params: {
    id: string;
  };
};

async function getActivityWorkspaceId(activityId: string) {
  const activity = await crmStore.getActivity(activityId);

  if (!activity) {
    return { activity: undefined };
  }

  const customer = await crmStore.getCustomer(activity.customerId);
  return { activity, workspaceId: customer?.workspaceId };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const session = requireSession(request);

  if (!session.ok) {
    return session.response;
  }

  const activity = await crmStore.getActivity(params.id);

  if (!activity) {
    return apiError("Actividad no encontrada.", 404);
  }

  const customer = await crmStore.getCustomer(activity.customerId);

  if (!customer?.workspaceId || !canReadWorkspaceId(session.user, customer.workspaceId)) {
    return apiError("No tienes acceso a este cliente.", 403);
  }

  return json(activity);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = requireRole(request, "OPERATOR");

  if (!session.ok) {
    return session.response;
  }

  const current = await getActivityWorkspaceId(params.id);

  if (!current.activity) {
    return apiError("Actividad no encontrada.", 404);
  }

  if (!current.workspaceId || !canReadWorkspaceId(session.user, current.workspaceId)) {
    return apiError("No tienes acceso a este cliente.", 403);
  }

  const result = validateActivityUpdate(await parseJson(request));

  if (!result.ok) {
    return apiError("Datos invalidos.", 422, result.errors);
  }

  if (result.data.customerId) {
    const targetCustomer = await crmStore.getCustomer(result.data.customerId);

    if (!targetCustomer?.workspaceId || !canReadWorkspaceId(session.user, targetCustomer.workspaceId)) {
      return apiError("No tienes acceso a este cliente.", 403);
    }
  }

  const activity = await crmStore.updateActivity(params.id, result.data);

  if (!activity) {
    return apiError("Actividad o cliente asociado no encontrado.", 404);
  }

  return json(activity);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = requireRole(request, "CLIENT_ADMIN");

  if (!session.ok) {
    return session.response;
  }

  const current = await getActivityWorkspaceId(params.id);

  if (!current.activity) {
    return apiError("Actividad no encontrada.", 404);
  }

  if (!current.workspaceId || !canReadWorkspaceId(session.user, current.workspaceId)) {
    return apiError("No tienes acceso a este cliente.", 403);
  }

  const deleted = await crmStore.deleteActivity(params.id);

  if (!deleted) {
    return apiError("Actividad no encontrada.", 404);
  }

  return json({ ok: true });
}
