export function normalizeTerm(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function filterConversations(conversations, filters, labelers) {
  const term = normalizeTerm(filters.searchTerm);

  return conversations.filter((conversation) => {
    const sourceLabel = labelers.sourceLabel(conversation.source);
    const stageLabel = labelers.stageLabel(conversation.stage);
    const tags = Array.isArray(conversation.tags) ? conversation.tags.join(" ") : "";
    const matchesTerm =
      !term ||
      normalizeTerm(conversation.contactName).includes(term) ||
      normalizeTerm(conversation.contactPhone).includes(term) ||
      normalizeTerm(conversation.intent).includes(term) ||
      normalizeTerm(sourceLabel).includes(term) ||
      normalizeTerm(stageLabel).includes(term) ||
      normalizeTerm(tags).includes(term);
    const matchesStage = filters.stageFilter === "all" || conversation.stage === filters.stageFilter;
    const matchesSource = filters.sourceFilter === "all" || conversation.source === filters.sourceFilter;
    const matchesOwner = filters.ownerFilter === "all" || conversation.owner === filters.ownerFilter;

    return matchesTerm && matchesStage && matchesSource && matchesOwner;
  });
}

export function getResponseAverage(workspace) {
  if (!workspace) return "0m";
  return `${Math.max(2, workspace.responseSlaMinutes - 2)}m 18s`;
}

export function getPipelineValue(conversations) {
  return conversations.reduce((total, conversation) => total + Number(conversation.estimatedValue || 0), 0);
}

export function buildOutboundMessage(body) {
  return {
    id: `msg_${Date.now()}`,
    direction: "outbound",
    body,
    status: "sent",
    sentAt: new Date().toISOString(),
  };
}

export function mergeConversationMessage(conversation, message) {
  return {
    ...conversation,
    messages: [...conversation.messages, message],
    unreadCount: message.direction === "inbound" ? conversation.unreadCount + 1 : 0,
    lastMessageAt: message.sentAt,
  };
}

export function buildConversationPayload({ form, workspaceId, owner = "Sin asignar" }) {
  return {
    workspaceId,
    contactName: form.name.trim(),
    contactPhone: form.phone.trim(),
    stage: "new_lead",
    source: form.source,
    owner,
    intent: form.intent.trim(),
    internalNotes: "",
    tags: ["Nuevo"],
    estimatedValue: Number(form.value || 0),
  };
}

export function buildFallbackConversation(payload) {
  const id = `conv_${Date.now()}`;
  const sentAt = new Date().toISOString();

  return {
    ...payload,
    id,
    unreadCount: 1,
    lastMessageAt: sentAt,
    messages: [
      {
        id: `msg_${Date.now()}`,
        direction: "inbound",
        body: payload.intent,
        status: "received",
        sentAt,
      },
    ],
  };
}

export function applyLeadFormToConversation(conversation, form) {
  return {
    ...conversation,
    contactName: form.name.trim(),
    contactPhone: form.phone.trim(),
    source: form.source,
    intent: form.intent.trim(),
    estimatedValue: Number(form.value || 0),
    lastMessageAt: new Date().toISOString(),
  };
}

export function buildWorkspacePayload(form) {
  return {
    name: form.name.trim(),
    industry: form.industry.trim(),
    owner: form.owner.trim(),
    phone: form.phone.trim(),
    responseSlaMinutes: Number(form.responseSlaMinutes || 8),
    health: 72,
    whatsappStatus: "pending",
    metaStatus: "pending",
  };
}

export function buildFallbackWorkspace(payload) {
  return { id: `ws_${Date.now()}`, ...payload };
}

export function resolveNextConversationId(conversations, removedId) {
  return conversations.find((conversation) => conversation.id !== removedId)?.id ?? "";
}

export function buildTaskPayload(form) {
  return {
    type: "note",
    title: form.title.trim(),
    notes: form.notes.trim() || "Seguimiento creado desde el CRM.",
    dueDate: form.dueDate || undefined,
  };
}

export function buildFallbackActivity(payload, customerId = "mock_customer") {
  return {
    id: `task_${Date.now()}`,
    customerId,
    type: payload.type,
    title: payload.title,
    notes: payload.notes,
    dueDate: payload.dueDate,
    createdAt: new Date().toISOString(),
  };
}

export function completeActivity(activity) {
  return { ...activity, completedAt: new Date().toISOString() };
}

export function toggleAutomationState(automation) {
  return { ...automation, active: !automation.active };
}

export function getDashboardStats({ conversations, activities }) {
  const unread = conversations.reduce((total, conversation) => total + Number(conversation.unreadCount || 0), 0);
  const won = conversations.filter((conversation) => conversation.stage === "won").length;
  const conversion = conversations.length ? Math.round((won / conversations.length) * 100) : 0;
  const pendingTasks = activities.filter((activity) => !activity.completedAt).length;
  const newLeads = conversations.filter((conversation) => conversation.stage === "new_lead").length;

  return { unread, won, conversion, pendingTasks, newLeads };
}

export function readSavedTheme(storage) {
  const savedTheme = storage.getItem("jp-crm-theme");
  return savedTheme === "light" || savedTheme === "dark" ? savedTheme : "light";
}

export function persistTheme({ documentElement, storage, mode }) {
  documentElement.dataset.theme = mode;
  storage.setItem("jp-crm-theme", mode);
}
