import Link from "next/link";
import { ArrowLeft, ListChecks, AlertTriangle, CalendarCheck2, Gauge } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChecklistTemplatesList } from "@/components/cx/checklist-templates-list";
import { ChecklistRunsList } from "@/components/cx/checklist-runs-list";
import { DepartmentInteractionsList } from "@/components/cx/department-interactions-list";
import { getChecklistTemplates, getChecklistRunsList, getChecklistKpis, getDepartmentInteractions } from "@/lib/queries/checklists";
import { getCustomerUnitOptions } from "@/lib/queries/cx";
import { getCurrentUser } from "@/lib/queries/reference";

export default async function CxPlaybookPage({ searchParams }: { searchParams: { tab?: string } }) {
  const [templates, runs, kpis, customerUnits, currentUser, departments] = await Promise.all([
    getChecklistTemplates(),
    getChecklistRunsList(),
    getChecklistKpis(),
    getCustomerUnitOptions(),
    getCurrentUser(),
    getDepartmentInteractions(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/cx" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Customer Experience
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-semibold">CX Playbook</h1>
        <p className="text-sm text-muted-foreground">
          CX Workflow: State 2 Operational Playbook — 11 tabs, each with Process Execution and Quality &amp; Control checklists.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Active checklists" value={String(kpis.activeCount)} icon={ListChecks} tone="primary" href="/cx/playbook?tab=runs" />
        <KpiCard title="Open quality flags" value={String(kpis.totalOpenFlags)} icon={AlertTriangle} tone="warning" href="/cx/playbook?tab=runs" />
        <KpiCard title="Completed this month" value={String(kpis.completedThisMonth)} icon={CalendarCheck2} tone="success" href="/cx/playbook?tab=runs" />
        <KpiCard title="Avg. quality score" value={kpis.avgQualityScore !== null ? `${kpis.avgQualityScore}%` : "--"} icon={Gauge} tone="info" href="/cx/playbook?tab=runs" />
      </div>

      <Tabs key={searchParams.tab ?? "templates"} defaultValue={searchParams.tab ?? "templates"}>
        <TabsList>
          <TabsTrigger value="templates">Templates (11)</TabsTrigger>
          <TabsTrigger value="runs">Active &amp; Past Runs ({runs.length})</TabsTrigger>
          <TabsTrigger value="departments">Departments ({departments.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="templates">
          <ChecklistTemplatesList templates={templates} customerUnits={customerUnits} currentUserId={currentUser.id} />
        </TabsContent>
        <TabsContent value="runs">
          <ChecklistRunsList runs={runs} />
        </TabsContent>
        <TabsContent value="departments">
          <p className="mb-3 text-sm text-muted-foreground">
            Ongoing (not per-step) relationships between the CX team and every other department.
          </p>
          <DepartmentInteractionsList departments={departments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
