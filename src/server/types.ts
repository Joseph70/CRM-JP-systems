export type LeadStatus = "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";

export type Customer = {
  id: string;
  workspaceId?: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  status: LeadStatus;
  source: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
};

export type DealStage = "prospecting" | "proposal" | "negotiation" | "won" | "lost";

export type Deal = {
  id: string;
  customerId: string;
  title: string;
  value: number;
  stage: DealStage;
  expectedCloseDate: string;
  createdAt: string;
  updatedAt: string;
};

export type ActivityType = "call" | "email" | "meeting" | "note";

export type Activity = {
  id: string;
  customerId: string;
  type: ActivityType;
  title: string;
  notes?: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
};

export type ClientWorkspace = {
  id: string;
  name: string;
  industry: string;
  owner: string;
  phone: string;
  health: number;
  responseSlaMinutes: number;
  whatsappStatus: "connected" | "pending" | "disconnected";
  metaStatus: "connected" | "pending" | "disconnected";
  createdAt: string;
  updatedAt: string;
};

export type ConversationStage =
  | "new_lead"
  | "contacted"
  | "follow_up"
  | "appointment_scheduled"
  | "won"
  | "lost";

export type ConversationSource =
  | "meta_ads"
  | "instagram_organic"
  | "facebook_organic"
  | "web_form"
  | "manual";

export type MessageDirection = "inbound" | "outbound";

export type Message = {
  id: string;
  conversationId: string;
  providerId?: string;
  direction: MessageDirection;
  body: string;
  status: "received" | "sent" | "delivered" | "read" | "failed";
  sentAt: string;
};

export type Conversation = {
  id: string;
  workspaceId: string;
  contactName: string;
  contactPhone: string;
  stage: ConversationStage;
  source: ConversationSource;
  owner: string;
  intent: string;
  internalNotes?: string;
  tags?: string[];
  estimatedValue: number;
  unreadCount: number;
  lastMessageAt: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
};

export type CampaignSource = {
  id: string;
  workspaceId: string;
  externalId?: string;
  name: string;
  channel: ConversationSource;
  leads: number;
  spend: number;
  conversionRate: number;
  costPerLead: number;
  createdAt: string;
  updatedAt: string;
};

export type AutomationRule = {
  id: string;
  workspaceId: string;
  name: string;
  trigger: string;
  action: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type IntegrationConnection = {
  id: string;
  workspaceId: string;
  provider: "whatsapp_cloud_api" | "meta_lead_ads" | "instagram_graph" | "google_calendar";
  status: "ready" | "partial" | "pending" | "error";
  capabilities: string[];
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type WebhookEvent = {
  id: string;
  provider: "whatsapp" | "meta-leads";
  payload: unknown;
  receivedAt: string;
};

export type Role = "SUPER_ADMIN" | "AGENCY_ADMIN" | "CLIENT_ADMIN" | "OPERATOR" | "VIEWER";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceMembership = {
  id: string;
  userId: string;
  workspaceId: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
};

export type AuditLog = {
  id: string;
  workspaceId?: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type WhatsAppTemplate = {
  id: string;
  workspaceId: string;
  name: string;
  language: string;
  category: string;
  body: string;
  status: "draft" | "pending_approval" | "approved" | "rejected";
  externalId?: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiError = {
  error: string;
  details?: Record<string, string>;
};
