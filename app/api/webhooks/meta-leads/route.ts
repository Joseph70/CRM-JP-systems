import { NextRequest } from "next/server";
import { json } from "@/src/server/http";
import { processMetaLeadPayload } from "@/src/server/meta-processing";
import { crmStore } from "@/src/server/store";
import { verifyMetaSignature } from "@/src/server/webhook-security";

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");
  const expectedToken = process.env.META_VERIFY_TOKEN ?? "jp-sistems-dev-token";

  if (mode === "subscribe" && token === expectedToken && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return json({ error: "Token de verificacion invalido." }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = verifyMetaSignature(
    rawBody,
    request.headers.get("x-hub-signature-256"),
    process.env.META_APP_SECRET,
  );

  if (!signature.ok) {
    return json({ error: "Firma de webhook invalida." }, { status: 401 });
  }

  const payload = JSON.parse(rawBody || "{}");
  const workspaceId = request.nextUrl.searchParams.get("workspaceId") ?? "ws_terra";
  const event = await crmStore.recordWebhookEvent("meta-leads", payload);
  const processed = await processMetaLeadPayload(payload, workspaceId, process.env.META_ACCESS_TOKEN);

  return json({
    ok: true,
    provider: "meta-leads",
    eventId: event.id,
    receivedAt: event.receivedAt,
    signatureSkipped: signature.skipped,
    processed,
    payload
  });
}
