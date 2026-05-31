import { NextRequest } from "next/server";
import { apiError, json, parseJson } from "@/src/server/http";
import { canReadWorkspaceId, getWorkspaceScope, requireRole, requireSession } from "@/src/server/route-auth";
import { validateActivityCreate } from "@/src/server/schemas";
import { crmStore } from "@/src/server/store";

export async function GET(request: NextRequest) {
  const session = requireSession(request);

  if (!session.ok) {
    return session.response;
  }

  const customerId = request.nextUrl.searchParams.get("customerId") ?? undefined;
  const scope = getWorkspaceScope(session.user);

  if (!scope.ok) {
    return scope.response;
  }

  if (customerId) {
    const customer = await crmStore.getCustomer(customerId);

    if (!customer) {
      return apiError("Cliente asociado no encontrado.", 404);
    }

    if (!customer.workspaceId || !canReadWorkspaceId(session.user, customer.workspaceId)) {
      return apiError("No tienes acceso a este cliente.", 403);
    }
  }

  return json(await crmStore.listActivities(customerId, scope.workspaceIds));
}

export async function POST(request: NextRequest) {
  const session = requireRole(request, "OPERATOR");

  if (!session.ok) {
    return session.response;
  }

  const result = validateActivityCreate(await parseJson(request));

  if (!result.ok) {
    return apiError("Datos invalidos.", 422, result.errors);
  }

  const customer = await crmStore.getCustomer(result.data.customerId);

  if (!customer) {
    return apiError("Cliente asociado no encontrado.", 404);
  }

  if (!customer.workspaceId || !canReadWorkspaceId(session.user, customer.workspaceId)) {
    return apiError("No tienes acceso a este cliente.", 403);
  }

  const activity = await crmStore.createActivity(result.data);

  if (!activity) {
    return apiError("Cliente asociado no encontrado.", 404);
  }

  return json(activity, { status: 201 });
}
