import { NextRequest } from "next/server";
import { apiError, json, parseJson } from "@/src/server/http";
import { canReadWorkspaceId, getWorkspaceScope, requireRole, requireSession } from "@/src/server/route-auth";
import { validateCustomerUpdate } from "@/src/server/schemas";
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

  const customer = await crmStore.getCustomer(params.id);

  if (!customer) {
    return apiError("Cliente no encontrado.", 404);
  }

  if (!customer.workspaceId || !canReadWorkspaceId(session.user, customer.workspaceId)) {
    return apiError("No tienes acceso a este cliente.", 403);
  }

  return json(customer);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = requireRole(request, "OPERATOR");

  if (!session.ok) {
    return session.response;
  }

  const current = await crmStore.getCustomer(params.id);

  if (!current) {
    return apiError("Cliente no encontrado.", 404);
  }

  if (!current.workspaceId || !canReadWorkspaceId(session.user, current.workspaceId)) {
    return apiError("No tienes acceso a este cliente.", 403);
  }

  const result = validateCustomerUpdate(await parseJson(request));

  if (!result.ok) {
    return apiError("Datos invalidos.", 422, result.errors);
  }

  if (result.data.workspaceId) {
    const scope = getWorkspaceScope(session.user, result.data.workspaceId);

    if (!scope.ok) {
      return scope.response;
    }
  }

  const updated = await crmStore.updateCustomer(params.id, result.data);

  if (!updated) {
    return apiError("Cliente no encontrado.", 404);
  }

  return json(updated);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = requireRole(request, "CLIENT_ADMIN");

  if (!session.ok) {
    return session.response;
  }

  const current = await crmStore.getCustomer(params.id);

  if (!current) {
    return apiError("Cliente no encontrado.", 404);
  }

  if (!current.workspaceId || !canReadWorkspaceId(session.user, current.workspaceId)) {
    return apiError("No tienes acceso a este cliente.", 403);
  }

  const deleted = await crmStore.deleteCustomer(params.id);

  if (!deleted) {
    return apiError("Cliente no encontrado.", 404);
  }

  return json({ ok: true });
}
