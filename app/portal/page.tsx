"use client";

import Link from "next/link";
import { BarChart3, Inbox, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

type Summary = {
  totalCustomers: number;
  totalWorkspaces: number;
  totalConversations: number;
  activeLeads: number;
  openDeals: number;
  pipelineValue: number;
  pendingActivities: number;
};

type Workspace = {
  id: string;
  name: string;
  industry: string;
};

type CampaignSource = {
  id: string;
  name: string;
  leads: number;
  spend: number;
  conversionRate: number;
  costPerLead: number;
};

export default function PortalPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignSource[]>([]);

  useEffect(() => {
    async function loadPortal() {
      const [summaryData, workspaceData, campaignData] = await Promise.all([
        getJson<Summary>("/api/crm/summary"),
        getJson<Workspace[]>("/api/crm/workspaces"),
        getJson<CampaignSource[]>("/api/crm/campaign-sources?workspaceId=ws_terra"),
      ]);

      setSummary(summaryData);
      setWorkspaces(workspaceData);
      setCampaigns(campaignData);
    }

    loadPortal();
  }, []);

  return (
    <main className="portalShell">
      <section className="portalHero">
        <p className="eyebrow">Portal del cliente</p>
        <h1>Resultados y conversaciones por cliente</h1>
        <p>
          Vista conectada a Prisma para revisar leads, campanas, tiempos de respuesta y pipeline
          sin acceder a configuraciones internas.
        </p>
        <Link className="primaryButton" href="/">
          Volver al CRM
        </Link>
      </section>

      <section className="portalGrid">
        <article>
          <Inbox size={22} />
          <strong>{summary?.totalConversations ?? 0} conversaciones</strong>
          <span>{summary?.activeLeads ?? 0} leads activos y {summary?.pendingActivities ?? 0} seguimientos pendientes.</span>
        </article>
        <article>
          <BarChart3 size={22} />
          <strong>{campaigns.reduce((total, source) => total + source.leads, 0)} leads de campanas</strong>
          <span>
            CPL promedio {averageCpl(campaigns)} y conversion promedio {averageConversion(campaigns)}%.
          </span>
        </article>
        <article>
          <ShieldCheck size={22} />
          <strong>{workspaces.length} clientes gestionados</strong>
          <span>{workspaces.map((workspace) => workspace.name).join(", ") || "Sin clientes configurados."}</span>
        </article>
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

function averageCpl(campaigns: CampaignSource[]) {
  if (!campaigns.length) return "$0.00";
  const average = campaigns.reduce((total, source) => total + source.costPerLead, 0) / campaigns.length;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(average);
}

function averageConversion(campaigns: CampaignSource[]) {
  if (!campaigns.length) return "0";
  const average = campaigns.reduce((total, source) => total + source.conversionRate, 0) / campaigns.length;
  return average.toFixed(1);
}
