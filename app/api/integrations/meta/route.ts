import { NextRequest } from "next/server";
import { json } from "@/src/server/http";
import { crmStore } from "@/src/server/store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspaceId") ?? undefined;
  const integrations = await crmStore.listIntegrationConnections(workspaceId);

  return json({
    provider: "meta",
    mode: "mock",
    readyFor: ["Meta Graph API", "Facebook Lead Ads", "Instagram Click to WhatsApp"],
    connections: integrations.filter((item) => item.provider === "meta_lead_ads" || item.provider === "instagram_graph"),
  });
}
