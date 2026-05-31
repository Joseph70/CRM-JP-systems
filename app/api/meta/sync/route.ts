import { NextRequest } from "next/server";
import { getSessionFromRequest, hasRole } from "@/src/server/auth";
import { apiError, json } from "@/src/server/http";
import { processMetaCampaignResponse } from "@/src/server/meta-processing";
import { getWorkspaceScope } from "@/src/server/route-auth";
import { crmStore } from "@/src/server/store";

export async function POST(request: NextRequest) {
  const user = getSessionFromRequest(request);

  if (!user || !hasRole(user, "AGENCY_ADMIN")) {
    return apiError("Permisos insuficientes.", user ? 403 : 401);
  }

  const accessToken = process.env.META_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  const workspaceId = request.nextUrl.searchParams.get("workspaceId") ?? user.workspaceIds[0] ?? "ws_terra";
  const scope = getWorkspaceScope(user, workspaceId);

  if (!scope.ok) {
    return scope.response;
  }

  let providerResponse: unknown;
  let processed: unknown;

  if (accessToken && adAccountId) {
    const response = await fetch(
      `https://graph.facebook.com/v20.0/act_${adAccountId.replace(/^act_/, "")}/campaigns?fields=id,name,status,objective,insights{spend,actions,cost_per_action_type}&access_token=${accessToken}`,
    );
    providerResponse = await response.json().catch(() => ({}));
    if (response.ok) {
      processed = await processMetaCampaignResponse(providerResponse, workspaceId);
    }
  }

  await crmStore.recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    action: "meta.sync.request",
    entityType: "MetaIntegration",
    metadata: {
      ready: Boolean(accessToken && adAccountId),
    },
  });

  return json({
    ok: true,
    mode: accessToken && adAccountId ? "meta_api" : "local_simulation",
    nextStep: "Usar META_ACCESS_TOKEN y META_AD_ACCOUNT_ID para importar formularios, campanas, anuncios y gasto.",
    processed,
    providerResponse,
  });
}
