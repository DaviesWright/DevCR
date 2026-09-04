import Link from "next/link";
import { Home, CheckCircle2, CalendarClock, Building2, X } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { UnitsInventory } from "@/components/sales/units-inventory";
import { ProjectsToolbar } from "@/components/inventory/projects-toolbar";
import { getUnitsInventory, getUnitsInventoryKpis, getReservableLeads } from "@/lib/queries/sales";
import { getCurrentUser } from "@/lib/queries/reference";

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const [units, kpis, leads, currentUser] = await Promise.all([
    getUnitsInventory(),
    getUnitsInventoryKpis(),
    getReservableLeads(),
    getCurrentUser(),
  ]);

  const developmentCount = new Set(units.map((u) => u.developmentId)).size;
  const statusFilter = searchParams.status && STATUS_LABEL[searchParams.status] ? searchParams.status : null;
  const filteredUnits = statusFilter ? units.filter((u) => u.status === statusFilter) : units;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            {developmentCount} development{developmentCount === 1 ? "" : "s"}, {kpis.total.toLocaleString()} units.
          </p>
        </div>
        <ProjectsToolbar actorId={currentUser.id} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Developments" value={developmentCount.toLocaleString()} icon={Building2} tone="primary" href="/projects" />
        <KpiCard
          title="Available"
          value={kpis.available.toLocaleString()}
          icon={Home}
          tone="success"
          href="/projects?status=AVAILABLE"
        />
        <KpiCard
          title="Reserved"
          value={kpis.reserved.toLocaleString()}
          icon={CalendarClock}
          tone="warning"
          href="/projects?status=RESERVED"
        />
        <KpiCard
          title="Sold"
          value={kpis.sold.toLocaleString()}
          icon={CheckCircle2}
          tone="highlight"
          href="/projects?status=SOLD"
        />
      </div>

      {statusFilter && (
        <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-4 py-2.5 text-sm">
          <span>
            Showing <span className="font-medium">{STATUS_LABEL[statusFilter]}</span> units only (
            {filteredUnits.length} of {units.length})
          </span>
          <Link href="/projects" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <X className="size-3.5" /> Clear filter
          </Link>
        </div>
      )}

      <UnitsInventory units={filteredUnits} leads={leads} currentUserId={currentUser.id} />
    </div>
  );
}
