import { NextRequest } from "next/server";
import { json } from "@/src/server/http";
import { crmStore } from "@/src/server/store";
import type { WebhookEvent } from "@/src/server/types";

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get("provider") as WebhookEvent["provider"] | null;
  return json(await crmStore.listWebhookEvents(provider ?? undefined));
}
