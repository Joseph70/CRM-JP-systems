"use client";

import {
  Bot,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Copy,
  Edit3,
  Filter,
  Inbox,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Moon,
  MoreHorizontal,
  PhoneCall,
  PlugZap,
  Plus,
  Save,
  Search,
  Send,
  Settings,
  Sparkles,
  Sun,
  Tags,
  Trash2,
  UserRoundPlus,
  UsersRound,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { type CSSProperties, useEffect, useMemo, useState } from "react";

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
type Stage = "new_lead" | "contacted" | "follow_up" | "appointment_scheduled" | "won" | "lost";
type Source = "meta_ads" | "instagram_organic" | "facebook_organic" | "web_form" | "manual";
type Priority = "hot" | "warm" | "cold";

type WorkspaceTheme = {
  primary: string;
  accent: string;
  soft: string;
};

type Workspace = {
  id: string;
  name: string;
  industry: string;
  owner: string;
  phone: string;
  responseSlaMinutes: number;
  whatsappStatus: "connected" | "pending" | "disconnected";
  metaStatus: "connected" | "partial" | "pending" | "disconnected";
  theme: WorkspaceTheme;
  stageLabels: Record<Stage, string>;
};

type Message = {
  id: string;
  direction: "inbound" | "outbound" | "system";
  body: string;
  status: string;
  sentAt: string;
};

type Lead = {
  id: string;
  workspaceId: string;
  contactName: string;
  whatsappName: string;
  phone: string;
  source: Source;
  stage: Stage;
  priority: Priority;
  owner: string;
  service: string;
  location: string;
  desiredStartDate: string;
  desiredEndDate: string;
  budget: number;
  tags: string[];
  notes: string;
  unreadCount: number;
  lastMessageAt: string;
  messages: Message[];
};

type Task = {
  id: string;
  workspaceId: string;
  leadId?: string;
  title: string;
  dueDate: string;
  type: "follow_up" | "call" | "appointment" | "document";
  completed: boolean;
};

type Campaign = {
  id: string;
  workspaceId: string;
  name: string;
  source: Source;
  leads: number;
  spend: number;
  conversion: number;
};

type Automation = {
  id: string;
  workspaceId: string;
  name: string;
  trigger: string;
  action: string;
  active: boolean;
};

type Integration = {
  id: string;
  workspaceId: string;
  name: string;
  status: "ready" | "partial" | "pending";
  description: string;
};

type LeadForm = {
  contactName: string;
  whatsappName: string;
  phone: string;
  source: Source;
  service: string;
  location: string;
  desiredStartDate: string;
  desiredEndDate: string;
  budget: string;
  notes: string;
  priority: Priority;
  owner: string;
};

const defaultStageLabels: Record<Stage, string> = {
  new_lead: "Nuevo lead",
  contacted: "Contactado",
  follow_up: "Seguimiento",
  appointment_scheduled: "Cita agendada",
  won: "Ganado",
  lost: "Perdido",
};

const stageOrder: Stage[] = ["new_lead", "contacted", "follow_up", "appointment_scheduled", "won", "lost"];

const sourceLabels: Record<Source, string> = {
  meta_ads: "Meta Ads",
  instagram_organic: "Instagram",
  facebook_organic: "Facebook",
  web_form: "Formulario",
  manual: "Manual",
};

const sourceOptions: Source[] = ["meta_ads", "instagram_organic", "facebook_organic", "web_form", "manual"];
const owners = ["JP Admin", "Asesor ventas", "Operador WhatsApp", "Cliente visualizador"];

const emptyLeadForm: LeadForm = {
  contactName: "",
  whatsappName: "",
  phone: "",
  source: "meta_ads",
  service: "",
  location: "",
  desiredStartDate: "",
  desiredEndDate: "",
  budget: "0",
  notes: "",
  priority: "warm",
  owner: "JP Admin",
};

const initialWorkspaces: Workspace[] = [
  {
    id: "terra-travel",
    name: "Terra Travel Studio",
    industry: "Viajes, vuelos y visas",
    owner: "JP Sistems",
    phone: "+593 99 884 2210",
    responseSlaMinutes: 6,
    whatsappStatus: "connected",
    metaStatus: "connected",
    theme: { primary: "#8b102c", accent: "#e11d48", soft: "#fff1f4" },
    stageLabels: { ...defaultStageLabels },
  },
  {
    id: "nova-fit",
    name: "Nova Fit Center",
    industry: "Gimnasio premium",
    owner: "JP Sistems",
    phone: "+593 98 117 4402",
    responseSlaMinutes: 8,
    whatsappStatus: "pending",
    metaStatus: "partial",
    theme: { primary: "#991b1b", accent: "#ef4444", soft: "#fff1f2" },
    stageLabels: { ...defaultStageLabels, appointment_scheduled: "Clase agendada" },
  },
];

const now = new Date();

const initialLeads: Lead[] = [
  {
    id: "lead-001",
    workspaceId: "terra-travel",
    contactName: "Maria Torres",
    whatsappName: "Maria T.",
    phone: "+593 99 123 4567",
    source: "meta_ads",
    stage: "new_lead",
    priority: "hot",
    owner: "Asesor ventas",
    service: "Visa Estados Unidos B1/B2",
    location: "Quito",
    desiredStartDate: "2026-07-12",
    desiredEndDate: "2026-08-03",
    budget: 420,
    tags: ["Visa", "Urgente", "Meta"],
    notes: "Tiene entrevista tentativa y necesita checklist de documentos.",
    unreadCount: 2,
    lastMessageAt: now.toISOString(),
    messages: [
      { id: "msg-001", direction: "inbound", body: "Hola, vi el anuncio para visa americana.", status: "received", sentAt: now.toISOString() },
      { id: "msg-002", direction: "inbound", body: "Quiero saber requisitos y costo total.", status: "received", sentAt: now.toISOString() },
    ],
  },
  {
    id: "lead-002",
    workspaceId: "terra-travel",
    contactName: "Carlos Vera",
    whatsappName: "Carlos",
    phone: "+593 98 778 1122",
    source: "instagram_organic",
    stage: "follow_up",
    priority: "warm",
    owner: "JP Admin",
    service: "Vuelo Guayaquil - Madrid",
    location: "Guayaquil",
    desiredStartDate: "2026-09-10",
    desiredEndDate: "2026-10-01",
    budget: 980,
    tags: ["Vuelo", "Europa"],
    notes: "Comparar tarifa flexible y equipaje incluido.",
    unreadCount: 0,
    lastMessageAt: new Date(now.getTime() - 1000 * 60 * 45).toISOString(),
    messages: [
      { id: "msg-003", direction: "inbound", body: "Busco vuelos a Madrid para septiembre.", status: "received", sentAt: now.toISOString() },
      { id: "msg-004", direction: "outbound", body: "Te reviso opciones con maleta y cambio flexible.", status: "sent", sentAt: now.toISOString() },
    ],
  },
  {
    id: "lead-003",
    workspaceId: "nova-fit",
    contactName: "Andrea Molina",
    whatsappName: "Andre",
    phone: "+593 97 555 8800",
    source: "meta_ads",
    stage: "contacted",
    priority: "hot",
    owner: "Operador WhatsApp",
    service: "Plan mensual premium",
    location: "Cumbaya",
    desiredStartDate: "2026-06-15",
    desiredEndDate: "",
    budget: 180,
    tags: ["Fitness", "Lead Ads"],
    notes: "Quiere clase de prueba y planes para pareja.",
    unreadCount: 1,
    lastMessageAt: now.toISOString(),
    messages: [{ id: "msg-005", direction: "inbound", body: "Hola, quiero saber los planes mensuales.", status: "received", sentAt: now.toISOString() }],
  },
];

const initialTasks: Task[] = [
  { id: "task-001", workspaceId: "terra-travel", leadId: "lead-001", title: "Enviar checklist de visa", dueDate: "2026-06-05", type: "document", completed: false },
  { id: "task-002", workspaceId: "terra-travel", leadId: "lead-002", title: "Cotizar 3 vuelos con maleta", dueDate: "2026-06-04", type: "follow_up", completed: false },
  { id: "task-003", workspaceId: "nova-fit", leadId: "lead-003", title: "Confirmar clase de prueba", dueDate: "2026-06-06", type: "appointment", completed: false },
];

const initialCampaigns: Campaign[] = [
  { id: "camp-001", workspaceId: "terra-travel", name: "Visa USA - Click a WhatsApp", source: "meta_ads", leads: 34, spend: 132, conversion: 28 },
  { id: "camp-002", workspaceId: "terra-travel", name: "Reels vuelos Europa", source: "instagram_organic", leads: 18, spend: 0, conversion: 17 },
  { id: "camp-003", workspaceId: "nova-fit", name: "Plan premium Meta", source: "meta_ads", leads: 21, spend: 74, conversion: 22 },
];

const initialAutomations: Automation[] = [
  { id: "auto-001", workspaceId: "terra-travel", name: "Salesbot bienvenida", trigger: "Nuevo lead de Meta", action: "Enviar plantilla aprobada y pedir servicio", active: true },
  { id: "auto-002", workspaceId: "terra-travel", name: "Seguimiento 4 horas", trigger: "Sin respuesta del lead", action: "Mensaje suave + tarea para asesor", active: true },
  { id: "auto-003", workspaceId: "nova-fit", name: "Clase de prueba", trigger: "Lead contactado", action: "Enviar horarios disponibles", active: true },
];

const initialIntegrations: Integration[] = [
  { id: "int-001", workspaceId: "terra-travel", name: "WhatsApp Cloud API", status: "ready", description: "Webhooks, plantillas y envio por numero del cliente." },
  { id: "int-002", workspaceId: "terra-travel", name: "Meta Lead Ads", status: "ready", description: "Formularios, campanas click-to-message y origen por anuncio." },
  { id: "int-003", workspaceId: "nova-fit", name: "WhatsApp Cloud API", status: "partial", description: "Pendiente validar numero y plantillas." },
];

const navItems: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Resumen", icon: LayoutDashboard },
  { id: "clients", label: "Empresas", icon: Building2 },
  { id: "inbox", label: "Bandeja", icon: Inbox },
  { id: "pipeline", label: "Pipeline", icon: Workflow },
  { id: "contacts", label: "Contactos", icon: UsersRound },
  { id: "tasks", label: "Tareas", icon: CalendarClock },
  { id: "campaigns", label: "Campanas", icon: Megaphone },
  { id: "automations", label: "Salesbot", icon: Bot },
  { id: "integrations", label: "Integraciones", icon: PlugZap },
  { id: "settings", label: "Configuracion", icon: Settings },
];

const panel = "rounded-lg border border-[var(--line)] bg-[var(--surface)] shadow-calm";
const input =
  "h-9 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--brand-soft)]";
const textArea =
  "min-h-20 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--brand-soft)]";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [activeView, setActiveView] = useState<View>("inbox");
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(initialWorkspaces[0].id);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeads[0].id);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [automations, setAutomations] = useState<Automation[]>(initialAutomations);
  const [integrations] = useState<Integration[]>(initialIntegrations);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<Source | "all">("all");
  const [messageDraft, setMessageDraft] = useState("");
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [leadForm, setLeadForm] = useState<LeadForm>(emptyLeadForm);
  const [companyForm, setCompanyForm] = useState({
    name: "",
    industry: "",
    owner: "JP Sistems",
    phone: "",
    responseSlaMinutes: "8",
  });
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("jp-crm-tailwind-state-v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          themeMode?: ThemeMode;
          workspaces?: Workspace[];
          selectedWorkspaceId?: string;
          leads?: Lead[];
          selectedLeadId?: string;
          tasks?: Task[];
          campaigns?: Campaign[];
          automations?: Automation[];
        };
        if (parsed.themeMode) setThemeMode(parsed.themeMode);
        if (parsed.workspaces?.length) setWorkspaces(parsed.workspaces);
        if (parsed.selectedWorkspaceId) setSelectedWorkspaceId(parsed.selectedWorkspaceId);
        if (parsed.leads?.length) setLeads(parsed.leads);
        if (parsed.selectedLeadId) setSelectedLeadId(parsed.selectedLeadId);
        if (parsed.tasks?.length) setTasks(parsed.tasks);
        if (parsed.campaigns?.length) setCampaigns(parsed.campaigns);
        if (parsed.automations?.length) setAutomations(parsed.automations);
      } catch {
        window.localStorage.removeItem("jp-crm-tailwind-state-v1");
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      "jp-crm-tailwind-state-v1",
      JSON.stringify({ themeMode, workspaces, selectedWorkspaceId, leads, selectedLeadId, tasks, campaigns, automations }),
    );
  }, [automations, campaigns, hydrated, leads, selectedLeadId, selectedWorkspaceId, tasks, themeMode, workspaces]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const workspace = useMemo(
    () => workspaces.find((item) => item.id === selectedWorkspaceId) ?? workspaces[0],
    [selectedWorkspaceId, workspaces],
  );

  const workspaceLeads = useMemo(() => leads.filter((lead) => lead.workspaceId === workspace.id), [leads, workspace.id]);
  const workspaceTasks = useMemo(() => tasks.filter((task) => task.workspaceId === workspace.id), [tasks, workspace.id]);
  const workspaceCampaigns = useMemo(() => campaigns.filter((campaign) => campaign.workspaceId === workspace.id), [campaigns, workspace.id]);
  const workspaceAutomations = useMemo(() => automations.filter((automation) => automation.workspaceId === workspace.id), [automations, workspace.id]);
  const workspaceIntegrations = useMemo(() => integrations.filter((integration) => integration.workspaceId === workspace.id), [integrations, workspace.id]);

  const visibleLeads = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return workspaceLeads.filter((lead) => {
      const matchesSearch =
        !term ||
        [lead.contactName, lead.whatsappName, lead.phone, lead.service, lead.location, lead.tags.join(" "), sourceLabels[lead.source]]
          .join(" ")
          .toLowerCase()
          .includes(term);
      const matchesStage = stageFilter === "all" || lead.stage === stageFilter;
      const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
      return matchesSearch && matchesStage && matchesSource;
    });
  }, [searchTerm, sourceFilter, stageFilter, workspaceLeads]);

  const selectedLead = useMemo(
    () => workspaceLeads.find((lead) => lead.id === selectedLeadId) ?? workspaceLeads[0],
    [selectedLeadId, workspaceLeads],
  );

  const stats = useMemo(() => {
    const pipelineValue = workspaceLeads.reduce((total, lead) => total + lead.budget, 0);
    const unread = workspaceLeads.reduce((total, lead) => total + lead.unreadCount, 0);
    const hot = workspaceLeads.filter((lead) => lead.priority === "hot").length;
    const pendingTasks = workspaceTasks.filter((task) => !task.completed).length;
    return { pipelineValue, unread, hot, pendingTasks };
  }, [workspaceLeads, workspaceTasks]);

  const workspaceStyle = useMemo(() => buildWorkspaceStyle(workspace.theme), [workspace.theme]);

  function switchWorkspace(workspaceId: string) {
    const nextLead = leads.find((lead) => lead.workspaceId === workspaceId);
    setSelectedWorkspaceId(workspaceId);
    setSelectedLeadId(nextLead?.id ?? "");
    setSearchTerm("");
    setStageFilter("all");
    setSourceFilter("all");
  }

  function openNewLeadModal() {
    setEditingLeadId(null);
    setLeadForm(emptyLeadForm);
    setLeadModalOpen(true);
  }

  function openEditLeadModal(lead: Lead) {
    setEditingLeadId(lead.id);
    setLeadForm({
      contactName: lead.contactName,
      whatsappName: lead.whatsappName,
      phone: lead.phone,
      source: lead.source,
      service: lead.service,
      location: lead.location,
      desiredStartDate: lead.desiredStartDate,
      desiredEndDate: lead.desiredEndDate,
      budget: String(lead.budget),
      notes: lead.notes,
      priority: lead.priority,
      owner: lead.owner,
    });
    setLeadModalOpen(true);
  }

  function saveLead() {
    const contactName = leadForm.contactName.trim();
    const phone = leadForm.phone.trim();
    const service = leadForm.service.trim();
    if (!contactName || !phone || !service) {
      setToast("Completa nombre, WhatsApp y servicio.");
      return;
    }

    const payload = {
      contactName,
      whatsappName: leadForm.whatsappName.trim() || contactName,
      phone,
      source: leadForm.source,
      service,
      location: leadForm.location.trim(),
      desiredStartDate: leadForm.desiredStartDate,
      desiredEndDate: leadForm.desiredEndDate,
      budget: Number(leadForm.budget || 0),
      notes: leadForm.notes.trim(),
      priority: leadForm.priority,
      owner: leadForm.owner,
    };

    if (editingLeadId) {
      setLeads((current) => current.map((lead) => (lead.id === editingLeadId ? { ...lead, ...payload } : lead)));
      setToast("Ficha del lead actualizada.");
    } else {
      const lead: Lead = {
        id: `lead-${Date.now()}`,
        workspaceId: workspace.id,
        stage: "new_lead",
        tags: [sourceLabels[payload.source], payload.service.split(" ")[0] || "Lead"],
        unreadCount: 1,
        lastMessageAt: new Date().toISOString(),
        messages: [
          {
            id: `msg-${Date.now()}`,
            direction: "inbound",
            body: payload.notes || `Hola, necesito informacion sobre ${payload.service}.`,
            status: "received",
            sentAt: new Date().toISOString(),
          },
        ],
        ...payload,
      };
      setLeads((current) => [lead, ...current]);
      setSelectedLeadId(lead.id);
      setActiveView("inbox");
      setToast("Lead creado en la bandeja de WhatsApp.");
    }

    setLeadModalOpen(false);
    setLeadForm(emptyLeadForm);
    setEditingLeadId(null);
  }

  function deleteLead(leadId: string) {
    setLeads((current) => current.filter((lead) => lead.id !== leadId));
    setTasks((current) => current.filter((task) => task.leadId !== leadId));
    if (selectedLeadId === leadId) setSelectedLeadId(workspaceLeads.find((lead) => lead.id !== leadId)?.id ?? "");
    setToast("Lead eliminado.");
  }

  function moveLead(leadId: string, stage: Stage) {
    setLeads((current) => current.map((lead) => (lead.id === leadId ? { ...lead, stage } : lead)));
    setToast(`Lead movido a ${workspace.stageLabels[stage]}.`);
  }

  function sendMessage() {
    const body = messageDraft.trim();
    if (!selectedLead || !body) return;
    const message: Message = { id: `msg-${Date.now()}`, direction: "outbound", body, status: "sent", sentAt: new Date().toISOString() };
    setLeads((current) =>
      current.map((lead) =>
        lead.id === selectedLead.id ? { ...lead, messages: [...lead.messages, message], unreadCount: 0, lastMessageAt: message.sentAt } : lead,
      ),
    );
    setMessageDraft("");
  }

  function addQuickMessage(text: string) {
    setMessageDraft(text);
  }

  function createTaskForLead(lead?: Lead, type: Task["type"] = "follow_up") {
    const task: Task = {
      id: `task-${Date.now()}`,
      workspaceId: workspace.id,
      leadId: lead?.id,
      title: lead ? `Dar seguimiento a ${lead.contactName}` : "Nueva tarea comercial",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().slice(0, 10),
      type,
      completed: false,
    };
    setTasks((current) => [task, ...current]);
    setToast("Seguimiento creado.");
  }

  function completeTask(taskId: string) {
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, completed: true } : task)));
  }

  function toggleAutomation(automationId: string) {
    setAutomations((current) =>
      current.map((automation) => (automation.id === automationId ? { ...automation, active: !automation.active } : automation)),
    );
  }

  function updateWorkspaceTheme(partial: Partial<WorkspaceTheme>) {
    setWorkspaces((current) =>
      current.map((item) => (item.id === workspace.id ? { ...item, theme: { ...item.theme, ...partial } } : item)),
    );
  }

  function updateStageLabel(stage: Stage, label: string) {
    setWorkspaces((current) =>
      current.map((item) =>
        item.id === workspace.id ? { ...item, stageLabels: { ...item.stageLabels, [stage]: label || defaultStageLabels[stage] } } : item,
      ),
    );
  }

  function createCompany() {
    const name = companyForm.name.trim();
    if (!name || !companyForm.phone.trim()) {
      setToast("Completa nombre y WhatsApp comercial.");
      return;
    }
    const company: Workspace = {
      id: `ws-${Date.now()}`,
      name,
      industry: companyForm.industry.trim() || "Cliente comercial",
      owner: companyForm.owner.trim() || "JP Sistems",
      phone: companyForm.phone.trim(),
      responseSlaMinutes: Number(companyForm.responseSlaMinutes || 8),
      whatsappStatus: "pending",
      metaStatus: "pending",
      theme: { primary: "#8b102c", accent: "#e11d48", soft: "#fff1f4" },
      stageLabels: { ...defaultStageLabels },
    };
    setWorkspaces((current) => [...current, company]);
    setSelectedWorkspaceId(company.id);
    setSelectedLeadId("");
    setCompanyModalOpen(false);
    setCompanyForm({ name: "", industry: "", owner: "JP Sistems", phone: "", responseSlaMinutes: "8" });
    setActiveView("settings");
  }

  function copyPhone(phone: string) {
    navigator.clipboard?.writeText(phone).catch(() => undefined);
    setToast("Telefono copiado.");
  }

  return (
    <main
      data-theme={themeMode}
      style={workspaceStyle}
      className="min-h-screen bg-[var(--app-bg)] text-[var(--ink)]"
    >
      <div className="grid min-h-screen grid-cols-[176px_minmax(0,1fr)] max-lg:grid-cols-1">
        <aside className="sticky top-0 flex h-screen flex-col gap-3 border-r border-[var(--line)] bg-[#18070d] px-2 py-3 text-white max-lg:static max-lg:h-auto max-lg:flex-row max-lg:overflow-x-auto">
          <div className="flex items-center gap-2 px-1">
            <img
              className="h-8 w-8 rounded-lg object-cover"
              src={themeMode === "dark" ? "/brand/jp-logo-dark.png" : "/brand/jp-logo-light.png"}
              alt="JP Sistems"
            />
            <div className="min-w-0 max-lg:hidden">
              <strong className="block truncate text-sm">JP CRM</strong>
              <span className="block text-[11px] text-rose-100/70">WhatsApp + Meta</span>
            </div>
          </div>

          <nav className="grid gap-1 max-lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={cn(
                    "flex h-8 items-center gap-2 rounded-lg px-2 text-left text-xs font-bold transition",
                    active ? "bg-white text-[#7f102b]" : "text-rose-50/80 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 p-3">
          <header className="mb-3 grid grid-cols-[minmax(210px,280px)_minmax(260px,1fr)_auto] items-end gap-2 max-xl:grid-cols-1">
            <label className="grid gap-1 text-[11px] font-black uppercase text-[var(--muted)]">
              Cliente activo
              <div className="relative">
                <select className={cn(input, "appearance-none pr-8 font-bold")} value={workspace.id} onChange={(event) => switchWorkspace(event.target.value)}>
                  {workspaces.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-2.5 text-[var(--muted)]" size={16} />
              </div>
            </label>

            <label className="relative">
              <Search className="absolute left-3 top-2.5 text-[var(--muted)]" size={16} />
              <input
                className={cn(input, "pl-9")}
                placeholder="Buscar por nombre, WhatsApp, servicio, etiqueta o ciudad"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <div className="flex items-center justify-end gap-2">
              <button
                className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--brand)]"
                onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
                aria-label="Cambiar modo"
              >
                {themeMode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <Button onClick={openNewLeadModal} icon={UserRoundPlus} label="Nuevo lead" />
              <Button variant="secondary" onClick={() => setCompanyModalOpen(true)} icon={Building2} label="Empresa" />
            </div>
          </header>

          <section className={cn(panel, "mb-3 grid grid-cols-[1fr_auto] items-center gap-3 p-3 max-md:grid-cols-1")}>
            <div>
              <p className="text-[11px] font-black uppercase text-[var(--brand)]">Operacion por empresa</p>
              <h1 className="mt-1 text-2xl font-black leading-none">{workspace.name}</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {workspace.industry} · {workspace.phone} · Responsable: {workspace.owner}
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2 max-md:grid-cols-2">
              <Stat label="Leads" value={`${workspaceLeads.length}`} />
              <Stat label="Sin leer" value={`${stats.unread}`} />
              <Stat label="Hot" value={`${stats.hot}`} />
              <Stat label="Pipeline" value={money(stats.pipelineValue)} />
            </div>
          </section>

          {toast && <div className="fixed right-4 top-4 z-50 rounded-lg bg-[#14070b] px-4 py-3 text-sm font-bold text-white shadow-calm">{toast}</div>}

          {activeView === "dashboard" && (
            <DashboardView leads={workspaceLeads} tasks={workspaceTasks} campaigns={workspaceCampaigns} workspace={workspace} />
          )}
          {activeView === "clients" && (
            <ClientsView workspaces={workspaces} selectedWorkspaceId={workspace.id} onSelect={switchWorkspace} onCreate={() => setCompanyModalOpen(true)} />
          )}
          {activeView === "inbox" && (
            <InboxView
              leads={visibleLeads}
              selectedLead={selectedLead}
              workspace={workspace}
              stageFilter={stageFilter}
              sourceFilter={sourceFilter}
              messageDraft={messageDraft}
              onStageFilter={setStageFilter}
              onSourceFilter={setSourceFilter}
              onSelectLead={setSelectedLeadId}
              onMoveLead={moveLead}
              onEditLead={openEditLeadModal}
              onDeleteLead={deleteLead}
              onDraftChange={setMessageDraft}
              onSend={sendMessage}
              onQuickMessage={addQuickMessage}
              onTask={createTaskForLead}
              onCopyPhone={copyPhone}
            />
          )}
          {activeView === "pipeline" && (
            <PipelineView
              leads={visibleLeads}
              workspace={workspace}
              draggedLeadId={draggedLeadId}
              onDragStart={setDraggedLeadId}
              onDrop={(stage) => {
                if (draggedLeadId) moveLead(draggedLeadId, stage);
                setDraggedLeadId(null);
              }}
              onOpen={(lead) => {
                setSelectedLeadId(lead.id);
                setActiveView("inbox");
              }}
              onStageNameChange={updateStageLabel}
            />
          )}
          {activeView === "contacts" && <ContactsView leads={visibleLeads} workspace={workspace} onEdit={openEditLeadModal} onDelete={deleteLead} />}
          {activeView === "tasks" && <TasksView tasks={workspaceTasks} leads={workspaceLeads} onCreate={() => createTaskForLead(selectedLead)} onComplete={completeTask} />}
          {activeView === "campaigns" && <CampaignsView campaigns={workspaceCampaigns} onFilter={(source) => setSourceFilter(source)} />}
          {activeView === "automations" && (
            <AutomationsView automations={workspaceAutomations} workspace={workspace} onToggle={toggleAutomation} />
          )}
          {activeView === "integrations" && <IntegrationsView integrations={workspaceIntegrations} />}
          {activeView === "settings" && (
            <SettingsView
              workspace={workspace}
              onThemeChange={updateWorkspaceTheme}
              onStageNameChange={updateStageLabel}
              onCompanyChange={(partial) =>
                setWorkspaces((current) => current.map((item) => (item.id === workspace.id ? { ...item, ...partial } : item)))
              }
            />
          )}
        </section>
      </div>

      {leadModalOpen && (
        <LeadModal
          form={leadForm}
          editing={Boolean(editingLeadId)}
          onChange={setLeadForm}
          onClose={() => setLeadModalOpen(false)}
          onSave={saveLead}
        />
      )}
      {companyModalOpen && (
        <CompanyModal form={companyForm} onChange={setCompanyForm} onClose={() => setCompanyModalOpen(false)} onSave={createCompany} />
      )}
    </main>
  );
}

function Button({ label, icon: Icon, variant = "primary", onClick }: { label: string; icon: LucideIcon; variant?: "primary" | "secondary"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-black transition",
        variant === "primary"
          ? "bg-[var(--accent)] text-white shadow-calm hover:opacity-90"
          : "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:text-[var(--brand)]",
      )}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2">
      <span className="block text-[11px] font-black uppercase text-[var(--muted)]">{label}</span>
      <strong className="block text-lg leading-tight">{value}</strong>
    </div>
  );
}

function DashboardView({ leads, tasks, campaigns, workspace }: { leads: Lead[]; tasks: Task[]; campaigns: Campaign[]; workspace: Workspace }) {
  const won = leads.filter((lead) => lead.stage === "won").length;
  const conversion = leads.length ? Math.round((won / leads.length) * 100) : 0;
  const slaRisk = leads.filter((lead) => lead.unreadCount > 0).length;
  return (
    <section className="grid grid-cols-[1.35fr_.65fr] gap-3 max-xl:grid-cols-1">
      <div className={cn(panel, "p-3")}>
        <PanelTitle eyebrow="Control comercial" title="Resumen del cliente" />
        <div className="grid grid-cols-4 gap-2 max-lg:grid-cols-2">
          <Stat label="Conversion" value={`${conversion}%`} />
          <Stat label="SLA riesgo" value={`${slaRisk}`} />
          <Stat label="Tareas" value={`${tasks.filter((task) => !task.completed).length}`} />
          <Stat label="Meta" value={statusText(workspace.metaStatus)} />
        </div>
        <div className="mt-3 grid gap-2">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="grid grid-cols-[180px_1fr_60px] items-center gap-3 rounded-lg bg-[var(--surface-muted)] p-2 text-sm">
              <span className="font-bold">{campaign.name}</span>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--brand-soft)]">
                <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(100, campaign.conversion * 2)}%` }} />
              </div>
              <strong>{campaign.leads}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className={cn(panel, "p-3")}>
        <PanelTitle eyebrow="Proximas acciones" title="Agenda WhatsApp" />
        <div className="grid gap-2">
          {tasks.slice(0, 5).map((task) => (
            <TaskCard key={task.id} task={task} lead={leads.find((lead) => lead.id === task.leadId)} onComplete={() => undefined} compact />
          ))}
        </div>
      </div>
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
    <section className={cn(panel, "p-3")}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <PanelTitle eyebrow="Multiempresa" title="Clientes de la agencia" />
        <Button label="Crear empresa" icon={Building2} onClick={onCreate} />
      </div>
      <div className="grid grid-cols-3 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
        {workspaces.map((workspace) => (
          <button
            key={workspace.id}
            onClick={() => onSelect(workspace.id)}
            className={cn(
              "rounded-lg border bg-[var(--surface)] p-3 text-left transition hover:border-[var(--accent)]",
              selectedWorkspaceId === workspace.id ? "border-[var(--accent)] ring-2 ring-[var(--brand-soft)]" : "border-[var(--line)]",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--brand-soft)] font-black text-[var(--brand)]">
                {initials(workspace.name)}
              </div>
              <span className="rounded-full bg-[var(--brand-soft)] px-2 py-1 text-xs font-black text-[var(--brand)]">{statusText(workspace.whatsappStatus)}</span>
            </div>
            <strong className="mt-3 block">{workspace.name}</strong>
            <span className="mt-1 block text-sm text-[var(--muted)]">{workspace.industry}</span>
            <small className="mt-2 block text-[var(--muted)]">{workspace.phone}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function InboxView({
  leads,
  selectedLead,
  workspace,
  stageFilter,
  sourceFilter,
  messageDraft,
  onStageFilter,
  onSourceFilter,
  onSelectLead,
  onMoveLead,
  onEditLead,
  onDeleteLead,
  onDraftChange,
  onSend,
  onQuickMessage,
  onTask,
  onCopyPhone,
}: {
  leads: Lead[];
  selectedLead?: Lead;
  workspace: Workspace;
  stageFilter: Stage | "all";
  sourceFilter: Source | "all";
  messageDraft: string;
  onStageFilter: (stage: Stage | "all") => void;
  onSourceFilter: (source: Source | "all") => void;
  onSelectLead: (leadId: string) => void;
  onMoveLead: (leadId: string, stage: Stage) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onQuickMessage: (value: string) => void;
  onTask: (lead?: Lead, type?: Task["type"]) => void;
  onCopyPhone: (phone: string) => void;
}) {
  return (
    <section className="grid grid-cols-[290px_minmax(360px,1fr)_280px] gap-3 max-2xl:grid-cols-[270px_minmax(360px,1fr)] max-lg:grid-cols-1">
      <div className={cn(panel, "overflow-hidden")}>
        <div className="border-b border-[var(--line)] p-3">
          <PanelTitle eyebrow="WhatsApp" title="Conversaciones" />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <select className={input} value={stageFilter} onChange={(event) => onStageFilter(event.target.value as Stage | "all")}>
              <option value="all">Todas</option>
              {stageOrder.map((stage) => (
                <option key={stage} value={stage}>
                  {workspace.stageLabels[stage]}
                </option>
              ))}
            </select>
            <select className={input} value={sourceFilter} onChange={(event) => onSourceFilter(event.target.value as Source | "all")}>
              <option value="all">Origen</option>
              {sourceOptions.map((source) => (
                <option key={source} value={source}>
                  {sourceLabels[source]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="max-h-[calc(100vh-250px)] overflow-auto">
          {leads.map((lead) => (
            <button
              key={lead.id}
              onClick={() => onSelectLead(lead.id)}
              className={cn(
                "grid w-full grid-cols-[34px_1fr_auto] gap-2 border-b border-[var(--line)] px-3 py-2 text-left hover:bg-[var(--surface-muted)]",
                selectedLead?.id === lead.id && "bg-[var(--brand-soft)]",
              )}
            >
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--surface-muted)] text-xs font-black text-[var(--brand)]">
                {initials(lead.contactName)}
              </div>
              <div className="min-w-0">
                <strong className="block truncate text-sm">{lead.contactName}</strong>
                <p className="truncate text-xs text-[var(--muted)]">{lead.service}</p>
                <span className="text-xs text-[var(--muted)]">{sourceLabels[lead.source]}</span>
              </div>
              {lead.unreadCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--accent)] px-1 text-xs font-black text-white">{lead.unreadCount}</span>}
            </button>
          ))}
          {!leads.length && <div className="p-4 text-sm font-bold text-[var(--muted)]">No hay leads con estos filtros.</div>}
        </div>
      </div>

      <div className={cn(panel, "overflow-hidden")}>
        {selectedLead ? (
          <>
            <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] p-3">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-black">{selectedLead.contactName}</h2>
                <p className="text-sm text-[var(--muted)]">
                  {workspace.stageLabels[selectedLead.stage]} · {selectedLead.owner} · {selectedLead.phone}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <select className={cn(input, "w-40")} value={selectedLead.stage} onChange={(event) => onMoveLead(selectedLead.id, event.target.value as Stage)}>
                  {stageOrder.map((stage) => (
                    <option key={stage} value={stage}>
                      {workspace.stageLabels[stage]}
                    </option>
                  ))}
                </select>
                <IconButton icon={PhoneCall} label="Llamar" onClick={() => onCopyPhone(selectedLead.phone)} />
                <IconButton icon={Edit3} label="Editar" onClick={() => onEditLead(selectedLead)} />
              </div>
            </div>
            <div className="flex min-h-[300px] flex-col gap-2 bg-[var(--surface-muted)] p-3">
              {selectedLead.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[82%] rounded-lg border border-[var(--line)] px-3 py-2 text-sm",
                    message.direction === "outbound"
                      ? "ml-auto bg-[var(--bubble-agent)]"
                      : message.direction === "system"
                        ? "mx-auto bg-[var(--surface)] text-xs text-[var(--muted)]"
                        : "bg-[var(--bubble-user)]",
                  )}
                >
                  {message.body}
                </div>
              ))}
            </div>
            <LeadProfile lead={selectedLead} onEdit={() => onEditLead(selectedLead)} />
            <div className="border-t border-[var(--line)] p-3">
              <div className="mb-2 flex flex-wrap gap-2">
                {[
                  "Hola, gracias por escribirnos. Te ayudo por aqui.",
                  "Te envio requisitos y precio por WhatsApp.",
                  "Puedo agendarte una llamada con un asesor.",
                ].map((reply) => (
                  <button key={reply} className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-bold text-[var(--muted)] hover:text-[var(--brand)]" onClick={() => onQuickMessage(reply)}>
                    {reply}
                  </button>
                ))}
              </div>
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  onSend();
                }}
              >
                <input className={input} placeholder="Responder por WhatsApp o usar plantilla aprobada" value={messageDraft} onChange={(event) => onDraftChange(event.target.value)} />
                <button className="grid h-9 w-10 place-items-center rounded-lg bg-[var(--accent)] text-white" type="submit" aria-label="Enviar">
                  <Send size={16} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="grid min-h-80 place-items-center p-6 text-sm font-bold text-[var(--muted)]">Selecciona un lead.</div>
        )}
      </div>

      <div className={cn(panel, "grid content-start gap-2 p-3 max-2xl:col-span-2 max-lg:col-span-1")}>
        <PanelTitle eyebrow="Acciones" title="Operacion WhatsApp" />
        <ActionButton icon={MessageCircle} label="Enviar plantilla" onClick={() => onQuickMessage("Plantilla aprobada: gracias por escribirnos, necesitamos estos datos para ayudarte.")} />
        <ActionButton icon={CalendarClock} label="Agendar seguimiento" onClick={() => onTask(selectedLead, "follow_up")} />
        <ActionButton icon={CheckCircle2} label="Marcar cita agendada" onClick={() => selectedLead && onMoveLead(selectedLead.id, "appointment_scheduled")} />
        <ActionButton icon={UserRoundPlus} label="Pasar a humano" onClick={() => selectedLead && onTask(selectedLead, "call")} />
        <ActionButton icon={CircleDollarSign} label="Cerrar como ganado" onClick={() => selectedLead && onMoveLead(selectedLead.id, "won")} />
        <ActionButton icon={Trash2} label="Eliminar lead" danger onClick={() => selectedLead && onDeleteLead(selectedLead.id)} />
      </div>
    </section>
  );
}

function LeadProfile({ lead, onEdit }: { lead: Lead; onEdit: () => void }) {
  return (
    <div className="border-t border-[var(--line)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black uppercase text-[var(--brand)]">Ficha del lead</p>
          <strong>{lead.whatsappName || lead.contactName}</strong>
        </div>
        <button onClick={onEdit} className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] px-2 py-1 text-xs font-black text-[var(--muted)]">
          <Edit3 size={13} />
          Editar
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm max-lg:grid-cols-2 max-sm:grid-cols-1">
        <Info label="Nombre WhatsApp" value={lead.whatsappName || lead.contactName} />
        <Info label="Telefono" value={lead.phone} />
        <Info label="Servicio" value={lead.service} />
        <Info label="Presupuesto" value={money(lead.budget)} />
        <Info label="Vive / sale de" value={lead.location || "Sin registrar"} />
        <Info label="Fechas" value={leadDates(lead)} />
      </div>
      {lead.notes && <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{lead.notes}</p>}
    </div>
  );
}

function PipelineView({
  leads,
  workspace,
  draggedLeadId,
  onDragStart,
  onDrop,
  onOpen,
  onStageNameChange,
}: {
  leads: Lead[];
  workspace: Workspace;
  draggedLeadId: string | null;
  onDragStart: (leadId: string) => void;
  onDrop: (stage: Stage) => void;
  onOpen: (lead: Lead) => void;
  onStageNameChange: (stage: Stage, label: string) => void;
}) {
  return (
    <section className={cn(panel, "p-3")}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <PanelTitle eyebrow="Embudo editable" title="Pipeline por etapa" />
        <span className="text-xs font-bold text-[var(--muted)]">Arrastra una tarjeta completa entre etapas</span>
      </div>
      <div className="mb-3 grid grid-cols-6 gap-2 max-xl:grid-cols-3 max-md:grid-cols-2">
        {stageOrder.map((stage) => (
          <input key={stage} className={input} value={workspace.stageLabels[stage]} onChange={(event) => onStageNameChange(stage, event.target.value)} />
        ))}
      </div>
      <div className="grid grid-cols-6 gap-2 overflow-x-auto max-xl:grid-cols-3 max-md:grid-cols-1">
        {stageOrder.map((stage) => {
          const stageLeads = leads.filter((lead) => lead.stage === stage);
          return (
            <div
              key={stage}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => onDrop(stage)}
              className={cn(
                "min-h-[360px] rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-2",
                draggedLeadId && "ring-2 ring-[var(--brand-soft)]",
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <strong className="text-sm">{workspace.stageLabels[stage]}</strong>
                <span className="rounded-full bg-[var(--surface)] px-2 py-1 text-xs font-black text-[var(--muted)]">{stageLeads.length}</span>
              </div>
              <div className="grid gap-2">
                {stageLeads.map((lead) => (
                  <button
                    key={lead.id}
                    draggable
                    onDragStart={() => onDragStart(lead.id)}
                    onClick={() => onOpen(lead)}
                    className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-left shadow-sm transition hover:border-[var(--accent)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <strong className="text-sm">{lead.contactName}</strong>
                      <span className={priorityClass(lead.priority)}>{lead.priority}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">{lead.service}</p>
                    <div className="mt-2 flex items-center justify-between text-xs font-bold">
                      <span>{sourceLabels[lead.source]}</span>
                      <span>{money(lead.budget)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ContactsView({ leads, workspace, onEdit, onDelete }: { leads: Lead[]; workspace: Workspace; onEdit: (lead: Lead) => void; onDelete: (leadId: string) => void }) {
  return (
    <section className={cn(panel, "overflow-hidden")}>
      <div className="border-b border-[var(--line)] p-3">
        <PanelTitle eyebrow="Base del cliente" title="Contactos y oportunidades" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-[var(--surface-muted)] text-xs uppercase text-[var(--muted)]">
            <tr>
              <th className="px-3 py-2">Contacto</th>
              <th className="px-3 py-2">WhatsApp</th>
              <th className="px-3 py-2">Servicio</th>
              <th className="px-3 py-2">Etapa</th>
              <th className="px-3 py-2">Presupuesto</th>
              <th className="px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-[var(--line)]">
                <td className="px-3 py-2 font-bold">{lead.contactName}</td>
                <td className="px-3 py-2 text-[var(--muted)]">{lead.phone}</td>
                <td className="px-3 py-2">{lead.service}</td>
                <td className="px-3 py-2">{workspace.stageLabels[lead.stage]}</td>
                <td className="px-3 py-2 font-bold">{money(lead.budget)}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <IconButton icon={Edit3} label="Editar" onClick={() => onEdit(lead)} />
                    <IconButton icon={Trash2} label="Eliminar" onClick={() => onDelete(lead.id)} />
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

function TasksView({ tasks, leads, onCreate, onComplete }: { tasks: Task[]; leads: Lead[]; onCreate: () => void; onComplete: (taskId: string) => void }) {
  return (
    <section className={cn(panel, "p-3")}>
      <div className="mb-3 flex items-center justify-between">
        <PanelTitle eyebrow="Seguimientos" title="Tareas comerciales" />
        <Button icon={CalendarClock} label="Nueva tarea" onClick={onCreate} />
      </div>
      <div className="grid grid-cols-3 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} lead={leads.find((lead) => lead.id === task.leadId)} onComplete={() => onComplete(task.id)} />
        ))}
      </div>
    </section>
  );
}

function TaskCard({ task, lead, onComplete, compact = false }: { task: Task; lead?: Lead; onComplete: () => void; compact?: boolean }) {
  return (
    <article className={cn("rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-3", compact && "p-2")}>
      <span className={task.completed ? "rounded-full bg-slate-200 px-2 py-1 text-xs font-black text-slate-600" : "rounded-full bg-[var(--brand-soft)] px-2 py-1 text-xs font-black text-[var(--brand)]"}>
        {task.completed ? "Completada" : task.type}
      </span>
      <strong className="mt-2 block">{task.title}</strong>
      <p className="mt-1 text-sm text-[var(--muted)]">{lead?.contactName ?? "Sin lead asignado"}</p>
      <small className="mt-2 block text-[var(--muted)]">{task.dueDate || "Sin fecha"}</small>
      {!task.completed && !compact && (
        <button onClick={onComplete} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-1 text-xs font-black text-[var(--muted)]">
          <CheckCircle2 size={14} />
          Completar
        </button>
      )}
    </article>
  );
}

function CampaignsView({ campaigns, onFilter }: { campaigns: Campaign[]; onFilter: (source: Source) => void }) {
  return (
    <section className={cn(panel, "p-3")}>
      <PanelTitle eyebrow="Meta y contenido" title="Campanas que alimentan WhatsApp" />
      <div className="mt-3 grid grid-cols-3 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
        {campaigns.map((campaign) => (
          <article key={campaign.id} className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-3">
            <div className="flex items-center justify-between">
              <Megaphone className="text-[var(--brand)]" size={18} />
              <span className="rounded-full bg-[var(--surface)] px-2 py-1 text-xs font-black text-[var(--muted)]">{sourceLabels[campaign.source]}</span>
            </div>
            <strong className="mt-3 block">{campaign.name}</strong>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Info label="Leads" value={`${campaign.leads}`} />
              <Info label="Gasto" value={money(campaign.spend)} />
              <Info label="Conv." value={`${campaign.conversion}%`} />
            </div>
            <button className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-1 text-xs font-black text-[var(--muted)]" onClick={() => onFilter(campaign.source)}>
              <Filter size={14} />
              Ver leads
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function AutomationsView({ automations, workspace, onToggle }: { automations: Automation[]; workspace: Workspace; onToggle: (automationId: string) => void }) {
  return (
    <section className="grid grid-cols-[.9fr_1.1fr] gap-3 max-xl:grid-cols-1">
      <div className={cn(panel, "p-3")}>
        <PanelTitle eyebrow="Chatbot / salesbot" title="Motor automatico WhatsApp" />
        <div className="mt-3 grid gap-2">
          <Info label="Modo" value="Ventas + calificacion" />
          <Info label="Plantilla inicial" value="bienvenida_lead" />
          <Info label="Traspaso humano" value="asesor, cita, precio final, reclamo" />
        </div>
        <div className="mt-3 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-3">
          <strong>Flujo recomendado</strong>
          <ol className="mt-2 grid gap-2 text-sm text-[var(--muted)]">
            <li>1. Recibir lead desde Meta o WhatsApp.</li>
            <li>2. Pedir servicio, ciudad, fechas y presupuesto.</li>
            <li>3. Crear tarea si no responde en 4 horas.</li>
            <li>4. Pasar a humano si pide compra, precio final o reclamo.</li>
          </ol>
        </div>
      </div>
      <div className={cn(panel, "p-3")}>
        <PanelTitle eyebrow={workspace.name} title="Reglas activas" />
        <div className="mt-3 grid gap-2">
          {automations.map((automation) => (
            <article key={automation.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-3">
              <div>
                <strong>{automation.name}</strong>
                <p className="mt-1 text-sm text-[var(--muted)]">{automation.trigger}</p>
                <span className="mt-1 block text-sm font-bold text-[var(--brand)]">{automation.action}</span>
              </div>
              <button
                onClick={() => onToggle(automation.id)}
                className={cn(
                  "h-8 rounded-lg px-3 text-xs font-black",
                  automation.active ? "bg-[var(--accent)] text-white" : "border border-[var(--line)] text-[var(--muted)]",
                )}
              >
                {automation.active ? "Activa" : "Pausada"}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function IntegrationsView({ integrations }: { integrations: Integration[] }) {
  return (
    <section className={cn(panel, "p-3")}>
      <PanelTitle eyebrow="APIs oficiales" title="Integraciones por empresa" />
      <div className="mt-3 grid grid-cols-3 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
        {integrations.map((integration) => (
          <article key={integration.id} className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-3">
            <div className="flex items-center justify-between">
              <PlugZap className="text-[var(--brand)]" size={18} />
              <span className="rounded-full bg-[var(--surface)] px-2 py-1 text-xs font-black text-[var(--muted)]">{statusText(integration.status)}</span>
            </div>
            <strong className="mt-3 block">{integration.name}</strong>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{integration.description}</p>
            <button className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-1 text-xs font-black text-[var(--muted)]">
              <Settings size={14} />
              Configurar
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function SettingsView({
  workspace,
  onThemeChange,
  onStageNameChange,
  onCompanyChange,
}: {
  workspace: Workspace;
  onThemeChange: (theme: Partial<WorkspaceTheme>) => void;
  onStageNameChange: (stage: Stage, label: string) => void;
  onCompanyChange: (partial: Partial<Workspace>) => void;
}) {
  return (
    <section className="grid grid-cols-2 gap-3 max-xl:grid-cols-1">
      <div className={cn(panel, "p-3")}>
        <PanelTitle eyebrow="Empresa" title="Datos del cliente" />
        <div className="mt-3 grid grid-cols-2 gap-2 max-md:grid-cols-1">
          <Field label="Nombre" value={workspace.name} onChange={(value) => onCompanyChange({ name: value })} />
          <Field label="Industria" value={workspace.industry} onChange={(value) => onCompanyChange({ industry: value })} />
          <Field label="Responsable" value={workspace.owner} onChange={(value) => onCompanyChange({ owner: value })} />
          <Field label="WhatsApp" value={workspace.phone} onChange={(value) => onCompanyChange({ phone: value })} />
        </div>
      </div>
      <div className={cn(panel, "p-3")}>
        <PanelTitle eyebrow="Perfil visual" title="Colores por empresa" />
        <div className="mt-3 grid grid-cols-3 gap-2">
          <ColorField label="Principal" value={workspace.theme.primary} onChange={(value) => onThemeChange({ primary: value })} />
          <ColorField label="Acento" value={workspace.theme.accent} onChange={(value) => onThemeChange({ accent: value })} />
          <ColorField label="Suave" value={workspace.theme.soft} onChange={(value) => onThemeChange({ soft: value })} />
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--brand-soft)] p-3">
          <div>
            <span className="text-xs font-black uppercase text-[var(--muted)]">Vista previa</span>
            <strong className="block">{workspace.name}</strong>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-black text-white">
            <MessageCircle size={16} />
            WhatsApp
          </button>
        </div>
      </div>
      <div className={cn(panel, "col-span-2 p-3 max-xl:col-span-1")}>
        <PanelTitle eyebrow="Pipeline" title="Etapas editables de este cliente" />
        <div className="mt-3 grid grid-cols-6 gap-2 max-xl:grid-cols-3 max-md:grid-cols-2">
          {stageOrder.map((stage) => (
            <Field key={stage} label={defaultStageLabels[stage]} value={workspace.stageLabels[stage]} onChange={(value) => onStageNameChange(stage, value)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LeadModal({
  form,
  editing,
  onChange,
  onClose,
  onSave,
}: {
  form: LeadForm;
  editing: boolean;
  onChange: (form: LeadForm) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal title={editing ? "Editar ficha de lead" : "Nuevo lead WhatsApp"} eyebrow="Ficha personalizable" onClose={onClose}>
      <div className="grid grid-cols-2 gap-2 max-md:grid-cols-1">
        <Field label="Nombre" value={form.contactName} onChange={(value) => onChange({ ...form, contactName: value })} />
        <Field label="Nombre WhatsApp" value={form.whatsappName} onChange={(value) => onChange({ ...form, whatsappName: value })} />
        <Field label="Telefono WhatsApp" value={form.phone} onChange={(value) => onChange({ ...form, phone: value })} />
        <label className="grid gap-1 text-[11px] font-black uppercase text-[var(--muted)]">
          Fuente
          <select className={input} value={form.source} onChange={(event) => onChange({ ...form, source: event.target.value as Source })}>
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {sourceLabels[source]}
              </option>
            ))}
          </select>
        </label>
        <Field label="Servicio que desea" value={form.service} onChange={(value) => onChange({ ...form, service: value })} />
        <Field label="Donde vive / sale de" value={form.location} onChange={(value) => onChange({ ...form, location: value })} />
        <Field label="Fecha inicial" type="date" value={form.desiredStartDate} onChange={(value) => onChange({ ...form, desiredStartDate: value })} />
        <Field label="Fecha final" type="date" value={form.desiredEndDate} onChange={(value) => onChange({ ...form, desiredEndDate: value })} />
        <Field label="Presupuesto / pipeline" value={form.budget} onChange={(value) => onChange({ ...form, budget: value })} />
        <label className="grid gap-1 text-[11px] font-black uppercase text-[var(--muted)]">
          Prioridad
          <select className={input} value={form.priority} onChange={(event) => onChange({ ...form, priority: event.target.value as Priority })}>
            <option value="hot">Alta</option>
            <option value="warm">Media</option>
            <option value="cold">Baja</option>
          </select>
        </label>
        <label className="col-span-2 grid gap-1 text-[11px] font-black uppercase text-[var(--muted)] max-md:col-span-1">
          Notas / detalle
          <textarea className={textArea} value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} />
        </label>
      </div>
      <ModalActions onClose={onClose} onSave={onSave} saveLabel={editing ? "Guardar cambios" : "Crear lead"} />
    </Modal>
  );
}

function CompanyModal({
  form,
  onChange,
  onClose,
  onSave,
}: {
  form: { name: string; industry: string; owner: string; phone: string; responseSlaMinutes: string };
  onChange: (form: { name: string; industry: string; owner: string; phone: string; responseSlaMinutes: string }) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal title="Nueva empresa cliente" eyebrow="Caso independiente" onClose={onClose}>
      <div className="grid grid-cols-2 gap-2 max-md:grid-cols-1">
        <Field label="Nombre comercial" value={form.name} onChange={(value) => onChange({ ...form, name: value })} />
        <Field label="Industria" value={form.industry} onChange={(value) => onChange({ ...form, industry: value })} />
        <Field label="Responsable" value={form.owner} onChange={(value) => onChange({ ...form, owner: value })} />
        <Field label="WhatsApp comercial" value={form.phone} onChange={(value) => onChange({ ...form, phone: value })} />
        <Field label="SLA minutos" value={form.responseSlaMinutes} onChange={(value) => onChange({ ...form, responseSlaMinutes: value })} />
      </div>
      <ModalActions onClose={onClose} onSave={onSave} saveLabel="Crear empresa" />
    </Modal>
  );
}

function Modal({ title, eyebrow, children, onClose }: { title: string; eyebrow: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/55 p-4">
      <section className="w-full max-w-3xl rounded-lg border border-[var(--line)] bg-[var(--surface)] shadow-calm">
        <header className="flex items-center justify-between border-b border-[var(--line)] p-4">
          <div>
            <p className="text-[11px] font-black uppercase text-[var(--brand)]">{eyebrow}</p>
            <h2 className="text-lg font-black">{title}</h2>
          </div>
          <IconButton icon={MoreHorizontal} label="Cerrar" onClick={onClose} />
        </header>
        <div className="p-4">{children}</div>
      </section>
    </div>
  );
}

function ModalActions({ onClose, onSave, saveLabel }: { onClose: () => void; onSave: () => void; saveLabel: string }) {
  return (
    <div className="mt-4 flex justify-end gap-2 border-t border-[var(--line)] pt-4">
      <button className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-black text-[var(--muted)]" onClick={onClose}>
        Cancelar
      </button>
      <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-black text-white" onClick={onSave}>
        <Save size={16} />
        {saveLabel}
      </button>
    </div>
  );
}

function PanelTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase text-[var(--brand)]">{eyebrow}</p>
      <h2 className="text-base font-black">{title}</h2>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-1 text-[11px] font-black uppercase text-[var(--muted)]">
      {label}
      <input className={input} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-2 text-[11px] font-black uppercase text-[var(--muted)]">
      {label}
      <input className="h-9 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] p-1" type="color" value={value} onChange={(event) => onChange(event.target.value)} />
      <span className="text-xs normal-case text-[var(--ink)]">{value}</span>
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--surface-muted)] p-2">
      <span className="block text-[11px] font-black uppercase text-[var(--muted)]">{label}</span>
      <strong className="mt-1 block break-words text-sm">{value}</strong>
    </div>
  );
}

function IconButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--brand)]" onClick={onClick} aria-label={label} title={label}>
      <Icon size={15} />
    </button>
  );
}

function ActionButton({ icon: Icon, label, onClick, danger = false }: { icon: LucideIcon; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-9 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-sm font-black hover:border-[var(--accent)]",
        danger ? "text-[var(--danger)]" : "text-[var(--ink)]",
      )}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function buildWorkspaceStyle(theme: WorkspaceTheme): CSSProperties {
  return {
    "--brand": theme.primary,
    "--accent": theme.accent,
    "--brand-soft": theme.soft,
    "--bubble-agent": `color-mix(in srgb, ${theme.accent} 14%, var(--surface))`,
  } as CSSProperties;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase();
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
}

function leadDates(lead: Lead) {
  if (lead.desiredStartDate && lead.desiredEndDate) return `${lead.desiredStartDate} - ${lead.desiredEndDate}`;
  if (lead.desiredStartDate) return lead.desiredStartDate;
  if (lead.desiredEndDate) return lead.desiredEndDate;
  return "Sin registrar";
}

function statusText(status: Workspace["whatsappStatus"] | Workspace["metaStatus"] | Integration["status"]) {
  return {
    connected: "Conectado",
    ready: "Listo",
    partial: "Parcial",
    pending: "Pendiente",
    disconnected: "Desconectado",
  }[status];
}

function priorityClass(priority: Priority) {
  if (priority === "hot") return "rounded-full bg-rose-100 px-2 py-1 text-[10px] font-black uppercase text-rose-700";
  if (priority === "warm") return "rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black uppercase text-amber-700";
  return "rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-600";
}
