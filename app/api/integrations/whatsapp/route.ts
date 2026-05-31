import { NextRequest } from "next/server";
import { json } from "@/src/server/http";
import { crmStore } from "@/src/server/store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspaceId") ?? undefined;
  const [integrations, templates] = await Promise.all([
    crmStore.listIntegrationConnections(workspaceId),
    crmStore.listWhatsAppTemplates(workspaceId),
  ]);

  return json({
    provider: "whatsapp",
    mode: "mock",
    readyFor: ["WhatsApp Business Cloud API", "webhooks", "approved templates", "message sending"],
    connections: integrations.filter((item) => item.provider === "whatsapp_cloud_api"),
    templates,
  });
}
