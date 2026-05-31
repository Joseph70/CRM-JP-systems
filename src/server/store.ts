import { hashPassword } from "./auth";
import { prisma } from "./prisma";
import type {
  Activity,
  AppUser,
  AuditLog,
  AutomationRule,
  CampaignSource,
  ClientWorkspace,
  Conversation,
  Customer,
  Deal,
  DealStage,
  IntegrationConnection,
  LeadStatus,
  Role,
  WebhookEvent,
  WhatsAppTemplate,
  WorkspaceMembership,
} from "./types";

type PrismaConversation = Awaited<ReturnType<typeof prisma.conversation.findFirst>> & {
  messages?: Awaited<ReturnType<typeof prisma.message.findMany>>;
};

const roleRank: Record<Role, number> = {
  VIEWER: 1,
  OPERATOR: 2,
  CLIENT_ADMIN: 3,
  AGENCY_ADMIN: 4,
  SUPER_ADMIN: 5,
};

let seedPromise: Promise<void> | undefined;

function dateToIso(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

function requiredIso(value: Date | string): string {
  return dateToIso(value)!;
}

function toDate(value?: string): Date | undefined {
  if (!value) return undefined;
  return new Date(value);
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function customerFromDb(customer: NonNullable<Awaited<ReturnType<typeof prisma.customer.findFirst>>>): Customer {
  return {
    ...customer,
    status: customer.status as LeadStatus,
    workspaceId: customer.workspaceId ?? undefined,
    createdAt: requiredIso(customer.createdAt),
    updatedAt: requiredIso(customer.updatedAt),
  };
}

function dealFromDb(deal: NonNullable<Awaited<ReturnType<typeof prisma.deal.findFirst>>>): Deal {
  return {
    ...deal,
    stage: deal.stage as DealStage,
    expectedCloseDate: requiredIso(deal.expectedCloseDate),
    createdAt: requiredIso(deal.createdAt),
    updatedAt: requiredIso(deal.updatedAt),
  };
}

function activityFromDb(activity: NonNullable<Awaited<ReturnType<typeof prisma.activity.findFirst>>>): Activity {
  return {
    ...activity,
    type: activity.type as Activity["type"],
    notes: activity.notes ?? undefined,
    dueDate: dateToIso(activity.dueDate),
    completedAt: dateToIso(activity.completedAt),
    createdAt: requiredIso(activity.createdAt),
  };
}

function workspaceFromDb(
  workspace: NonNullable<Awaited<ReturnType<typeof prisma.clientWorkspace.findFirst>>>,
): ClientWorkspace {
  return {
    ...workspace,
    whatsappStatus: workspace.whatsappStatus as ClientWorkspace["whatsappStatus"],
    metaStatus: workspace.metaStatus as ClientWorkspace["metaStatus"],
    createdAt: requiredIso(workspace.createdAt),
    updatedAt: requiredIso(workspace.updatedAt),
  };
}

function conversationFromDb(conversation: NonNullable<PrismaConversation>): Conversation {
  return {
    ...conversation,
    stage: conversation.stage as Conversation["stage"],
    source: conversation.source as Conversation["source"],
    internalNotes: conversation.internalNotes ?? "",
    tags: parseJson<string[]>(conversation.tags, []),
    lastMessageAt: requiredIso(conversation.lastMessageAt),
    messages: (conversation.messages ?? []).map((message) => ({
      id: message.id,
      conversationId: message.conversationId,
      providerId: message.providerId ?? undefined,
      direction: message.direction as Conversation["messages"][number]["direction"],
      body: message.body,
      status: message.status as Conversation["messages"][number]["status"],
      sentAt: requiredIso(message.sentAt),
    })),
    createdAt: requiredIso(conversation.createdAt),
    updatedAt: requiredIso(conversation.updatedAt),
  };
}

function campaignFromDb(
  source: NonNullable<Awaited<ReturnType<typeof prisma.campaignSource.findFirst>>>,
): CampaignSource {
  return {
    ...source,
    channel: source.channel as CampaignSource["channel"],
    externalId: source.externalId ?? undefined,
    createdAt: requiredIso(source.createdAt),
    updatedAt: requiredIso(source.updatedAt),
  };
}

function automationFromDb(rule: NonNullable<Awaited<ReturnType<typeof prisma.automationRule.findFirst>>>): AutomationRule {
  return {
    ...rule,
    createdAt: requiredIso(rule.createdAt),
    updatedAt: requiredIso(rule.updatedAt),
  };
}

function integrationFromDb(
  connection: NonNullable<Awaited<ReturnType<typeof prisma.integrationConnection.findFirst>>>,
): IntegrationConnection {
  return {
    ...connection,
    provider: connection.provider as IntegrationConnection["provider"],
    status: connection.status as IntegrationConnection["status"],
    capabilities: parseJson<string[]>(connection.capabilities, []),
    lastSyncAt: dateToIso(connection.lastSyncAt),
    createdAt: requiredIso(connection.createdAt),
    updatedAt: requiredIso(connection.updatedAt),
  };
}

function userFromDb(user: NonNullable<Awaited<ReturnType<typeof prisma.user.findFirst>>>): AppUser {
  return {
    ...user,
    createdAt: requiredIso(user.createdAt),
    updatedAt: requiredIso(user.updatedAt),
  };
}

function membershipFromDb(
  membership: NonNullable<Awaited<ReturnType<typeof prisma.workspaceMembership.findFirst>>>,
): WorkspaceMembership {
  return {
    ...membership,
    role: membership.role as Role,
    createdAt: requiredIso(membership.createdAt),
    updatedAt: requiredIso(membership.updatedAt),
  };
}

function auditFromDb(log: NonNullable<Awaited<ReturnType<typeof prisma.auditLog.findFirst>>>): AuditLog {
  return {
    id: log.id,
    workspaceId: log.workspaceId ?? undefined,
    actorUserId: log.actorUserId ?? undefined,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId ?? undefined,
    metadata: parseJson<Record<string, unknown>>(log.metadata, {}),
    createdAt: requiredIso(log.createdAt),
  };
}

function templateFromDb(
  template: NonNullable<Awaited<ReturnType<typeof prisma.whatsAppTemplate.findFirst>>>,
): WhatsAppTemplate {
  return {
    ...template,
    status: template.status as WhatsAppTemplate["status"],
    externalId: template.externalId ?? undefined,
    createdAt: requiredIso(template.createdAt),
    updatedAt: requiredIso(template.updatedAt),
  };
}

function webhookFromDb(event: NonNullable<Awaited<ReturnType<typeof prisma.webhookEvent.findFirst>>>): WebhookEvent {
  return {
    id: event.id,
    provider: event.provider as WebhookEvent["provider"],
    payload: parseJson<unknown>(event.payload, {}),
    receivedAt: requiredIso(event.receivedAt),
  };
}

async function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = seedDatabase();
  }

  await seedPromise;
}

async function seedDatabase() {
  const existingWorkspaces = await prisma.clientWorkspace.count();

  if (existingWorkspaces > 0) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.clientWorkspace.createMany({
      data: [
        {
          id: "ws_terra",
          name: "Terra Dental Studio",
          industry: "Clinica dental",
          owner: "JP Sistems",
          phone: "+593 99 884 2210",
          health: 92,
          responseSlaMinutes: 5,
          whatsappStatus: "connected",
          metaStatus: "connected",
        },
        {
          id: "ws_nova",
          name: "Nova Fit Center",
          industry: "Gimnasio premium",
          owner: "JP Sistems",
          phone: "+593 98 117 4402",
          health: 78,
          responseSlaMinutes: 8,
          whatsappStatus: "pending",
          metaStatus: "pending",
        },
      ],
    });

    await tx.user.createMany({
      data: [
        {
          id: "user_admin",
          name: "JP Admin",
          email: "admin@jpsistems.local",
          passwordHash: await hashPassword("admin"),
        },
        {
          id: "user_operator",
          name: "Operador Comercial",
          email: "operador@jpsistems.local",
          passwordHash: await hashPassword("operador"),
        },
      ],
    });

    await tx.workspaceMembership.createMany({
      data: [
        { id: "member_admin_terra", userId: "user_admin", workspaceId: "ws_terra", role: "SUPER_ADMIN" },
        { id: "member_operator_terra", userId: "user_operator", workspaceId: "ws_terra", role: "OPERATOR" },
      ],
    });

    await tx.customer.createMany({
      data: [
        {
          id: "cust_jp_001",
          workspaceId: "ws_terra",
          companyName: "Comercial Andina",
          contactName: "Maria Torres",
          email: "maria@comercialandina.com",
          phone: "+593 99 123 4567",
          status: "qualified",
          source: "Referido",
          owner: "JP Sistems",
        },
        {
          id: "cust_jp_002",
          workspaceId: "ws_terra",
          companyName: "Ferreteria Norte",
          contactName: "Carlos Mena",
          email: "carlos@ferreterianorte.com",
          phone: "+593 98 987 6543",
          status: "contacted",
          source: "Facebook",
          owner: "JP Sistems",
        },
      ],
    });

    await tx.deal.create({
      data: {
        id: "deal_jp_001",
        customerId: "cust_jp_001",
        title: "Implementacion CRM base",
        value: 1800,
        stage: "proposal",
        expectedCloseDate: new Date("2026-06-15T00:00:00.000Z"),
      },
    });

    await tx.activity.create({
      data: {
        id: "act_jp_001",
        customerId: "cust_jp_001",
        type: "call",
        title: "Llamada de seguimiento",
        notes: "Validar necesidades de reportes y usuarios.",
        dueDate: new Date("2026-05-30T00:00:00.000Z"),
      },
    });

    await tx.conversation.create({
      data: {
        id: "conv_terra_001",
        workspaceId: "ws_terra",
        contactName: "Camila Paredes",
        contactPhone: "+593 99 441 8821",
        stage: "new_lead",
        source: "meta_ads",
        owner: "Daniela",
        intent: "Quiere agendar valoracion",
        internalNotes: "Lead caliente: pregunto por disponibilidad esta semana.",
        tags: JSON.stringify(["Caliente", "Cita"]),
        estimatedValue: 320,
        unreadCount: 3,
        messages: {
          create: [
            {
              id: "msg_001",
              direction: "inbound",
              body: "Hola, vi el anuncio de diseno de sonrisa.",
              status: "received",
            },
            {
              id: "msg_002",
              direction: "outbound",
              body: "Si, tenemos valoracion esta semana. Te paso horarios.",
              status: "delivered",
            },
          ],
        },
      },
    });

    await tx.conversation.create({
      data: {
        id: "conv_terra_002",
        workspaceId: "ws_terra",
        contactName: "Andres Molina",
        contactPhone: "+593 98 117 5402",
        stage: "follow_up",
        source: "instagram_organic",
        owner: "Marco",
        intent: "Pidio precio y financiamiento",
        internalNotes: "Enviar opciones de pago antes de cerrar la cita.",
        tags: JSON.stringify(["Cotizando"]),
        estimatedValue: 180,
        unreadCount: 1,
        messages: {
          create: [
            {
              id: "msg_003",
              direction: "inbound",
              body: "Me pasaron a WhatsApp desde Instagram.",
              status: "received",
            },
          ],
        },
      },
    });

    await tx.campaignSource.createMany({
      data: [
        {
          id: "src_terra_meta",
          workspaceId: "ws_terra",
          name: "Meta campanas",
          channel: "meta_ads",
          leads: 64,
          spend: 154,
          conversionRate: 18,
          costPerLead: 2.4,
        },
        {
          id: "src_terra_ig",
          workspaceId: "ws_terra",
          name: "Instagram organico",
          channel: "instagram_organic",
          leads: 38,
          spend: 0,
          conversionRate: 21,
          costPerLead: 0,
        },
      ],
    });

    await tx.automationRule.createMany({
      data: [
        {
          id: "auto_terra_first_touch",
          workspaceId: "ws_terra",
          name: "Primer contacto Meta",
          trigger: "Nuevo lead de formulario",
          action: "Asignar operador y enviar plantilla",
          active: true,
        },
        {
          id: "auto_terra_followup",
          workspaceId: "ws_terra",
          name: "Seguimiento 24h",
          trigger: "Sin respuesta del prospecto",
          action: "Crear tarea y reactivar WhatsApp",
          active: true,
        },
      ],
    });

    await tx.integrationConnection.createMany({
      data: [
        {
          id: "int_terra_whatsapp",
          workspaceId: "ws_terra",
          provider: "whatsapp_cloud_api",
          status: "ready",
          capabilities: JSON.stringify(["messages", "templates", "webhooks", "delivery_status"]),
        },
        {
          id: "int_terra_meta",
          workspaceId: "ws_terra",
          provider: "meta_lead_ads",
          status: "ready",
          capabilities: JSON.stringify(["lead_forms", "campaigns", "ads", "costs"]),
        },
      ],
    });

    await tx.whatsAppTemplate.createMany({
      data: [
        {
          id: "tpl_terra_welcome",
          workspaceId: "ws_terra",
          name: "bienvenida_lead",
          language: "es",
          category: "MARKETING",
          body: "Hola {{1}}, gracias por escribirnos. Soy {{2}} y te ayudo a separar tu cita.",
          status: "approved",
          externalId: "demo_template_001",
        },
        {
          id: "tpl_terra_reminder",
          workspaceId: "ws_terra",
          name: "recordatorio_cita",
          language: "es",
          category: "UTILITY",
          body: "Hola {{1}}, te recordamos tu cita para {{2}}. Responde CONFIRMO para mantenerla.",
          status: "pending_approval",
        },
      ],
    });
  });
}

export const crmStore = {
  async findUserByEmail(email: string): Promise<AppUser | undefined> {
    await ensureSeeded();
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    return user ? userFromDb(user) : undefined;
  },

  async getUserMemberships(userId: string): Promise<WorkspaceMembership[]> {
    await ensureSeeded();
    const rows = await prisma.workspaceMembership.findMany({ where: { userId } });
    return rows.map(membershipFromDb);
  },

  async getUserPrimaryRole(userId: string): Promise<Role> {
    const memberships = await this.getUserMemberships(userId);
    return memberships.sort((a, b) => roleRank[b.role] - roleRank[a.role])[0]?.role ?? "VIEWER";
  },

  async recordAuditLog(input: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog> {
    await ensureSeeded();
    const log = await prisma.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
      },
    });
    return auditFromDb(log);
  },

  async listAuditLogs(workspaceId?: string): Promise<AuditLog[]> {
    await ensureSeeded();
    const logs = await prisma.auditLog.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return logs.map(auditFromDb);
  },

  async listWorkspaces(): Promise<ClientWorkspace[]> {
    await ensureSeeded();
    const rows = await prisma.clientWorkspace.findMany({ orderBy: { name: "asc" } });
    return rows.map(workspaceFromDb);
  },

  async getWorkspace(id: string): Promise<ClientWorkspace | undefined> {
    await ensureSeeded();
    const row = await prisma.clientWorkspace.findUnique({ where: { id } });
    return row ? workspaceFromDb(row) : undefined;
  },

  async createWorkspace(input: Omit<ClientWorkspace, "id" | "createdAt" | "updatedAt">): Promise<ClientWorkspace> {
    await ensureSeeded();
    const row = await prisma.clientWorkspace.create({ data: input });
    return workspaceFromDb(row);
  },

  async updateWorkspace(
    id: string,
    input: Partial<Omit<ClientWorkspace, "id" | "createdAt" | "updatedAt">>,
  ): Promise<ClientWorkspace | undefined> {
    await ensureSeeded();
    try {
      const row = await prisma.clientWorkspace.update({ where: { id }, data: input });
      return workspaceFromDb(row);
    } catch {
      return undefined;
    }
  },

  async deleteWorkspace(id: string): Promise<boolean> {
    await ensureSeeded();
    try {
      await prisma.clientWorkspace.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },

  async listCustomers(search?: string, workspaceId?: string): Promise<Customer[]> {
    await ensureSeeded();
    const normalizedSearch = search?.trim();
    const rows = await prisma.customer.findMany({
      where: {
        ...(workspaceId ? { workspaceId } : {}),
        ...(normalizedSearch
          ? {
              OR: [
                { companyName: { contains: normalizedSearch } },
                { contactName: { contains: normalizedSearch } },
                { email: { contains: normalizedSearch } },
                { phone: { contains: normalizedSearch } },
                { status: { contains: normalizedSearch } },
                { source: { contains: normalizedSearch } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(customerFromDb);
  },

  async getCustomer(id: string): Promise<Customer | undefined> {
    await ensureSeeded();
    const row = await prisma.customer.findUnique({ where: { id } });
    return row ? customerFromDb(row) : undefined;
  },

  async createCustomer(input: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer> {
    await ensureSeeded();
    const row = await prisma.customer.create({ data: input });
    return customerFromDb(row);
  },

  async updateCustomer(
    id: string,
    input: Partial<Omit<Customer, "id" | "createdAt" | "updatedAt">>,
  ): Promise<Customer | undefined> {
    await ensureSeeded();
    try {
      const row = await prisma.customer.update({ where: { id }, data: input });
      return customerFromDb(row);
    } catch {
      return undefined;
    }
  },

  async deleteCustomer(id: string): Promise<boolean> {
    await ensureSeeded();
    try {
      await prisma.customer.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },

  async listDeals(customerId?: string, workspaceIds?: string[]): Promise<Deal[]> {
    await ensureSeeded();
    const rows = await prisma.deal.findMany({
      where: {
        ...(customerId ? { customerId } : {}),
        ...(workspaceIds ? { customer: { workspaceId: { in: workspaceIds } } } : {}),
      },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(dealFromDb);
  },

  async getDeal(id: string): Promise<Deal | undefined> {
    await ensureSeeded();
    const row = await prisma.deal.findUnique({ where: { id } });
    return row ? dealFromDb(row) : undefined;
  },

  async createDeal(input: Omit<Deal, "id" | "createdAt" | "updatedAt">): Promise<Deal | undefined> {
    await ensureSeeded();
    const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) return undefined;
    const row = await prisma.deal.create({
      data: {
        ...input,
        expectedCloseDate: new Date(input.expectedCloseDate),
      },
    });
    return dealFromDb(row);
  },

  async updateDeal(
    id: string,
    input: Partial<Omit<Deal, "id" | "createdAt" | "updatedAt">>,
  ): Promise<Deal | undefined> {
    await ensureSeeded();
    try {
      if (input.customerId && !(await prisma.customer.findUnique({ where: { id: input.customerId } }))) {
        return undefined;
      }
      const row = await prisma.deal.update({
        where: { id },
        data: {
          ...input,
          expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : undefined,
        },
      });
      return dealFromDb(row);
    } catch {
      return undefined;
    }
  },

  async deleteDeal(id: string): Promise<boolean> {
    await ensureSeeded();
    try {
      await prisma.deal.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },

  async listActivities(customerId?: string, workspaceIds?: string[]): Promise<Activity[]> {
    await ensureSeeded();
    const rows = await prisma.activity.findMany({
      where: {
        ...(customerId ? { customerId } : {}),
        ...(workspaceIds ? { customer: { workspaceId: { in: workspaceIds } } } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(activityFromDb);
  },

  async getActivity(id: string): Promise<Activity | undefined> {
    await ensureSeeded();
    const row = await prisma.activity.findUnique({ where: { id } });
    return row ? activityFromDb(row) : undefined;
  },

  async createActivity(input: Omit<Activity, "id" | "createdAt">): Promise<Activity | undefined> {
    await ensureSeeded();
    const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) return undefined;
    const row = await prisma.activity.create({
      data: {
        ...input,
        dueDate: toDate(input.dueDate),
        completedAt: toDate(input.completedAt),
      },
    });
    return activityFromDb(row);
  },

  async updateActivity(
    id: string,
    input: Partial<Omit<Activity, "id" | "createdAt">>,
  ): Promise<Activity | undefined> {
    await ensureSeeded();
    try {
      if (input.customerId && !(await prisma.customer.findUnique({ where: { id: input.customerId } }))) {
        return undefined;
      }
      const row = await prisma.activity.update({
        where: { id },
        data: {
          ...input,
          dueDate: toDate(input.dueDate),
          completedAt: toDate(input.completedAt),
        },
      });
      return activityFromDb(row);
    } catch {
      return undefined;
    }
  },

  async deleteActivity(id: string): Promise<boolean> {
    await ensureSeeded();
    try {
      await prisma.activity.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },

  async listConversations(workspaceId?: string): Promise<Conversation[]> {
    await ensureSeeded();
    const rows = await prisma.conversation.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      include: { messages: { orderBy: { sentAt: "asc" } } },
      orderBy: { lastMessageAt: "desc" },
    });
    return rows.map(conversationFromDb);
  },

  async getConversation(id: string): Promise<Conversation | undefined> {
    await ensureSeeded();
    const row = await prisma.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { sentAt: "asc" } } },
    });
    return row ? conversationFromDb(row) : undefined;
  },

  async updateConversation(
    id: string,
    input: Partial<Omit<Conversation, "id" | "messages" | "unreadCount" | "lastMessageAt" | "createdAt" | "updatedAt">>,
  ): Promise<Conversation | undefined> {
    await ensureSeeded();
    try {
      const row = await prisma.conversation.update({
        where: { id },
        data: {
          ...input,
          tags: input.tags ? JSON.stringify(input.tags) : undefined,
        },
        include: { messages: { orderBy: { sentAt: "asc" } } },
      });
      return conversationFromDb(row);
    } catch {
      return undefined;
    }
  },

  async createConversation(
    input: Omit<Conversation, "id" | "messages" | "unreadCount" | "lastMessageAt" | "createdAt" | "updatedAt">,
  ): Promise<Conversation | undefined> {
    await ensureSeeded();
    const workspace = await prisma.clientWorkspace.findUnique({ where: { id: input.workspaceId } });
    if (!workspace) return undefined;
    const row = await prisma.conversation.create({
      data: {
        ...input,
        internalNotes: input.internalNotes,
        tags: input.tags ? JSON.stringify(input.tags) : undefined,
        unreadCount: 1,
        messages: {
          create: {
            direction: "inbound",
            body: input.intent,
            status: "received",
          },
        },
      },
      include: { messages: { orderBy: { sentAt: "asc" } } },
    });
    return conversationFromDb(row);
  },

  async appendConversationMessage(
    conversationId: string,
    input: Omit<Conversation["messages"][number], "id" | "conversationId" | "sentAt">,
  ): Promise<Conversation | undefined> {
    await ensureSeeded();
    try {
      const row = await prisma.$transaction(async (tx) => {
        await tx.message.create({
          data: {
            conversationId,
            direction: input.direction,
            body: input.body,
            status: input.status,
            providerId: input.providerId,
          },
        });
        return tx.conversation.update({
          where: { id: conversationId },
          data: {
            unreadCount: input.direction === "inbound" ? { increment: 1 } : undefined,
            lastMessageAt: new Date(),
          },
          include: { messages: { orderBy: { sentAt: "asc" } } },
        });
      });
      return conversationFromDb(row);
    } catch {
      return undefined;
    }
  },

  async markConversationRead(conversationId: string): Promise<Conversation | undefined> {
    await ensureSeeded();
    try {
      const row = await prisma.conversation.update({
        where: { id: conversationId },
        data: { unreadCount: 0 },
        include: { messages: { orderBy: { sentAt: "asc" } } },
      });
      return conversationFromDb(row);
    } catch {
      return undefined;
    }
  },

  async deleteConversation(id: string): Promise<boolean> {
    await ensureSeeded();
    try {
      await prisma.conversation.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },

  async createActivityForConversation(
    conversationId: string,
    input: Omit<Activity, "id" | "createdAt" | "customerId">,
  ): Promise<Activity | undefined> {
    await ensureSeeded();
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) return undefined;

    const customer = await prisma.customer.upsert({
      where: { id: `customer_${conversation.id}` },
      update: {
        contactName: conversation.contactName,
        phone: conversation.contactPhone,
        status: conversation.stage === "won" ? "won" : conversation.stage === "lost" ? "lost" : "contacted",
        source: conversation.source,
        owner: conversation.owner,
      },
      create: {
        id: `customer_${conversation.id}`,
        workspaceId: conversation.workspaceId,
        companyName: conversation.contactName,
        contactName: conversation.contactName,
        email: `${conversation.id}@lead.local`,
        phone: conversation.contactPhone,
        status: conversation.stage === "won" ? "won" : conversation.stage === "lost" ? "lost" : "contacted",
        source: conversation.source,
        owner: conversation.owner,
      },
    });

    const row = await prisma.activity.create({
      data: {
        customerId: customer.id,
        type: input.type,
        title: input.title,
        notes: input.notes,
        dueDate: toDate(input.dueDate),
        completedAt: toDate(input.completedAt),
      },
    });

    return activityFromDb(row);
  },

  async findConversationByPhone(workspaceId: string, contactPhone: string): Promise<Conversation | undefined> {
    await ensureSeeded();
    const digits = contactPhone.replace(/[^\d]/g, "");
    const row = await prisma.conversation.findFirst({
      where: {
        workspaceId,
        OR: [{ contactPhone }, { contactPhone: `+${digits}` }, { contactPhone: digits }],
      },
      include: { messages: { orderBy: { sentAt: "asc" } } },
    });
    return row ? conversationFromDb(row) : undefined;
  },

  async updateMessageStatusByProviderId(
    providerId: string,
    status: Conversation["messages"][number]["status"],
  ): Promise<Conversation["messages"][number] | undefined> {
    await ensureSeeded();
    const current = await prisma.message.findFirst({ where: { providerId } });
    if (!current) return undefined;
    const row = await prisma.message.update({ where: { id: current.id }, data: { status } });
    return {
      id: row.id,
      conversationId: row.conversationId,
      providerId: row.providerId ?? undefined,
      direction: row.direction as Conversation["messages"][number]["direction"],
      body: row.body,
      status: row.status as Conversation["messages"][number]["status"],
      sentAt: requiredIso(row.sentAt),
    };
  },

  async listCampaignSources(workspaceId?: string): Promise<CampaignSource[]> {
    await ensureSeeded();
    const rows = await prisma.campaignSource.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      orderBy: { leads: "desc" },
    });
    return rows.map(campaignFromDb);
  },

  async upsertCampaignSourceByExternalId(
    input: Omit<CampaignSource, "id" | "createdAt" | "updatedAt">,
  ): Promise<CampaignSource | undefined> {
    await ensureSeeded();
    const workspace = await prisma.clientWorkspace.findUnique({ where: { id: input.workspaceId } });
    if (!workspace) return undefined;

    const current = input.externalId
      ? await prisma.campaignSource.findFirst({
          where: { workspaceId: input.workspaceId, externalId: input.externalId },
        })
      : undefined;
    const data = {
      workspaceId: input.workspaceId,
      externalId: input.externalId,
      name: input.name,
      channel: input.channel,
      leads: input.leads,
      spend: input.spend,
      conversionRate: input.conversionRate,
      costPerLead: input.costPerLead,
    };
    const row = current
      ? await prisma.campaignSource.update({ where: { id: current.id }, data })
      : await prisma.campaignSource.create({ data });
    return campaignFromDb(row);
  },

  async listAutomationRules(workspaceId?: string): Promise<AutomationRule[]> {
    await ensureSeeded();
    const rows = await prisma.automationRule.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      orderBy: { createdAt: "asc" },
    });
    return rows.map(automationFromDb);
  },

  async getAutomationRule(id: string): Promise<AutomationRule | undefined> {
    await ensureSeeded();
    const row = await prisma.automationRule.findUnique({ where: { id } });
    return row ? automationFromDb(row) : undefined;
  },

  async updateAutomationRule(id: string, input: Partial<Pick<AutomationRule, "active" | "name" | "trigger" | "action">>): Promise<AutomationRule | undefined> {
    await ensureSeeded();
    try {
      const row = await prisma.automationRule.update({ where: { id }, data: input });
      return automationFromDb(row);
    } catch {
      return undefined;
    }
  },

  async listIntegrationConnections(workspaceId?: string): Promise<IntegrationConnection[]> {
    await ensureSeeded();
    const rows = await prisma.integrationConnection.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      orderBy: { provider: "asc" },
    });
    return rows.map(integrationFromDb);
  },

  async listWhatsAppTemplates(workspaceId?: string): Promise<WhatsAppTemplate[]> {
    await ensureSeeded();
    const rows = await prisma.whatsAppTemplate.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(templateFromDb);
  },

  async createWhatsAppTemplate(
    input: Omit<WhatsAppTemplate, "id" | "createdAt" | "updatedAt">,
  ): Promise<WhatsAppTemplate | undefined> {
    await ensureSeeded();
    const workspace = await prisma.clientWorkspace.findUnique({ where: { id: input.workspaceId } });
    if (!workspace) return undefined;
    const row = await prisma.whatsAppTemplate.create({ data: input });
    return templateFromDb(row);
  },

  async recordWebhookEvent(provider: WebhookEvent["provider"], payload: unknown): Promise<WebhookEvent> {
    await ensureSeeded();
    const row = await prisma.webhookEvent.create({
      data: {
        provider,
        payload: JSON.stringify(payload),
      },
    });
    return webhookFromDb(row);
  },

  async listWebhookEvents(provider?: WebhookEvent["provider"]): Promise<WebhookEvent[]> {
    await ensureSeeded();
    const rows = await prisma.webhookEvent.findMany({
      where: provider ? { provider } : undefined,
      orderBy: { receivedAt: "desc" },
    });
    return rows.map(webhookFromDb);
  },

  async getSummary(workspaceIds?: string[]) {
    await ensureSeeded();
    const customerWhere = workspaceIds ? { workspaceId: { in: workspaceIds } } : undefined;
    const customerRelationWhere = workspaceIds ? { customer: { workspaceId: { in: workspaceIds } } } : undefined;
    const workspaceWhere = workspaceIds ? { id: { in: workspaceIds } } : undefined;
    const conversationWhere = workspaceIds ? { workspaceId: { in: workspaceIds } } : undefined;
    const [customerList, dealList, activityList, workspaceCount, conversationCount] = await Promise.all([
      prisma.customer.findMany({ where: customerWhere }),
      prisma.deal.findMany({ where: customerRelationWhere }),
      prisma.activity.findMany({ where: customerRelationWhere }),
      prisma.clientWorkspace.count({ where: workspaceWhere }),
      prisma.conversation.count({ where: conversationWhere }),
    ]);
    const openStages: DealStage[] = ["prospecting", "proposal", "negotiation"];
    const activeStatuses: LeadStatus[] = ["new", "contacted", "qualified", "proposal"];

    return {
      totalCustomers: customerList.length,
      totalWorkspaces: workspaceCount,
      totalConversations: conversationCount,
      activeLeads: customerList.filter((customer) => activeStatuses.includes(customer.status as LeadStatus)).length,
      openDeals: dealList.filter((deal) => openStages.includes(deal.stage as DealStage)).length,
      pipelineValue: dealList
        .filter((deal) => openStages.includes(deal.stage as DealStage))
        .reduce((total, deal) => total + deal.value, 0),
      pendingActivities: activityList.filter((activity) => !activity.completedAt).length,
    };
  },
};
