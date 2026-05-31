import { crmStore } from "./store";
import type { ConversationSource } from "./types";

type WhatsAppMessage = {
  id?: string;
  from?: string;
  text?: { body?: string };
  type?: string;
  timestamp?: string;
};

type WhatsAppStatus = {
  id?: string;
  status?: "sent" | "delivered" | "read" | "failed";
};

function firstString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function normalizeFieldData(fieldData: unknown) {
  const result: Record<string, string> = {};

  if (!Array.isArray(fieldData)) {
    return result;
  }

  for (const field of fieldData) {
    if (!field || typeof field !== "object") continue;
    const name = firstString((field as { name?: unknown }).name);
    const values = (field as { values?: unknown }).values;
    const value = Array.isArray(values) ? firstString(values[0]) : undefined;
    if (name && value) result[name] = value;
  }

  return result;
}

export async function processWhatsAppPayload(payload: unknown, workspaceId: string) {
  const processed = {
    messages: 0,
    statuses: 0,
    conversationsCreated: 0,
  };
  const entries = Array.isArray((payload as { entry?: unknown }).entry)
    ? ((payload as { entry: unknown[] }).entry)
    : [];

  for (const entry of entries) {
    const changes = Array.isArray((entry as { changes?: unknown }).changes)
      ? ((entry as { changes: unknown[] }).changes)
      : [];

    for (const change of changes) {
      const value = (change as { value?: { messages?: WhatsAppMessage[]; statuses?: WhatsAppStatus[]; contacts?: unknown[] } }).value;
      const messages = Array.isArray(value?.messages) ? value.messages : [];
      const statuses = Array.isArray(value?.statuses) ? value.statuses : [];

      for (const status of statuses) {
        if (status.id && status.status) {
          await crmStore.updateMessageStatusByProviderId(status.id, status.status);
          processed.statuses += 1;
        }
      }

      for (const message of messages) {
        if (!message.from) continue;

        const body = message.text?.body ?? `[${message.type ?? "mensaje"}]`;
        let conversation = await crmStore.findConversationByPhone(workspaceId, message.from);

        if (!conversation) {
          conversation = await crmStore.createConversation({
            workspaceId,
            contactName: message.from,
            contactPhone: message.from,
            stage: "new_lead",
            source: "manual",
            owner: "Sin asignar",
            intent: body,
            estimatedValue: 0,
          });
          processed.conversationsCreated += conversation ? 1 : 0;
        }

        if (conversation) {
          await crmStore.appendConversationMessage(conversation.id, {
            providerId: message.id,
            direction: "inbound",
            body,
            status: "received",
          });
          processed.messages += 1;
        }
      }
    }
  }

  return processed;
}

export async function fetchMetaLead(leadgenId: string, accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/v20.0/${leadgenId}?fields=id,created_time,ad_id,form_id,campaign_id,field_data&access_token=${accessToken}`,
  );

  if (!response.ok) {
    return { ok: false as const, payload: await response.json().catch(() => ({})) };
  }

  return { ok: true as const, payload: await response.json() };
}

export async function processMetaLeadPayload(payload: unknown, workspaceId: string, accessToken?: string) {
  const processed = {
    leads: 0,
    conversations: 0,
    fetched: 0,
  };
  const entries = Array.isArray((payload as { entry?: unknown }).entry)
    ? ((payload as { entry: unknown[] }).entry)
    : [];

  for (const entry of entries) {
    const changes = Array.isArray((entry as { changes?: unknown }).changes)
      ? ((entry as { changes: unknown[] }).changes)
      : [];

    for (const change of changes) {
      const value = (change as { value?: Record<string, unknown> }).value ?? {};
      const leadgenId = firstString(value.leadgen_id) ?? firstString(value.id);
      let leadPayload: Record<string, unknown> = value;

      if (leadgenId && accessToken) {
        const fetched = await fetchMetaLead(leadgenId, accessToken);
        if (fetched.ok) {
          leadPayload = fetched.payload as Record<string, unknown>;
          processed.fetched += 1;
        }
      }

      const fields = normalizeFieldData(leadPayload.field_data);
      const name = fields.full_name ?? fields.name ?? fields.nombre ?? "Lead Meta";
      const phone = fields.phone_number ?? fields.phone ?? fields.telefono ?? leadgenId ?? "sin-telefono";
      const email = fields.email ?? `${phone.replace(/[^\d]/g, "") || "lead"}@meta.local`;
      const intent = fields.message ?? fields.servicio ?? fields.service ?? "Lead recibido desde Meta Lead Ads";

      await crmStore.createCustomer({
        workspaceId,
        companyName: name,
        contactName: name,
        email,
        phone,
        status: "new",
        source: "Meta Lead Ads",
        owner: "Sin asignar",
      });

      const conversation = await crmStore.createConversation({
        workspaceId,
        contactName: name,
        contactPhone: phone,
        stage: "new_lead",
        source: "meta_ads",
        owner: "Sin asignar",
        intent,
        estimatedValue: 0,
      });

      processed.leads += 1;
      processed.conversations += conversation ? 1 : 0;
    }
  }

  return processed;
}

export async function processMetaCampaignResponse(payload: unknown, workspaceId: string) {
  const campaigns = Array.isArray((payload as { data?: unknown }).data)
    ? ((payload as { data: Record<string, unknown>[] }).data)
    : [];
  let synced = 0;

  for (const campaign of campaigns) {
    const insights = Array.isArray((campaign.insights as { data?: unknown })?.data)
      ? ((campaign.insights as { data: Record<string, unknown>[] }).data[0])
      : undefined;
    const spend = Number(insights?.spend ?? 0);
    const actions = Array.isArray(insights?.actions) ? (insights.actions as Record<string, unknown>[]) : [];
    const leadAction = actions.find((action) => firstString(action.action_type)?.includes("lead"));
    const leads = Number(leadAction?.value ?? 0);

    await crmStore.upsertCampaignSourceByExternalId({
      workspaceId,
      externalId: firstString(campaign.id),
      name: firstString(campaign.name) ?? "Campana Meta",
      channel: "meta_ads" as ConversationSource,
      leads,
      spend,
      conversionRate: leads > 0 ? 100 : 0,
      costPerLead: leads > 0 ? spend / leads : 0,
    });
    synced += 1;
  }

  return { campaigns: synced };
}
