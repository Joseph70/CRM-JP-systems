"use client";

import {
  Bell,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Edit3,
  Eye,
  Filter,
  GripVertical,
  Inbox,
  Instagram,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  MoreHorizontal,
  Moon,
  PhoneCall,
  PlugZap,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Tags,
  Trash2,
  UserCheck,
  LogOut,
  UserRoundPlus,
  UsersRound,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  applyLeadFormToConversation,
  buildConversationPayload,
  buildFallbackActivity,
  buildFallbackConversation,
  buildFallbackWorkspace,
  buildOutboundMessage,
  buildTaskPayload,
  buildWorkspacePayload,
  completeActivity,
  filterConversations,
  getDashboardStats,
  getPipelineValue,
  getResponseAverage,
  mergeConversationMessage,
  persistTheme,
  readSavedTheme,
  resolveNextConversationId,
  toggleAutomationState,
} from "@/src/client/crm-logic";

type View =
  | "dashboard"
  | "clients"
  | "inbox"
  | "pipeline"
  | "contacts"
  | "tasks"
  | "campaigns"
  | "automations"
  | "integrations"
  | "settings";

type ThemeMode = "light" | "dark";
type PipelineStageConfig = { id: Conversation["stage"]; label: string; color: string };

type Workspace = {
  id: string;
  name: string;
  industry: string;
  owner: string;
  phone: string;
  health: number;
  responseSlaMinutes: number;
  whatsappStatus: "connected" | "pending" | "disconnected";
  metaStatus: "connected" | "pending" | "disconnected";
};

type Message = {
  id: string;
  direction: "inbound" | "outbound";
  body: string;
  status: string;
  sentAt: string;
};

type Conversation = {
  id: string;
  workspaceId: string;
  contactName: string;
  contactPhone: string;
  stage: "new_lead" | "contacted" | "follow_up" | "appointment_scheduled" | "won" | "lost";
  source: "meta_ads" | "instagram_organic" | "facebook_organic" | "web_form" | "manual";
  owner: string;
  intent: string;
  internalNotes?: string;
  tags?: string[];
  estimatedValue: number;
  unreadCount: number;
  lastMessageAt: string;
  messages: Message[];
};

type CampaignSource = {
  id: string;
  name: string;
  channel: Conversation["source"];
  leads: number;
  spend: number;
  conversionRate: number;
  costPerLead: number;
};

type Customer = {
  id: string;
  workspaceId?: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  status: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
  source: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
};

type Activity = {
  id: string;
  customerId: string;
  type: "call" | "email" | "meeting" | "note";
  title: string;
  notes?: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
};

type AutomationRule = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  active: boolean;
};

type IntegrationConnection = {
  id: string;
  provider: "whatsapp_cloud_api" | "meta_lead_ads" | "instagram_graph" | "google_calendar";
  status: "ready" | "partial" | "pending" | "error";
  capabilities: string[];
};

type Summary = {
  totalCustomers: number;
  totalWorkspaces: number;
  totalConversations: number;
  activeLeads: number;
  openDeals: number;
  pipelineValue: number;
  pendingActivities: number;
};

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  workspaceIds: string[];
};

const initialLeadForm = {
  name: "",
  phone: "",
  source: "meta_ads" as Conversation["source"],
  intent: "",
  value: "0",
};

const initialWorkspaceForm = {
  name: "",
  industry: "",
  owner: "JP Sistems",
  phone: "",
  responseSlaMinutes: "8",
};

const viewItems: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "clients", label: "Empresas", icon: Building2 },
  { id: "inbox", label: "Bandeja", icon: Inbox },
  { id: "pipeline", label: "Pipeline", icon: Workflow },
  { id: "contacts", label: "Contactos", icon: UsersRound },
  { id: "tasks", label: "Tareas", icon: CalendarClock },
  { id: "campaigns", label: "Campanas", icon: Megaphone },
  { id: "automations", label: "Automatizaciones", icon: Sparkles },
  { id: "integrations", label: "Integraciones", icon: PlugZap },
  { id: "settings", label: "Configuracion", icon: Settings },
];

const sourceOptions: { value: Conversation["source"]; label: string }[] = [
  { value: "meta_ads", label: "Meta Lead Ads" },
  { value: "instagram_organic", label: "Instagram organico" },
  { value: "facebook_organic", label: "Facebook organico" },
  { value: "web_form", label: "Formulario web" },
  { value: "manual", label: "Carga manual" },
];

const pipelineStages: PipelineStageConfig[] = [
  { id: "new_lead", label: "Nuevo lead", color: "blue" },
  { id: "contacted", label: "Contactado", color: "green" },
  { id: "follow_up", label: "Seguimiento", color: "purple" },
  { id: "appointment_scheduled", label: "Cita agendada", color: "amber" },
  { id: "won", label: "Ganado", color: "teal" },
  { id: "lost", label: "Perdido", color: "gray" },
];

const defaultPipelineStageLabels = pipelineStages.reduce(
  (labels, stage) => ({ ...labels, [stage.id]: stage.label }),
  {} as Record<Conversation["stage"], string>,
);

const ownerOptions = ["Sin asignar", "Daniela", "Marco", "JP Admin", "Operador Comercial"];

const quickReplyOptions = [
  "Hola, gracias por escribirnos. Te ayudo con gusto.",
  "Tenemos disponibilidad esta semana. Que horario te queda mejor?",
  "Te puedo enviar precios y opciones por este medio.",
];

export default function Home() {
  const [activeView, setActiveView] = useState<View>("inbox");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: "admin@jpsistems.local", password: "admin" });
  const [authError, setAuthError] = useState("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignSource[]>([]);
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationConnection[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | Conversation["stage"]>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | Conversation["source"]>("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [leadNotes, setLeadNotes] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");
  const [leadForm, setLeadForm] = useState(initialLeadForm);
  const [workspaceForm, setWorkspaceForm] = useState(initialWorkspaceForm);
  const [taskForm, setTaskForm] = useState({ title: "", dueDate: "", notes: "" });
  const [pipelineStageLabels, setPipelineStageLabels] =
    useState<Record<Conversation["stage"], string>>(defaultPipelineStageLabels);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setThemeMode(readSavedTheme(window.localStorage) as ThemeMode);
  }, []);

  useEffect(() => {
    persistTheme({
      documentElement: document.documentElement,
      storage: window.localStorage,
      mode: themeMode,
    });
  }, [themeMode]);

  useEffect(() => {
    const savedLabels = window.localStorage.getItem("jp-crm-pipeline-labels");
    if (!savedLabels) return;

    try {
      setPipelineStageLabels({ ...defaultPipelineStageLabels, ...JSON.parse(savedLabels) });
    } catch {
      setPipelineStageLabels(defaultPipelineStageLabels);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("jp-crm-pipeline-labels", JSON.stringify(pipelineStageLabels));
  }, [pipelineStageLabels]);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const session = await getJson<{ user: SessionUser }>("/api/auth/me");

        if (!cancelled) {
          setUser(session.user);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    }

    loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadWorkspaces() {
      try {
        const [workspaceData, summaryData] = await Promise.all([
          getJson<Workspace[]>("/api/crm/workspaces"),
          getJson<Summary>("/api/crm/summary"),
        ]);

        if (cancelled) return;

        setWorkspaces(workspaceData);
        setSummary(summaryData);
        setSelectedWorkspaceId((current) => current || workspaceData[0]?.id || "");
      } catch {
        if (!cancelled) {
          setError("No se pudo cargar la informacion inicial del CRM.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadWorkspaces();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!selectedWorkspaceId) return;

    let cancelled = false;

    async function loadWorkspaceData() {
      setError("");
      try {
        const query = `?workspaceId=${encodeURIComponent(selectedWorkspaceId)}`;
        const [conversationData, customerData, activityData, campaignData, automationData, integrationData, summaryData] =
          await Promise.all([
            getJson<Conversation[]>(`/api/crm/conversations${query}`),
            getJson<Customer[]>(`/api/crm/customers${query}`),
            getJson<Activity[]>("/api/crm/activities"),
            getJson<CampaignSource[]>(`/api/crm/campaign-sources${query}`),
            getJson<AutomationRule[]>(`/api/crm/automations${query}`),
            getJson<IntegrationConnection[]>(`/api/crm/integrations${query}`),
            getJson<Summary>("/api/crm/summary"),
          ]);

        if (cancelled) return;

        setConversations(conversationData);
        setCustomers(customerData);
        setActivities(activityData);
        setCampaigns(campaignData);
        setAutomations(automationData);
        setIntegrations(integrationData);
        setSummary(summaryData);
        setSelectedConversationId((current) => {
          if (conversationData.some((conversation) => conversation.id === current)) {
            return current;
          }

          return conversationData[0]?.id || "";
        });
      } catch {
        if (!cancelled) {
          setError("No se pudieron cargar los datos del cliente activo.");
        }
      }
    }

    loadWorkspaceData();
    return () => {
      cancelled = true;
    };
  }, [selectedWorkspaceId]);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? workspaces[0],
    [selectedWorkspaceId, workspaces],
  );

  const selectedConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === selectedConversationId) ??
      conversations[0],
    [conversations, selectedConversationId],
  );

  const responseAverage = getResponseAverage(selectedWorkspace);
  const pipelineValue = getPipelineValue(conversations);
  const activePipelineStages = useMemo<PipelineStageConfig[]>(
    () =>
      pipelineStages.map((stage) => ({
        ...stage,
        label: pipelineStageLabels[stage.id]?.trim() || stage.label,
      })),
    [pipelineStageLabels],
  );

  function currentStageLabel(stage: Conversation["stage"]) {
    return activePipelineStages.find((item) => item.id === stage)?.label ?? stageLabel(stage);
  }

  const filteredConversations = useMemo<Conversation[]>(() => {
    return filterConversations(
      conversations,
      { searchTerm, stageFilter, sourceFilter, ownerFilter },
      { sourceLabel, stageLabel: currentStageLabel },
    ) as Conversation[];
  }, [activePipelineStages, conversations, ownerFilter, searchTerm, sourceFilter, stageFilter]);

  function showToast(message: string) {
    setToast(message);
  }

  function chooseTheme(mode: ThemeMode) {
    setThemeMode(mode);
  }

  function renamePipelineStage(stageId: Conversation["stage"], label: string) {
    setPipelineStageLabels((current) => ({ ...current, [stageId]: label }));
  }

  function resetPipelineStages() {
    setPipelineStageLabels(defaultPipelineStageLabels);
    showToast("Etapas del pipeline restauradas.");
  }

  function openNewLeadModal() {
    setEditingConversationId(null);
    setLeadForm(initialLeadForm);
    setLeadModalOpen(true);
  }

  function openEditLeadModal(conversation: Conversation) {
    setEditingConversationId(conversation.id);
    setLeadForm({
      name: conversation.contactName,
      phone: conversation.contactPhone,
      source: conversation.source,
      intent: conversation.intent,
      value: String(conversation.estimatedValue),
    });
    setLeadModalOpen(true);
  }

  async function sendMessage() {
    const trimmed = messageDraft.trim();

    if (!trimmed || !selectedConversation) {
      showToast("Escribe un mensaje antes de enviarlo.");
      return;
    }

    try {
      const updated = await postJson<Conversation>(`/api/crm/conversations/${selectedConversation.id}/messages`, {
        direction: "outbound",
        body: trimmed,
        status: "sent",
      });

      setConversations((current) =>
        current.map((conversation) => (conversation.id === updated.id ? updated : conversation)),
      );
    } catch {
      const mockMessage = buildOutboundMessage(trimmed) as Message;

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === selectedConversation.id
            ? (mergeConversationMessage(conversation, mockMessage) as Conversation)
            : conversation,
        ),
      );
    }

    setMessageDraft("");
    showToast("Mensaje enviado en modo demo.");
  }

  async function createLead() {
    const name = leadForm.name.trim();
    const phone = leadForm.phone.trim();
    const intent = leadForm.intent.trim();

    if (!name || !phone || !intent || !selectedWorkspaceId) {
      showToast("Completa nombre, WhatsApp e intencion del lead.");
      return;
    }

    if (editingConversationId) {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === editingConversationId
            ? (applyLeadFormToConversation(conversation, leadForm) as Conversation)
            : conversation,
        ),
      );
      setLeadModalOpen(false);
      setEditingConversationId(null);
      setLeadForm(initialLeadForm);
      showToast("Lead actualizado.");
      return;
    }

    const payload = buildConversationPayload({ form: leadForm, workspaceId: selectedWorkspaceId });

    let conversation: Conversation;

    try {
      conversation = await postJson<Conversation>("/api/crm/conversations", payload);
    } catch {
      conversation = buildFallbackConversation(payload) as Conversation;
    }

    setConversations((current) => [conversation, ...current]);
    setSelectedConversationId(conversation.id);
    setActiveView("inbox");
    setLeadForm(initialLeadForm);
    setLeadModalOpen(false);
    showToast("Lead creado.");
  }

  async function createWorkspace() {
    const name = workspaceForm.name.trim();
    const industry = workspaceForm.industry.trim();
    const owner = workspaceForm.owner.trim();
    const phone = workspaceForm.phone.trim();

    if (!name || !industry || !owner || !phone) {
      showToast("Completa los datos basicos de la empresa.");
      return;
    }

    const payload = buildWorkspacePayload(workspaceForm);

    let workspace: Workspace;

    try {
      workspace = await postJson<Workspace>("/api/crm/workspaces", payload);
    } catch {
      workspace = buildFallbackWorkspace(payload) as Workspace;
    }

    setWorkspaces((current) => [...current, workspace].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedWorkspaceId(workspace.id);
    setWorkspaceForm(initialWorkspaceForm);
    setWorkspaceModalOpen(false);
    setActiveView("settings");
    showToast("Empresa creada.");
  }

  async function updateConversationStage(conversationId: string, stage: Conversation["stage"]) {
    try {
      const updated = await patchJson<Conversation>(`/api/crm/conversations/${conversationId}`, { stage });

      setConversations((current) =>
        current.map((conversation) => (conversation.id === updated.id ? updated : conversation)),
      );
      setSelectedConversationId(updated.id);
    } catch {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId ? { ...conversation, stage } : conversation,
        ),
      );
      setSelectedConversationId(conversationId);
    }

    showToast(`Lead movido a ${currentStageLabel(stage)}.`);
  }

  function deleteConversation(conversationId: string) {
    fetch(`/api/crm/conversations/${conversationId}`, { method: "DELETE" }).catch(() => undefined);
    setConversations((current) => current.filter((conversation) => conversation.id !== conversationId));
    if (selectedConversationId === conversationId) {
      setSelectedConversationId(resolveNextConversationId(conversations, conversationId));
    }
    showToast("Lead eliminado del MVP.");
  }

  function assignConversationOwner(conversationId: string, owner: string) {
    patchJson<Conversation>(`/api/crm/conversations/${conversationId}`, { owner }).catch(() => undefined);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, owner } : conversation,
      ),
    );
    showToast(`Responsable asignado: ${owner}.`);
  }

  function saveInternalNote() {
    if (!selectedConversation) return;
    const internalNotes = leadNotes[selectedConversation.id] ?? selectedConversation.internalNotes ?? "";
    patchJson<Conversation>(`/api/crm/conversations/${selectedConversation.id}`, { internalNotes })
      .then((updated) => {
        setConversations((current) =>
          current.map((conversation) => (conversation.id === updated.id ? updated : conversation)),
        );
      })
      .catch(() => {
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === selectedConversation.id ? { ...conversation, internalNotes } : conversation,
          ),
        );
      });
    showToast("Nota interna guardada.");
    setNoteModalOpen(false);
  }

  function createTask() {
    const title = taskForm.title.trim();

    if (!title) {
      showToast("Escribe el titulo de la tarea.");
      return;
    }

    const payload = buildTaskPayload(taskForm);
    const fallbackActivity = buildFallbackActivity(payload, customers[0]?.id) as Activity;

    if (selectedConversationId) {
      postJson<Activity>(`/api/crm/conversations/${selectedConversationId}/tasks`, payload)
        .then((activity) => setActivities((current) => [activity, ...current]))
        .catch(() => setActivities((current) => [fallbackActivity, ...current]));
    } else {
      setActivities((current) => [fallbackActivity, ...current]);
    }
    setTaskForm({ title: "", dueDate: "", notes: "" });
    setTaskModalOpen(false);
    setActiveView("tasks");
    showToast("Tarea creada.");
  }

  function completeTask(activityId: string) {
    patchJson<Activity>(`/api/crm/activities/${activityId}`, { completedAt: new Date().toISOString() }).catch(
      () => undefined,
    );
    setActivities((current) =>
      current.map((activity) =>
        activity.id === activityId ? (completeActivity(activity) as Activity) : activity,
      ),
    );
    showToast("Tarea marcada como completada.");
  }

  function markConversationRead(conversationId: string) {
    postJson<Conversation>(`/api/crm/conversations/${conversationId}/read`, {})
      .then((updated) =>
        setConversations((current) =>
          current.map((conversation) => (conversation.id === updated.id ? updated : conversation)),
        ),
      )
      .catch(() => undefined);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation,
      ),
    );
    showToast("Conversacion marcada como respondida.");
  }

  function showDevelopmentToast() {
    showToast("Funcion en desarrollo para integracion real.");
  }

  function toggleAutomation(automation: AutomationRule) {
    const nextAutomation = toggleAutomationState(automation) as AutomationRule;
    const nextActive = nextAutomation.active;
    patchJson<AutomationRule>(`/api/crm/automations/${automation.id}`, { active: nextActive })
      .then((updated) => {
        setAutomations((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      })
      .catch(() => {
        setAutomations((current) =>
          current.map((item) => (item.id === automation.id ? nextAutomation : item)),
        );
      });
    showToast(nextActive ? "Automatizacion activada." : "Automatizacion pausada.");
  }

  async function login() {
    setAuthError("");

    try {
      const result = await postJson<{ user: SessionUser }>("/api/auth/login", loginForm);
      setUser(result.user);
    } catch {
      setAuthError("Correo o password incorrecto.");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setWorkspaces([]);
    setConversations([]);
    setSelectedWorkspaceId("");
  }

  if (authLoading) {
    return <main className="loadingScreen">Validando sesion...</main>;
  }

  if (!user) {
    return (
      <main className="loginShell" data-theme={themeMode}>
        <section className="loginPanel" aria-label="Iniciar sesion">
          <div className="brandBlock loginBrand">
            <div className="brandMark">JP</div>
            <div>
              <strong>JP Sistems CRM</strong>
              <span>Acceso operativo</span>
            </div>
          </div>
          <ThemeSwitch themeMode={themeMode} onThemeChange={chooseTheme} />
          <div>
            <p className="eyebrow">Sesion segura</p>
            <h1>Iniciar sesion</h1>
          </div>
          <label>
            Correo
            <input
              value={loginForm.email}
              onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              value={loginForm.password}
              onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
              type="password"
              autoComplete="current-password"
            />
          </label>
          {authError && <div className="alertBanner">{authError}</div>}
          <button className="primaryButton" onClick={login}>
            Entrar al CRM
          </button>
        </section>
      </main>
    );
  }

  if (loading) {
    return <main className="loadingScreen">Cargando CRM...</main>;
  }

  if (!selectedWorkspace) {
    return <main className="loadingScreen">No hay clientes configurados todavia.</main>;
  }

  return (
    <main className="appShell" data-theme={themeMode}>
      <aside className="sidebar" aria-label="Navegacion principal">
        <div className="brandBlock">
          <div className="brandMark">JP</div>
          <div>
            <strong>JP Sistems CRM</strong>
            <span>WhatsApp + Meta</span>
          </div>
        </div>

        <nav className="navList">
          {viewItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={`navItem ${activeView === item.id ? "active" : ""}`}
                key={item.id}
                onClick={() => setActiveView(item.id)}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="sidebarCard">
          <ShieldCheck size={18} />
          <strong>SLA activo</strong>
          <span>Responder leads calientes antes de {selectedWorkspace.responseSlaMinutes} min.</span>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="clientSwitcher">
            <label htmlFor="client">Cliente activo</label>
            <div className="selectWrap">
              <select
                id="client"
                value={selectedWorkspaceId}
                onChange={(event) => setSelectedWorkspaceId(event.target.value)}
              >
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} />
            </div>
          </div>

          <label className="searchBox">
            <Search size={18} />
            <input
              placeholder="Buscar contacto, etiqueta, campana o mensaje"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <div className="topActions">
            <ThemeSwitch themeMode={themeMode} onThemeChange={chooseTheme} />
            <button className="iconButton" aria-label="Notificaciones" onClick={() => showToast("No hay notificaciones nuevas.")}>
              <Bell size={18} />
            </button>
            <button
              className="userSession"
              aria-label={`Sesion de ${user.name}`}
              title={user.email}
              onClick={() => showToast(`${user.name} - ${user.email}`)}
            >
              <span>{initials(user.name)}</span>
              {user.role}
            </button>
            <button className="iconButton" onClick={logout} aria-label="Cerrar sesion">
              <LogOut size={18} />
            </button>
            <button className="primaryButton" onClick={openNewLeadModal}>
              <UserRoundPlus size={18} />
              Nuevo lead
            </button>
            <button className="secondaryButton" onClick={() => setWorkspaceModalOpen(true)}>
              <Building2 size={18} />
              Nueva empresa
            </button>
          </div>
        </header>

        {toast && <div className="toastBanner">{toast}</div>}
        {error && <div className="alertBanner">{error}</div>}

        <section className="clientBand">
          <div>
            <p className="eyebrow">Operacion multi-cliente</p>
            <h1>{selectedWorkspace.name}</h1>
            <p>
              {selectedWorkspace.industry} - {selectedWorkspace.phone} - Responsable:{" "}
              {selectedWorkspace.owner}
            </p>
          </div>
          <div className="statusGrid">
            <StatusMetric label="Salud CRM" value={`${selectedWorkspace.health}%`} />
            <StatusMetric label="Meta" value={statusLabel(selectedWorkspace.metaStatus)} />
            <StatusMetric label="WhatsApp" value={statusLabel(selectedWorkspace.whatsappStatus)} />
          </div>
        </section>

        <section className="metricsRow" aria-label="Indicadores principales">
          <Metric label="Conversaciones" value={`${filteredConversations.length}`} detail="Leads visibles con filtros" />
          <Metric label="Respuesta media" value={responseAverage} detail={`Objetivo ${selectedWorkspace.responseSlaMinutes} min`} />
          <Metric label="Leads activos" value={`${summary?.activeLeads ?? 0}`} detail="Base comercial general" />
          <Metric label="Valor pipeline" value={money(pipelineValue || summary?.pipelineValue || 0)} detail="Oportunidades abiertas" />
        </section>

        {activeView === "dashboard" && (
          <DashboardView
            campaigns={campaigns}
            conversations={filteredConversations}
            customers={customers}
            activities={activities}
            summary={summary}
          />
        )}

        {activeView === "clients" && (
          <ClientsView
            workspaces={workspaces}
            selectedWorkspaceId={selectedWorkspaceId}
            onSelect={(workspaceId) => {
              setSelectedWorkspaceId(workspaceId);
              setActiveView("dashboard");
            }}
            onCreate={() => setWorkspaceModalOpen(true)}
          />
        )}

        {activeView === "inbox" && (
          <section className="mainGrid">
            <section className="panel inboxPanel" aria-label="Bandeja de WhatsApp">
              <PanelHeading
                eyebrow="WhatsApp primero"
                title="Bandeja unificada"
                onFilter={() => showToast("Usa los filtros de la barra lateral derecha.")}
                onMore={() => setTaskModalOpen(true)}
              />
              <div className="conversationList">
                {filteredConversations.map((conversation) => (
                  <button
                    className={`conversationRow ${
                      selectedConversation?.id === conversation.id ? "selected" : ""
                    }`}
                    key={conversation.id}
                    onClick={() => {
                      setSelectedConversationId(conversation.id);
                      markConversationRead(conversation.id);
                    }}
                  >
                    <div className="avatar">{initials(conversation.contactName)}</div>
                    <div className="conversationCopy">
                      <div className="rowBetween">
                        <strong>{conversation.contactName}</strong>
                        <span>{relativeTime(conversation.lastMessageAt)}</span>
                      </div>
                      <p>{conversation.intent}</p>
                      <div className="tagRow">
                        <span>{currentStageLabel(conversation.stage)}</span>
                        <span>{sourceLabel(conversation.source)}</span>
                      </div>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="unreadCount">{conversation.unreadCount}</span>
                    )}
                  </button>
                ))}
                {!filteredConversations.length && <div className="emptyInline">No hay leads con estos filtros.</div>}
              </div>
            </section>

            {selectedConversation ? (
              <section className="panel chatPanel" aria-label="Conversacion seleccionada">
                <div className="chatHeader">
                  <div>
                    <h2>{selectedConversation.contactName}</h2>
                    <p>
                      {currentStageLabel(selectedConversation.stage)} - {selectedConversation.owner} -{" "}
                      {selectedConversation.contactPhone}
                    </p>
                  </div>
                  <div className="toolbar">
                    <select
                      className="stageSelect"
                      aria-label="Cambiar etapa"
                      value={selectedConversation.stage}
                      onChange={(event) =>
                        updateConversationStage(
                          selectedConversation.id,
                          event.target.value as Conversation["stage"],
                        )
                      }
                    >
                      {activePipelineStages.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stage.label}
                        </option>
                      ))}
                    </select>
                    <button
                      className="iconButton"
                      aria-label="Llamar contacto"
                      onClick={() => showToast(`Llamada demo a ${selectedConversation.contactPhone}`)}
                    >
                      <PhoneCall size={18} />
                    </button>
                    <button
                      className="iconButton"
                      aria-label="Etiquetar contacto"
                      onClick={() => showToast("Etiqueta Caliente agregada al lead.")}
                    >
                      <Tags size={18} />
                    </button>
                    <button className="iconButton" aria-label="Mas acciones" onClick={() => setNoteModalOpen(true)}>
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>

                <div className="chatBody">
                  {selectedConversation.messages.map((message) => (
                    <div
                      className={`messageBubble ${message.direction === "outbound" ? "agent" : ""}`}
                      key={message.id}
                    >
                      {message.body}
                    </div>
                  ))}
                </div>

                <div className="leadSummary">
                  <SummaryItem label="Origen" value={sourceLabel(selectedConversation.source)} />
                  <SummaryItem label="Valor" value={money(selectedConversation.estimatedValue)} />
                  <SummaryItem label="Canal" value="WhatsApp" />
                </div>

                <form
                  className="composer"
                  onSubmit={(event) => {
                    event.preventDefault();
                    sendMessage();
                  }}
                >
                  <input
                    placeholder="Escribe una respuesta o usa una plantilla aprobada"
                    value={messageDraft}
                    onChange={(event) => setMessageDraft(event.target.value)}
                  />
                  <button aria-label="Enviar mensaje" type="submit">
                    <Send size={18} />
                  </button>
                </form>
              </section>
            ) : (
              <section className="panel emptyPanel">No hay conversaciones para este cliente.</section>
            )}

            <aside className="panel opsPanel" aria-label="Operacion del cliente">
              <QuickActions
                campaigns={campaigns}
                pipelineStages={activePipelineStages}
                slaMinutes={selectedWorkspace.responseSlaMinutes}
                stageFilter={stageFilter}
                sourceFilter={sourceFilter}
                ownerFilter={ownerFilter}
                onStageFilterChange={setStageFilter}
                onSourceFilterChange={setSourceFilter}
                onOwnerFilterChange={setOwnerFilter}
                onQuickReply={(reply) => setMessageDraft(reply)}
                onCreateTask={() => setTaskModalOpen(true)}
                onCreateDeal={() => {
                  if (selectedConversation) {
                    updateConversationStage(selectedConversation.id, "follow_up");
                  }
                }}
              />
            </aside>
          </section>
        )}

        {activeView === "pipeline" && (
          <PipelineView
            conversations={filteredConversations}
            pipelineStages={activePipelineStages}
            onMove={updateConversationStage}
            onOpen={(conversation) => {
              setSelectedConversationId(conversation.id);
              setActiveView("inbox");
            }}
            onRenameStage={renamePipelineStage}
            onResetStages={resetPipelineStages}
          />
        )}
        {activeView === "contacts" && (
          <ContactsView
            conversations={filteredConversations}
            customers={customers}
            onOpen={(conversation) => {
              setSelectedConversationId(conversation.id);
              setActiveView("inbox");
            }}
            onEdit={openEditLeadModal}
            onDelete={deleteConversation}
          />
        )}
        {activeView === "tasks" && (
          <TasksView
            activities={activities}
            customers={customers}
            conversations={filteredConversations}
            onCreate={() => setTaskModalOpen(true)}
            onComplete={completeTask}
            onOpenConversation={(conversation) => {
              setSelectedConversationId(conversation.id);
              setActiveView("inbox");
            }}
          />
        )}
        {activeView === "campaigns" && <CampaignsView sources={campaigns} onOpenSource={(source) => setSourceFilter(source.channel)} />}
        {activeView === "automations" && <AutomationsView automations={automations} onToggle={toggleAutomation} />}
        {activeView === "integrations" && <IntegrationsView integrations={integrations} onConnect={showDevelopmentToast} />}
        {activeView === "settings" && (
          <SettingsView
            workspace={selectedWorkspace}
            integrations={integrations}
            pipelineStages={activePipelineStages}
            themeMode={themeMode}
            onThemeChange={chooseTheme}
            onEdit={showDevelopmentToast}
          />
        )}

        {leadModalOpen && (
          <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Nuevo lead">
            <section className="modalPanel">
              <div className="modalHeader">
                <div>
                  <p className="eyebrow">{editingConversationId ? "Edicion de lead" : "Captura manual"}</p>
                  <h2>{editingConversationId ? "Editar lead WhatsApp" : "Nuevo lead WhatsApp"}</h2>
                </div>
                <button className="iconButton" onClick={() => setLeadModalOpen(false)} aria-label="Cerrar">
                  <MoreHorizontal size={18} />
                </button>
              </div>

              <div className="formGrid">
                <label>
                  Nombre
                  <input
                    value={leadForm.name}
                    onChange={(event) => setLeadForm({ ...leadForm, name: event.target.value })}
                    placeholder="Nombre del contacto"
                  />
                </label>
                <label>
                  WhatsApp
                  <input
                    value={leadForm.phone}
                    onChange={(event) => setLeadForm({ ...leadForm, phone: event.target.value })}
                    placeholder="+593 ..."
                  />
                </label>
                <label>
                  Fuente
                  <select
                    value={leadForm.source}
                    onChange={(event) =>
                      setLeadForm({ ...leadForm, source: event.target.value as Conversation["source"] })
                    }
                  >
                    {sourceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Valor estimado
                  <input
                    value={leadForm.value}
                    onChange={(event) => setLeadForm({ ...leadForm, value: event.target.value })}
                    placeholder="320"
                    inputMode="numeric"
                  />
                </label>
                <label className="fullField">
                  Intencion
                  <textarea
                    value={leadForm.intent}
                    onChange={(event) => setLeadForm({ ...leadForm, intent: event.target.value })}
                    placeholder="Que quiere comprar, agendar o consultar"
                  />
                </label>
              </div>

              <div className="modalActions">
                <button className="secondaryButton" onClick={() => setLeadModalOpen(false)}>
                  Cancelar
                </button>
                <button className="primaryButton" onClick={createLead}>
                  <Check size={18} />
                  {editingConversationId ? "Guardar cambios" : "Crear lead"}
                </button>
              </div>
            </section>
          </div>
        )}

        {workspaceModalOpen && (
          <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Nueva empresa">
            <section className="modalPanel">
              <div className="modalHeader">
                <div>
                  <p className="eyebrow">Workspace independiente</p>
                  <h2>Nueva empresa cliente</h2>
                </div>
                <button className="iconButton" onClick={() => setWorkspaceModalOpen(false)} aria-label="Cerrar">
                  <MoreHorizontal size={18} />
                </button>
              </div>

              <div className="formGrid">
                <label>
                  Nombre comercial
                  <input
                    value={workspaceForm.name}
                    onChange={(event) => setWorkspaceForm({ ...workspaceForm, name: event.target.value })}
                    placeholder="Clinica, inmobiliaria, ecommerce"
                  />
                </label>
                <label>
                  Industria
                  <input
                    value={workspaceForm.industry}
                    onChange={(event) => setWorkspaceForm({ ...workspaceForm, industry: event.target.value })}
                    placeholder="Marketing, salud, fitness"
                  />
                </label>
                <label>
                  Responsable agencia
                  <input
                    value={workspaceForm.owner}
                    onChange={(event) => setWorkspaceForm({ ...workspaceForm, owner: event.target.value })}
                  />
                </label>
                <label>
                  WhatsApp comercial
                  <input
                    value={workspaceForm.phone}
                    onChange={(event) => setWorkspaceForm({ ...workspaceForm, phone: event.target.value })}
                    placeholder="+593 ..."
                  />
                </label>
                <label className="fullField">
                  SLA de respuesta en minutos
                  <input
                    value={workspaceForm.responseSlaMinutes}
                    onChange={(event) =>
                      setWorkspaceForm({ ...workspaceForm, responseSlaMinutes: event.target.value })
                    }
                    inputMode="numeric"
                  />
                </label>
              </div>

              <div className="modalActions">
                <button className="secondaryButton" onClick={() => setWorkspaceModalOpen(false)}>
                  Cancelar
                </button>
                <button className="primaryButton" onClick={createWorkspace}>
                  <Check size={18} />
                  Crear empresa
                </button>
              </div>
            </section>
          </div>
        )}

        {taskModalOpen && (
          <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Nueva tarea">
            <section className="modalPanel">
              <div className="modalHeader">
                <div>
                  <p className="eyebrow">Seguimiento</p>
                  <h2>Nueva tarea</h2>
                </div>
                <button className="iconButton" onClick={() => setTaskModalOpen(false)} aria-label="Cerrar">
                  <MoreHorizontal size={18} />
                </button>
              </div>
              <div className="formGrid">
                <label>
                  Titulo
                  <input
                    value={taskForm.title}
                    onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}
                    placeholder="Llamar, enviar propuesta, confirmar cita"
                  />
                </label>
                <label>
                  Fecha
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })}
                  />
                </label>
                <label className="fullField">
                  Nota
                  <textarea
                    value={taskForm.notes}
                    onChange={(event) => setTaskForm({ ...taskForm, notes: event.target.value })}
                    placeholder="Detalle interno para el asesor"
                  />
                </label>
              </div>
              <div className="modalActions">
                <button className="secondaryButton" onClick={() => setTaskModalOpen(false)}>
                  Cancelar
                </button>
                <button className="primaryButton" onClick={createTask}>
                  <Check size={18} />
                  Crear tarea
                </button>
              </div>
            </section>
          </div>
        )}

        {noteModalOpen && selectedConversation && (
          <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Nota interna">
            <section className="modalPanel">
              <div className="modalHeader">
                <div>
                  <p className="eyebrow">Operacion interna</p>
                  <h2>{selectedConversation.contactName}</h2>
                </div>
                <button className="iconButton" onClick={() => setNoteModalOpen(false)} aria-label="Cerrar">
                  <MoreHorizontal size={18} />
                </button>
              </div>
              <div className="formGrid">
                <label>
                  Responsable
                  <select
                    value={selectedConversation.owner}
                    onChange={(event) => assignConversationOwner(selectedConversation.id, event.target.value)}
                  >
                    {ownerOptions.map((owner) => (
                      <option key={owner} value={owner}>
                        {owner}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Estado
                  <select
                    value={selectedConversation.stage}
                    onChange={(event) =>
                      updateConversationStage(selectedConversation.id, event.target.value as Conversation["stage"])
                    }
                  >
                    {activePipelineStages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="fullField">
                  Nota interna
                  <textarea
                    value={leadNotes[selectedConversation.id] ?? selectedConversation.internalNotes ?? ""}
                    onChange={(event) =>
                      setLeadNotes((current) => ({
                        ...current,
                        [selectedConversation.id]: event.target.value,
                      }))
                    }
                    placeholder="Resumen de objeciones, interes, presupuesto o proximo paso"
                  />
                </label>
              </div>
              <div className="modalActions">
                <button className="secondaryButton" onClick={() => openEditLeadModal(selectedConversation)}>
                  <Edit3 size={18} />
                  Editar lead
                </button>
                <button className="secondaryButton" onClick={() => setTaskModalOpen(true)}>
                  <CalendarClock size={18} />
                  Crear tarea
                </button>
                <button className="primaryButton" onClick={saveInternalNote}>
                  <Check size={18} />
                  Guardar
                </button>
              </div>
            </section>
          </div>
        )}

      </section>
    </main>
  );
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function patchJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="statusMetric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="metricCard">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function PanelHeading({
  eyebrow,
  title,
  onFilter,
  onMore,
}: {
  eyebrow?: string;
  title: string;
  onFilter?: () => void;
  onMore?: () => void;
}) {
  return (
    <div className="panelHeading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {(onFilter || onMore) && (
        <div className="toolbar">
          {onFilter && (
            <button className="iconButton" aria-label="Filtrar" onClick={onFilter}>
              <Filter size={18} />
            </button>
          )}
          {onMore && (
            <button className="iconButton" aria-label="Mas opciones" onClick={onMore}>
              <MoreHorizontal size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function QuickActions({
  campaigns,
  pipelineStages,
  slaMinutes,
  stageFilter,
  sourceFilter,
  ownerFilter,
  onStageFilterChange,
  onSourceFilterChange,
  onOwnerFilterChange,
  onQuickReply,
  onCreateTask,
  onCreateDeal,
}: {
  campaigns: CampaignSource[];
  pipelineStages: PipelineStageConfig[];
  slaMinutes: number;
  stageFilter: "all" | Conversation["stage"];
  sourceFilter: "all" | Conversation["source"];
  ownerFilter: string;
  onStageFilterChange: (stage: "all" | Conversation["stage"]) => void;
  onSourceFilterChange: (source: "all" | Conversation["source"]) => void;
  onOwnerFilterChange: (owner: string) => void;
  onQuickReply: (reply: string) => void;
  onCreateTask: () => void;
  onCreateDeal: () => void;
}) {
  return (
    <>
      <section>
        <div className="compactHeading">
          <h2>Acciones rapidas</h2>
          <Zap size={18} />
        </div>
        <div className="actionStack">
          <button onClick={() => onQuickReply(quickReplyOptions[0])}>
            <MessageCircle size={18} />
            Plantilla WhatsApp
          </button>
          <button onClick={onCreateTask}>
            <CalendarClock size={18} />
            Agendar seguimiento
          </button>
          <button onClick={onCreateDeal}>
            <CircleDollarSign size={18} />
            Crear oportunidad
          </button>
        </div>
      </section>

      <section>
        <div className="compactHeading">
          <h2>Filtros</h2>
          <Filter size={18} />
        </div>
        <div className="filterStack">
          <label>
            Estado
            <select value={stageFilter} onChange={(event) => onStageFilterChange(event.target.value as "all" | Conversation["stage"])}>
              <option value="all">Todos</option>
              {pipelineStages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fuente
            <select value={sourceFilter} onChange={(event) => onSourceFilterChange(event.target.value as "all" | Conversation["source"])}>
              <option value="all">Todas</option>
              {sourceOptions.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Asesor
            <select value={ownerFilter} onChange={(event) => onOwnerFilterChange(event.target.value)}>
              <option value="all">Todos</option>
              {ownerOptions.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section>
        <div className="compactHeading">
          <h2>Fuentes activas</h2>
          <Instagram size={18} />
        </div>
        <div className="sourceList">
          {campaigns.slice(0, 3).map((source) => (
            <div className="sourceRow" key={source.id}>
              <div>
                <strong>{source.name}</strong>
                <span>{source.leads} leads</span>
              </div>
              <div>
                <span>CPL {money(source.costPerLead)}</span>
                <strong>{source.conversionRate}%</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="slaBox">
        <Clock3 size={18} />
        <div>
          <strong>SLA comercial</strong>
          <span>Meta activa: responder en menos de {slaMinutes} minutos.</span>
        </div>
      </section>
    </>
  );
}

function DashboardView({
  campaigns,
  conversations,
  customers,
  activities,
  summary,
}: {
  campaigns: CampaignSource[];
  conversations: Conversation[];
  customers: Customer[];
  activities: Activity[];
  summary: Summary | null;
}) {
  const { unread, won, conversion, pendingTasks, newLeads } = getDashboardStats({
    conversations,
    activities,
  });

  return (
    <section className="dashboardGrid">
      <article className="widePanel dashboardMain">
        <PanelHeading eyebrow="Control general" title="Resumen comercial" />
        <div className="insightGrid">
          <Metric label="Leads nuevos" value={`${newLeads}`} detail="Desde WhatsApp, Meta y organico" />
          <Metric label="Pendientes" value={`${unread}`} detail="Mensajes sin leer" />
          <Metric label="Ventas cerradas" value={`${won}`} detail={`${conversion}% de conversion mock`} />
          <Metric label="Tareas" value={`${pendingTasks}`} detail="Seguimientos activos" />
        </div>
        <div className="chartList">
          {campaigns.map((campaign) => (
            <div className="chartRow" key={campaign.id}>
              <span>{campaign.name}</span>
              <div>
                <i style={{ width: `${Math.min(100, campaign.leads)}%` }} />
              </div>
              <strong>{campaign.leads}</strong>
            </div>
          ))}
        </div>
      </article>

      <aside className="widePanel dashboardAside">
        <PanelHeading eyebrow="Separacion de datos" title="Operacion SaaS" />
        <div className="settingsList">
          <SummaryItem label="Empresas" value={`${summary?.totalWorkspaces ?? 0}`} />
          <SummaryItem label="Contactos CRM" value={`${customers.length}`} />
          <SummaryItem label="Conversaciones" value={`${summary?.totalConversations ?? conversations.length}`} />
          <SummaryItem label="Pipeline general" value={money(summary?.pipelineValue ?? 0)} />
        </div>
      </aside>
    </section>
  );
}

function ClientsView({
  workspaces,
  selectedWorkspaceId,
  onSelect,
  onCreate,
}: {
  workspaces: Workspace[];
  selectedWorkspaceId: string;
  onSelect: (workspaceId: string) => void;
  onCreate: () => void;
}) {
  return (
    <section className="widePanel">
      <div className="panelHeading">
        <div>
          <p className="eyebrow">Multiempresa</p>
          <h2>Clientes de la agencia</h2>
        </div>
        <button className="primaryButton" onClick={onCreate}>
          <Building2 size={18} />
          Crear empresa
        </button>
      </div>
      <div className="clientGrid">
        {workspaces.map((workspace) => (
          <button
            className={`clientCard ${workspace.id === selectedWorkspaceId ? "selectedClient" : ""}`}
            key={workspace.id}
            onClick={() => onSelect(workspace.id)}
          >
            <div className="rowBetween">
              <div className="avatar">{initials(workspace.name)}</div>
              <span className="statusPill">{workspace.health}% salud</span>
            </div>
            <strong>{workspace.name}</strong>
            <span>{workspace.industry}</span>
            <small>{workspace.phone} - {workspace.owner}</small>
            <div className="leadSummary compact">
              <SummaryItem label="WhatsApp" value={statusLabel(workspace.whatsappStatus)} />
              <SummaryItem label="Meta" value={statusLabel(workspace.metaStatus)} />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function PipelineView({
  conversations,
  pipelineStages,
  onMove,
  onOpen,
  onRenameStage,
  onResetStages,
}: {
  conversations: Conversation[];
  pipelineStages: PipelineStageConfig[];
  onMove: (conversationId: string, stage: Conversation["stage"]) => void;
  onOpen: (conversation: Conversation) => void;
  onRenameStage: (stageId: Conversation["stage"], label: string) => void;
  onResetStages: () => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Conversation["stage"] | null>(null);

  useEffect(() => {
    function preventBrowserDrop(event: DragEvent) {
      if (event.dataTransfer?.types.includes("application/x-jp-lead")) {
        event.preventDefault();
      }
    }

    window.addEventListener("dragover", preventBrowserDrop);
    window.addEventListener("drop", preventBrowserDrop);

    return () => {
      window.removeEventListener("dragover", preventBrowserDrop);
      window.removeEventListener("drop", preventBrowserDrop);
    };
  }, []);

  function finishDrop(stage: Conversation["stage"], droppedId?: string) {
    const conversationId = droppedId || draggingId;

    if (!conversationId) return;

    const draggedConversation = conversations.find((conversation) => conversation.id === conversationId);
    setDraggingId(null);
    setDragOverStage(null);

    if (draggedConversation && draggedConversation.stage !== stage) {
      onMove(conversationId, stage);
    }
  }

  return (
    <section className="widePanel">
      <PanelHeading eyebrow="Ventas" title="Pipeline por etapa" />
      <div className="stageEditor" aria-label="Editar etapas del pipeline">
        <strong>Etapas</strong>
        {pipelineStages.map((stage) => (
          <label key={stage.id}>
            <span className={`stageDot ${stage.color}`} />
            <input
              value={stage.label}
              onChange={(event) => onRenameStage(stage.id, event.target.value)}
              aria-label={`Nombre de etapa ${stage.label}`}
            />
          </label>
        ))}
        <button className="miniButton" onClick={onResetStages}>
          Restaurar
        </button>
      </div>
      <div className="kanbanGrid">
        {pipelineStages.map((stage) => {
          const stageConversations = conversations.filter((conversation) => conversation.stage === stage.id);
          const amount = stageConversations.reduce((total, conversation) => total + conversation.estimatedValue, 0);

          return (
            <article
              className={`kanbanColumn ${dragOverStage === stage.id ? "dropActive" : ""}`}
              key={stage.id}
              onDragOver={(event) => {
                if (event.dataTransfer.types.includes("application/x-jp-lead")) {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (dragOverStage !== stage.id) {
                    setDragOverStage(stage.id);
                  }
                }
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setDragOverStage(null);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                const droppedId =
                  event.dataTransfer.getData("application/x-jp-lead") ||
                  event.dataTransfer.getData("text/plain");
                finishDrop(stage.id, droppedId);
              }}
            >
              <div className="kanbanHeader">
                <div className={`stageDot ${stage.color}`} />
                <strong>{stage.label}</strong>
                <span>{stageConversations.length}</span>
              </div>
              <small>{money(amount)} estimados</small>
              {stageConversations.map((conversation) => (
                <div
                  className={`dealCard draggableDeal ${draggingId === conversation.id ? "dragging" : ""}`}
                  draggable
                  key={conversation.id}
                  title="Arrastra esta tarjeta para mover el lead"
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("application/x-jp-lead", conversation.id);
                    setDraggingId(conversation.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOverStage(null);
                  }}
                >
                  <div className="dealCardHeader">
                    <span className="dragHandle" aria-hidden="true">
                      <GripVertical size={15} />
                    </span>
                    <strong>{conversation.contactName}</strong>
                  </div>
                  <span>{conversation.intent}</span>
                  <div className="rowBetween">
                    <small>{sourceLabel(conversation.source)}</small>
                    <b>{money(conversation.estimatedValue)}</b>
                  </div>
                  <div className="cardActions">
                    <button onClick={() => onOpen(conversation)}>
                      <Eye size={15} />
                      Ver
                    </button>
                    <select
                      value={conversation.stage}
                      onChange={(event) => onMove(conversation.id, event.target.value as Conversation["stage"])}
                      aria-label={`Mover a etapa ${conversation.contactName}`}
                    >
                      {pipelineStages.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ContactsView({
  conversations,
  customers,
  onOpen,
  onEdit,
  onDelete,
}: {
  conversations: Conversation[];
  customers: Customer[];
  onOpen: (conversation: Conversation) => void;
  onEdit: (conversation: Conversation) => void;
  onDelete: (conversationId: string) => void;
}) {
  return (
    <section className="widePanel">
      <PanelHeading eyebrow="Base de datos" title="Contactos y leads" />
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Contacto</th>
              <th>Telefono</th>
              <th>Etiqueta</th>
              <th>Origen</th>
              <th>Responsable</th>
              <th>Proxima accion</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  <strong>{customer.contactName}</strong>
                  <br />
                  <small>{customer.companyName}</small>
                </td>
                <td>{customer.phone}</td>
                <td>
                  <span className="statusPill">{leadStatusLabel(customer.status)}</span>
                </td>
                <td>{customer.source}</td>
                <td>{customer.owner}</td>
                <td>{relativeTime(customer.updatedAt)}</td>
                <td>
                  <span className="statusPill">CRM</span>
                </td>
              </tr>
            ))}
            {conversations.map((conversation) => (
              <tr key={conversation.id}>
                <td>
                  <strong>{conversation.contactName}</strong>
                </td>
                <td>{conversation.contactPhone}</td>
                <td>
                  <span className="statusPill">{stageLabel(conversation.stage)}</span>
                </td>
                <td>{sourceLabel(conversation.source)}</td>
                <td>{conversation.owner}</td>
                <td>{relativeTime(conversation.lastMessageAt)}</td>
                <td>
                  <div className="tableActions">
                    <button onClick={() => onOpen(conversation)} aria-label={`Ver ${conversation.contactName}`}>
                      <Eye size={15} />
                    </button>
                    <button onClick={() => onEdit(conversation)} aria-label={`Editar ${conversation.contactName}`}>
                      <Edit3 size={15} />
                    </button>
                    <button onClick={() => onDelete(conversation.id)} aria-label={`Eliminar ${conversation.contactName}`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TasksView({
  activities,
  customers,
  conversations,
  onCreate,
  onComplete,
  onOpenConversation,
}: {
  activities: Activity[];
  customers: Customer[];
  conversations: Conversation[];
  onCreate: () => void;
  onComplete: (activityId: string) => void;
  onOpenConversation: (conversation: Conversation) => void;
}) {
  const followUps = conversations
    .filter((conversation) => conversation.stage === "follow_up" || conversation.unreadCount > 0)
    .slice(0, 6);

  return (
    <section className="widePanel">
      <div className="panelHeading">
        <div>
          <p className="eyebrow">Seguimiento</p>
          <h2>Tareas y proximas acciones</h2>
        </div>
        <button className="primaryButton" onClick={onCreate}>
          <CalendarClock size={18} />
          Nueva tarea
        </button>
      </div>
      <div className="taskGrid">
        {activities.map((activity) => {
          const customer = customers.find((item) => item.id === activity.customerId);
          return (
            <article className="taskCard" key={activity.id}>
              <span className={activity.completedAt ? "inactiveBadge" : "activeBadge"}>
                {activity.completedAt ? "Completada" : taskState(activity.dueDate)}
              </span>
              <strong>{activity.title}</strong>
              <p>{customer?.contactName ?? "Lead CRM"} - {activity.notes ?? "Sin notas internas"}</p>
              <small>{activity.dueDate ? new Date(activity.dueDate).toLocaleDateString("es-EC") : "Sin fecha"}</small>
              {!activity.completedAt && (
                <button className="miniButton" onClick={() => onComplete(activity.id)}>
                  <CheckCircle2 size={15} />
                  Completar
                </button>
              )}
            </article>
          );
        })}
        {followUps.map((conversation) => (
          <article className="taskCard" key={conversation.id}>
            <span className="activeBadge">WhatsApp pendiente</span>
            <strong>Responder a {conversation.contactName}</strong>
            <p>{conversation.intent}</p>
            <small>{relativeTime(conversation.lastMessageAt)}</small>
            <button className="miniButton" onClick={() => onOpenConversation(conversation)}>
              <Inbox size={15} />
              Abrir chat
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function CampaignsView({
  sources,
  onOpenSource,
}: {
  sources: CampaignSource[];
  onOpenSource: (source: CampaignSource) => void;
}) {
  return (
    <section className="widePanel">
      <PanelHeading eyebrow="Meta y organico" title="Fuentes de adquisicion" />
      <div className="sourceGrid">
        {sources.map((source) => (
          <article className="sourceCard" key={source.id}>
            <Megaphone size={20} />
            <strong>{source.name}</strong>
            <div className="sourceMetrics">
              <SummaryItem label="Leads" value={`${source.leads}`} />
              <SummaryItem label="CPL" value={money(source.costPerLead)} />
              <SummaryItem label="Conversion" value={`${source.conversionRate}%`} />
              <SummaryItem label="Gasto" value={money(source.spend)} />
            </div>
            <button className="miniButton" onClick={() => onOpenSource(source)}>
              <Filter size={15} />
              Filtrar leads
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function AutomationsView({
  automations,
  onToggle,
}: {
  automations: AutomationRule[];
  onToggle: (automation: AutomationRule) => void;
}) {
  return (
    <section className="widePanel">
      <PanelHeading eyebrow="Reglas" title="Automatizaciones comerciales" />
      <div className="automationGrid">
        {automations.map((automation) => (
          <article className="automationCard" key={automation.id}>
            <div className="automationIcon">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="rowBetween">
                <strong>{automation.name}</strong>
                <span className={automation.active ? "activeBadge" : "inactiveBadge"}>
                  {automation.active ? "Activa" : "Pausada"}
                </span>
              </div>
              <p>{automation.trigger}</p>
              <span>{automation.action}</span>
              <button className="miniButton" onClick={() => onToggle(automation)}>
                <Sparkles size={15} />
                {automation.active ? "Pausar" : "Activar"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function IntegrationsView({
  integrations,
  onConnect,
}: {
  integrations: IntegrationConnection[];
  onConnect: () => void;
}) {
  return (
    <section className="widePanel">
      <PanelHeading eyebrow="Conexiones" title="Integraciones por cliente" />
      <div className="integrationGrid">
        {integrations.map((integration) => (
          <article className="integrationCard" key={integration.id}>
            <div className="rowBetween">
              <PlugZap size={20} />
              <span className="statusPill">{integrationStatusLabel(integration.status)}</span>
            </div>
            <strong>{providerLabel(integration.provider)}</strong>
            <p>{integration.capabilities.join(", ")}</p>
            <div className="progressTrack">
              <div style={{ width: integrationQuality(integration.status) }} />
            </div>
            <small>Calidad de conexion {integrationQuality(integration.status)}</small>
            <button className="miniButton" onClick={onConnect}>
              <PlugZap size={15} />
              Configurar
            </button>
          </article>
        ))}
      </div>
      <div className="apiPanel">
        <LayoutDashboard size={20} />
        <div>
          <strong>Endpoints activos</strong>
          <span>
            /api/webhooks/whatsapp, /api/webhooks/meta-leads, /api/crm/customers,
            /api/crm/conversations, /api/crm/deals
          </span>
        </div>
      </div>
    </section>
  );
}

function SettingsView({
  workspace,
  integrations,
  pipelineStages,
  themeMode,
  onThemeChange,
  onEdit,
}: {
  workspace: Workspace;
  integrations: IntegrationConnection[];
  pipelineStages: PipelineStageConfig[];
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onEdit: () => void;
}) {
  return (
    <section className="settingsGrid">
      <article className="widePanel">
        <div className="panelHeading">
          <div>
            <p className="eyebrow">Empresa activa</p>
            <h2>Configuracion del cliente</h2>
          </div>
          <button className="secondaryButton" onClick={onEdit}>
            <Edit3 size={18} />
            Editar
          </button>
        </div>
        <div className="settingsList">
          <SummaryItem label="Nombre comercial" value={workspace.name} />
          <SummaryItem label="Industria" value={workspace.industry} />
          <SummaryItem label="WhatsApp conectado" value={statusLabel(workspace.whatsappStatus)} />
          <SummaryItem label="Cuenta Meta" value={statusLabel(workspace.metaStatus)} />
          <SummaryItem label="Horario de atencion" value="Lun-Vie 09:00 a 18:00" />
          <SummaryItem label="SLA" value={`${workspace.responseSlaMinutes} min`} />
        </div>
        <div className="preferenceBlock">
          <div>
            <strong>Apariencia del CRM</strong>
            <span>Elige el modo visual para esta estacion de trabajo.</span>
          </div>
          <ThemeSwitch themeMode={themeMode} onThemeChange={onThemeChange} />
        </div>
      </article>

      <article className="widePanel">
        <div className="panelHeading">
          <div>
            <p className="eyebrow">Operativo</p>
            <h2>Plantillas, etiquetas y embudo</h2>
          </div>
          <button className="secondaryButton" onClick={onEdit}>
            <Settings size={18} />
            Gestionar
          </button>
        </div>
        <div className="settingsList">
          <SummaryItem label="Etiquetas" value="Caliente, Cotizando, Cita, Recontactar" />
          <SummaryItem label="Respuestas rapidas" value="Bienvenida, Precio, Horarios, Ubicacion" />
          <SummaryItem label="Plantillas WhatsApp" value="bienvenida_lead, recordatorio_cita" />
          <SummaryItem label="Usuarios asignados" value="Admin agencia, asesor comercial, cliente visualizador" />
        </div>
        <div className="stageList">
          {pipelineStages.map((stage) => (
            <span className="statusPill" key={stage.id}>{stage.label}</span>
          ))}
        </div>
      </article>

      <article className="widePanel fullSettings">
        <div className="panelHeading">
          <div>
            <p className="eyebrow">Preparado para APIs reales</p>
            <h2>Conexiones tecnicas</h2>
          </div>
          <button className="secondaryButton" onClick={onEdit}>
            <PlugZap size={18} />
            Conectar
          </button>
        </div>
        <div className="integrationGrid">
          {integrations.map((integration) => (
            <article className="integrationCard" key={integration.id}>
              <strong>{providerLabel(integration.provider)}</strong>
              <p>{integration.capabilities.join(", ")}</p>
              <span className="statusPill">{integrationStatusLabel(integration.status)}</span>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

function ThemeSwitch({
  themeMode,
  onThemeChange,
}: {
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
}) {
  return (
    <div className="themeSwitch" role="group" aria-label="Modo de color del CRM">
      <button
        className={themeMode === "light" ? "active" : ""}
        type="button"
        onClick={() => onThemeChange("light")}
      >
        <Sun size={15} />
        Claro
      </button>
      <button
        className={themeMode === "dark" ? "active" : ""}
        type="button"
        onClick={() => onThemeChange("dark")}
      >
        <Moon size={15} />
        Oscuro
      </button>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function relativeTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));

  if (minutes < 2) return "Ahora";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;

  return date.toLocaleDateString("es-EC", { day: "2-digit", month: "short" });
}

function sourceLabel(source: Conversation["source"]) {
  return sourceOptions.find((option) => option.value === source)?.label ?? source;
}

function stageLabel(stage: Conversation["stage"]) {
  const labels: Record<Conversation["stage"], string> = {
    new_lead: "Nuevo lead",
    contacted: "Contactado",
    follow_up: "Seguimiento",
    appointment_scheduled: "Cita agendada",
    won: "Ganado",
    lost: "Perdido",
  };

  return labels[stage];
}

function leadStatusLabel(status: Customer["status"]) {
  const labels: Record<Customer["status"], string> = {
    new: "Nuevo",
    contacted: "Contactado",
    qualified: "Interesado",
    proposal: "En seguimiento",
    won: "Cerrado ganado",
    lost: "Cerrado perdido",
  };

  return labels[status];
}

function taskState(dueDate?: string) {
  if (!dueDate) return "Pendiente";
  return new Date(dueDate).getTime() < Date.now() ? "Vencida" : "Pendiente";
}

function statusLabel(status: Workspace["metaStatus"]) {
  const labels: Record<Workspace["metaStatus"], string> = {
    connected: "Conectado",
    pending: "Pendiente",
    disconnected: "Desconectado",
  };

  return labels[status];
}

function integrationStatusLabel(status: IntegrationConnection["status"]) {
  const labels: Record<IntegrationConnection["status"], string> = {
    ready: "Listo",
    partial: "Parcial",
    pending: "Pendiente",
    error: "Error",
  };

  return labels[status];
}

function providerLabel(provider: IntegrationConnection["provider"]) {
  const labels: Record<IntegrationConnection["provider"], string> = {
    whatsapp_cloud_api: "WhatsApp Cloud API",
    meta_lead_ads: "Meta Lead Ads",
    instagram_graph: "Instagram Graph",
    google_calendar: "Google Calendar",
  };

  return labels[provider];
}

function integrationQuality(status: IntegrationConnection["status"]) {
  const values: Record<IntegrationConnection["status"], string> = {
    ready: "100%",
    partial: "72%",
    pending: "8%",
    error: "0%",
  };

  return values[status];
}
