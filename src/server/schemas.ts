import type { Activity, ClientWorkspace, Conversation, Customer, Deal } from "./types";
import { asObject, readEnum, readNumber, readString, type ValidationResult } from "./validation";

const leadStatuses = ["new", "contacted", "qualified", "proposal", "won", "lost"] as const;
const dealStages = ["prospecting", "proposal", "negotiation", "won", "lost"] as const;
const activityTypes = ["call", "email", "meeting", "note"] as const;
const conversationStages = ["new_lead", "contacted", "follow_up", "appointment_scheduled", "won", "lost"] as const;
const conversationSources = ["meta_ads", "instagram_organic", "facebook_organic", "web_form", "manual"] as const;

export function validateCustomerCreate(body: unknown): ValidationResult<Omit<Customer, "id" | "createdAt" | "updatedAt">> {
  const source = asObject(body);
  const errors: Record<string, string> = {};

  const companyName = readString(source, "companyName", errors, { required: true, maxLength: 120 });
  const contactName = readString(source, "contactName", errors, { required: true, maxLength: 120 });
  const email = readString(source, "email", errors, { required: true, maxLength: 160 });
  const phone = readString(source, "phone", errors, { required: true, maxLength: 40 });
  const status = readEnum(source, "status", leadStatuses, errors, { required: true });
  const owner = readString(source, "owner", errors, { required: true, maxLength: 80 });
  const crmSource = readString(source, "source", errors, { required: true, maxLength: 80 });
  const workspaceId = readString(source, "workspaceId", errors, { maxLength: 80 });

  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = "Debe ser un correo valido.";
  }

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      companyName: companyName!,
      contactName: contactName!,
      email: email!,
      phone: phone!,
      status: status!,
      source: crmSource!,
      owner: owner!,
      workspaceId,
    },
  };
}

export function validateCustomerUpdate(body: unknown): ValidationResult<Partial<Omit<Customer, "id" | "createdAt" | "updatedAt">>> {
  const source = asObject(body);
  const errors: Record<string, string> = {};

  const data: Partial<Omit<Customer, "id" | "createdAt" | "updatedAt">> = {};
  const companyName = readString(source, "companyName", errors, { maxLength: 120 });
  const contactName = readString(source, "contactName", errors, { maxLength: 120 });
  const email = readString(source, "email", errors, { maxLength: 160 });
  const phone = readString(source, "phone", errors, { maxLength: 40 });
  const status = readEnum(source, "status", leadStatuses, errors);
  const owner = readString(source, "owner", errors, { maxLength: 80 });
  const crmSource = readString(source, "source", errors, { maxLength: 80 });
  const workspaceId = readString(source, "workspaceId", errors, { maxLength: 80 });

  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = "Debe ser un correo valido.";
  }

  if (companyName) data.companyName = companyName;
  if (contactName) data.contactName = contactName;
  if (email) data.email = email;
  if (phone) data.phone = phone;
  if (status) data.status = status;
  if (owner) data.owner = owner;
  if (crmSource) data.source = crmSource;
  if (workspaceId) data.workspaceId = workspaceId;

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  return { ok: true, data };
}

export function validateWorkspaceCreate(
  body: unknown,
): ValidationResult<Omit<ClientWorkspace, "id" | "createdAt" | "updatedAt">> {
  const source = asObject(body);
  const errors: Record<string, string> = {};

  const name = readString(source, "name", errors, { required: true, maxLength: 120 });
  const industry = readString(source, "industry", errors, { required: true, maxLength: 120 });
  const owner = readString(source, "owner", errors, { required: true, maxLength: 80 });
  const phone = readString(source, "phone", errors, { required: true, maxLength: 40 });
  const health = readNumber(source, "health", errors, { min: 0 });
  const responseSlaMinutes = readNumber(source, "responseSlaMinutes", errors, { min: 1 });

  if (health !== undefined && health > 100) {
    errors.health = "Debe ser menor o igual a 100.";
  }

  if (responseSlaMinutes !== undefined && responseSlaMinutes > 240) {
    errors.responseSlaMinutes = "Debe ser menor o igual a 240.";
  }

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      name: name!,
      industry: industry!,
      owner: owner!,
      phone: phone!,
      health: health ?? 72,
      responseSlaMinutes: responseSlaMinutes ?? 8,
      whatsappStatus: "pending",
      metaStatus: "pending",
    },
  };
}

export function validateWorkspaceUpdate(
  body: unknown,
): ValidationResult<Partial<Omit<ClientWorkspace, "id" | "createdAt" | "updatedAt">>> {
  const source = asObject(body);
  const errors: Record<string, string> = {};
  const data: Partial<Omit<ClientWorkspace, "id" | "createdAt" | "updatedAt">> = {};

  const name = readString(source, "name", errors, { maxLength: 120 });
  const industry = readString(source, "industry", errors, { maxLength: 120 });
  const owner = readString(source, "owner", errors, { maxLength: 80 });
  const phone = readString(source, "phone", errors, { maxLength: 40 });
  const health = readNumber(source, "health", errors, { min: 0 });
  const responseSlaMinutes = readNumber(source, "responseSlaMinutes", errors, { min: 1 });
  const whatsappStatus = readEnum(source, "whatsappStatus", ["connected", "pending", "disconnected"] as const, errors);
  const metaStatus = readEnum(source, "metaStatus", ["connected", "pending", "disconnected"] as const, errors);

  if (health !== undefined && health > 100) {
    errors.health = "Debe ser menor o igual a 100.";
  }

  if (responseSlaMinutes !== undefined && responseSlaMinutes > 240) {
    errors.responseSlaMinutes = "Debe ser menor o igual a 240.";
  }

  if (name) data.name = name;
  if (industry) data.industry = industry;
  if (owner) data.owner = owner;
  if (phone) data.phone = phone;
  if (health !== undefined) data.health = health;
  if (responseSlaMinutes !== undefined) data.responseSlaMinutes = responseSlaMinutes;
  if (whatsappStatus) data.whatsappStatus = whatsappStatus;
  if (metaStatus) data.metaStatus = metaStatus;

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  return { ok: true, data };
}

export function validateDealCreate(body: unknown): ValidationResult<Omit<Deal, "id" | "createdAt" | "updatedAt">> {
  const source = asObject(body);
  const errors: Record<string, string> = {};

  const customerId = readString(source, "customerId", errors, { required: true });
  const title = readString(source, "title", errors, { required: true, maxLength: 140 });
  const value = readNumber(source, "value", errors, { required: true, min: 0 });
  const stage = readEnum(source, "stage", dealStages, errors, { required: true });
  const expectedCloseDate = readString(source, "expectedCloseDate", errors, { required: true, maxLength: 20 });

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      customerId: customerId!,
      title: title!,
      value: value!,
      stage: stage!,
      expectedCloseDate: expectedCloseDate!,
    },
  };
}

export function validateDealUpdate(body: unknown): ValidationResult<Partial<Omit<Deal, "id" | "createdAt" | "updatedAt">>> {
  const source = asObject(body);
  const errors: Record<string, string> = {};
  const data: Partial<Omit<Deal, "id" | "createdAt" | "updatedAt">> = {};

  const customerId = readString(source, "customerId", errors);
  const title = readString(source, "title", errors, { maxLength: 140 });
  const value = readNumber(source, "value", errors, { min: 0 });
  const stage = readEnum(source, "stage", dealStages, errors);
  const expectedCloseDate = readString(source, "expectedCloseDate", errors, { maxLength: 20 });

  if (customerId) data.customerId = customerId;
  if (title) data.title = title;
  if (value !== undefined) data.value = value;
  if (stage) data.stage = stage;
  if (expectedCloseDate) data.expectedCloseDate = expectedCloseDate;

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  return { ok: true, data };
}

export function validateActivityCreate(body: unknown): ValidationResult<Omit<Activity, "id" | "createdAt">> {
  const source = asObject(body);
  const errors: Record<string, string> = {};

  const customerId = readString(source, "customerId", errors, { required: true });
  const type = readEnum(source, "type", activityTypes, errors, { required: true });
  const title = readString(source, "title", errors, { required: true, maxLength: 140 });
  const notes = readString(source, "notes", errors, { maxLength: 800 });
  const dueDate = readString(source, "dueDate", errors, { maxLength: 20 });
  const completedAt = readString(source, "completedAt", errors, { maxLength: 40 });

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      customerId: customerId!,
      type: type!,
      title: title!,
      notes,
      dueDate,
      completedAt,
    },
  };
}

export function validateConversationTaskCreate(
  body: unknown,
): ValidationResult<Omit<Activity, "id" | "createdAt" | "customerId">> {
  const source = asObject(body);
  const errors: Record<string, string> = {};

  const type = readEnum(source, "type", activityTypes, errors);
  const title = readString(source, "title", errors, { required: true, maxLength: 140 });
  const notes = readString(source, "notes", errors, { maxLength: 800 });
  const dueDate = readString(source, "dueDate", errors, { maxLength: 20 });
  const completedAt = readString(source, "completedAt", errors, { maxLength: 40 });

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      type: type ?? "note",
      title: title!,
      notes,
      dueDate,
      completedAt,
    },
  };
}

export function validateActivityUpdate(body: unknown): ValidationResult<Partial<Omit<Activity, "id" | "createdAt">>> {
  const source = asObject(body);
  const errors: Record<string, string> = {};
  const data: Partial<Omit<Activity, "id" | "createdAt">> = {};

  const customerId = readString(source, "customerId", errors);
  const type = readEnum(source, "type", activityTypes, errors);
  const title = readString(source, "title", errors, { maxLength: 140 });
  const notes = readString(source, "notes", errors, { maxLength: 800 });
  const dueDate = readString(source, "dueDate", errors, { maxLength: 20 });
  const completedAt = readString(source, "completedAt", errors, { maxLength: 40 });

  if (customerId) data.customerId = customerId;
  if (type) data.type = type;
  if (title) data.title = title;
  if (notes) data.notes = notes;
  if (dueDate) data.dueDate = dueDate;
  if (completedAt) data.completedAt = completedAt;

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  return { ok: true, data };
}

export function validateConversationCreate(
  body: unknown,
): ValidationResult<
  Omit<Conversation, "id" | "messages" | "unreadCount" | "lastMessageAt" | "createdAt" | "updatedAt">
> {
  const source = asObject(body);
  const errors: Record<string, string> = {};

  const workspaceId = readString(source, "workspaceId", errors, { required: true, maxLength: 80 });
  const contactName = readString(source, "contactName", errors, { required: true, maxLength: 140 });
  const contactPhone = readString(source, "contactPhone", errors, { required: true, maxLength: 40 });
  const stage = readEnum(source, "stage", conversationStages, errors, { required: true });
  const conversationSource = readEnum(source, "source", conversationSources, errors, { required: true });
  const owner = readString(source, "owner", errors, { required: true, maxLength: 80 });
  const intent = readString(source, "intent", errors, { required: true, maxLength: 500 });
  const internalNotes = readString(source, "internalNotes", errors, { maxLength: 1500 });
  const estimatedValue = readNumber(source, "estimatedValue", errors, { required: true, min: 0 });
  const tagsValue = source.tags;
  const tags = Array.isArray(tagsValue)
    ? tagsValue.filter((tag): tag is string => typeof tag === "string").slice(0, 12)
    : undefined;

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      workspaceId: workspaceId!,
      contactName: contactName!,
      contactPhone: contactPhone!,
      stage: stage!,
      source: conversationSource!,
      owner: owner!,
      intent: intent!,
      internalNotes,
      tags,
      estimatedValue: estimatedValue!,
    },
  };
}

export function validateConversationUpdate(
  body: unknown,
): ValidationResult<Partial<Omit<Conversation, "id" | "messages" | "unreadCount" | "lastMessageAt" | "createdAt" | "updatedAt">>> {
  const source = asObject(body);
  const errors: Record<string, string> = {};
  const data: Partial<Omit<Conversation, "id" | "messages" | "unreadCount" | "lastMessageAt" | "createdAt" | "updatedAt">> = {};

  const contactName = readString(source, "contactName", errors, { maxLength: 140 });
  const contactPhone = readString(source, "contactPhone", errors, { maxLength: 40 });
  const stage = readEnum(source, "stage", conversationStages, errors);
  const conversationSource = readEnum(source, "source", conversationSources, errors);
  const owner = readString(source, "owner", errors, { maxLength: 80 });
  const intent = readString(source, "intent", errors, { maxLength: 500 });
  const internalNotes = readString(source, "internalNotes", errors, { maxLength: 1500 });
  const estimatedValue = readNumber(source, "estimatedValue", errors, { min: 0 });
  const tagsValue = source.tags;
  const tags = Array.isArray(tagsValue)
    ? tagsValue.filter((tag): tag is string => typeof tag === "string").slice(0, 12)
    : undefined;

  if (contactName) data.contactName = contactName;
  if (contactPhone) data.contactPhone = contactPhone;
  if (stage) data.stage = stage;
  if (conversationSource) data.source = conversationSource;
  if (owner) data.owner = owner;
  if (intent) data.intent = intent;
  if (internalNotes !== undefined) data.internalNotes = internalNotes;
  if (tags) data.tags = tags;
  if (estimatedValue !== undefined) data.estimatedValue = estimatedValue;

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  return { ok: true, data };
}
