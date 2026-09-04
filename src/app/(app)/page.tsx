import { Users, Home, Wallet, MessageSquareWarning } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PipelineFunnel } from "@/components/dashboard/pipeline-funnel";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { getDashboardKpis, getPipelineFunnel, getRecentActivity } from "@/lib/queries/dashboard";
import { getHeaderAlerts } from "@/lib/queries/alerts";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const [kpis, pipeline, activity, alerts] = await Promise.all([
    getDashboardKpis(),
    getPipelineFunnel(),
    getRecentActivity(),
    getHeaderAlerts(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview across leads, inventory, sales, and support.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Active Leads"
          value={kpis.activeLeads.toLocaleString()}
          changePct={kpis.activeLeadsChangePct}
          icon={Users}
          href="/leads"
          tone="info"
        />
        <KpiCard
          title="Units Available"
          value={`${kpis.unitsAvailable.toLocaleString()} / ${kpis.totalUnits.toLocaleString()}`}
          icon={Home}
          href="/projects?status=AVAILABLE"
          tone="success"
        />
        <KpiCard title="Revenue" value={formatCurrency(kpis.revenue)} icon={Wallet} href="/payments" tone="highlight" />
        <KpiCard
          title="Open Complaints"
          value={kpis.openComplaints.toLocaleString()}
          icon={MessageSquareWarning}
          href="/cx"
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PipelineFunnel stages={pipeline} />
        </div>
        <AlertsPanel alerts={alerts} />
      </div>

      <RecentActivity items={activity} />
    </div>
  );
}
