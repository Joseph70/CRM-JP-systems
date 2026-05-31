import { NextRequest } from "next/server";

import { apiError, json, parseJson } from "@/src/server/http";
import { canReadWorkspaceId, requireRole, requireSession } from "@/src/server/route-auth";
import { validateDealUpdate } from "@/src/server/schemas";
import { crmStore } from "@/src/server/store";

type RouteContext = {
  params: {
    id: string;
  };
};

async function getDealWorkspaceId(dealId: string) {
  const deal = await crmStore.getDeal(dealId);

  if (!deal) {
    return { deal: undefined };
  }

  const customer = await crmStore.getCustomer(deal.customerId);
  return { deal, workspaceId: customer?.workspaceId };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const session = requireSession(request);

  if (!session.ok) {
    return session.response;
  }

  const deal = await crmStore.getDeal(params.id);

  if (!deal) {
    return apiError("Oportunidad no encontrada.", 404);
  }

  const customer = await crmStore.getCustomer(deal.customerId);

  if (!customer?.workspaceId || !canReadWorkspaceId(session.user, customer.workspaceId)) {
    return apiError("No tienes acceso a este cliente.", 403);
  }

  return json(deal);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = requireRole(request, "OPERATOR");

  if (!session.ok) {
    return session.response;
  }

  const current = await getDealWorkspaceId(params.id);

  if (!current.deal) {
    return apiError("Oportunidad no encontrada.", 404);
  }

  if (!current.workspaceId || !canReadWorkspaceId(session.user, current.workspaceId)) {
    return apiError("No tienes acceso a este cliente.", 403);
  }

  const result = validateDealUpdate(await parseJson(request));

  if (!result.ok) {
    return apiError("Datos invalidos.", 422, result.errors);
  }

  if (result.data.customerId) {
    const targetCustomer = await crmStore.getCustomer(result.data.customerId);

    if (!targetCustomer?.workspaceId || !canReadWorkspaceId(session.user, targetCustomer.workspaceId)) {
      return apiError("No tienes acceso a este cliente.", 403);
    }
  }

  const deal = await crmStore.updateDeal(params.id, result.data);

  if (!deal) {
    return apiError("Oportunidad o cliente asociado no encontrado.", 404);
  }

  return json(deal);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = requireRole(request, "CLIENT_ADMIN");

  if (!session.ok) {
    return session.response;
  }

  const current = await getDealWorkspaceId(params.id);

  if (!current.deal) {
    return apiError("Oportunidad no encontrada.", 404);
  }

  if (!current.workspaceId || !canReadWorkspaceId(session.user, current.workspaceId)) {
    return apiError("No tienes acceso a este cliente.", 403);
  }

  const deleted = await crmStore.deleteDeal(params.id);

  if (!deleted) {
    return apiError("Oportunidad no encontrada.", 404);
  }

  return json({ ok: true });
}
