import { NextRequest } from "next/server";
import { apiError, json, parseJson } from "@/src/server/http";
import { getWorkspaceScope, requireRole, requireSession } from "@/src/server/route-auth";
import { validateCustomerCreate } from "@/src/server/schemas";
import { crmStore } from "@/src/server/store";

export async function GET(request: NextRequest) {
  const session = requireSession(request);

  if (!session.ok) {
    return session.response;
  }

  const search = request.nextUrl.searchParams.get("search") ?? undefined;
  const workspaceId = request.nextUrl.searchParams.get("workspaceId") ?? undefined;
  const scope = getWorkspaceScope(session.user, workspaceId);

  if (!scope.ok) {
    return scope.response;
  }

  if (!scope.workspaceIds) {
    return json(await crmStore.listCustomers(search));
  }

  const customers = await Promise.all(scope.workspaceIds.map((id) => crmStore.listCustomers(search, id)));
  return json(customers.flat());
}

export async function POST(request: NextRequest) {
  const session = requireRole(request, "OPERATOR");

  if (!session.ok) {
    return session.response;
  }

  const result = validateCustomerCreate(await parseJson(request));

  if (!result.ok) {
    return apiError("Datos invalidos.", 422, result.errors);
  }

  if (result.data.workspaceId) {
    const scope = getWorkspaceScope(session.user, result.data.workspaceId);

    if (!scope.ok) {
      return scope.response;
    }
  }

  const customer = await crmStore.createCustomer(result.data);

  return json(customer, { status: 201 });
}
