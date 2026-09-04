import Link from "next/link";
import { Plus, AlertTriangle, MessageSquareWarning, ArrowUpCircle, CalendarClock, ListChecks } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ComplaintsTable } from "@/components/cx/complaints-table";
import { HandoversPanel } from "@/components/cx/handovers-panel";
import { HandoffsTable } from "@/components/cx/handoffs-table";
import { getCxKpis, getComplaintsList, getHandoversList, getCustomerUnitOptions } from "@/lib/queries/cx";
import { getHandoffsList } from "@/lib/queries/handoffs";
import { getCurrentUser, getAssignableUsers } from "@/lib/queries/reference";

export default async function CustomerExperiencePage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const [kpis, complaints, handovers, customerUnits, currentUser, handoffs, assignableUsers] = await Promise.all([
    getCxKpis(),
    getComplaintsList(),
    getHandoversList(),
    getCustomerUnitOptions(),
    getCurrentUser(),
    getHandoffsList(),
    getAssignableUsers(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Customer Experience</h1>
          <p className="text-sm text-muted-foreground">Handovers, complaints, and SLA tracking post-sale.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/cx/playbook">
              <ListChecks className="size-4" /> Playbook
            </Link>
          </Button>
          <Button asChild>
            <Link href="/cx/complaints/new">
              <Plus className="size-4" /> Log Complaint
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Open complaints" value={String(kpis.openComplaints)} icon={MessageSquareWarning} tone="warning" href="/cx?tab=complaints" />
        <KpiCard title="SLA breaches" value={String(kpis.breachedComplaints)} icon={AlertTriangle} tone="destructive" href="/cx?tab=complaints" />
        <KpiCard title="Open escalations" value={String(kpis.openEscalations)} icon={ArrowUpCircle} tone="destructive" href="/cx?tab=complaints" />
        <KpiCard title="Handovers this week" value={String(kpis.handoversThisWeek)} icon={CalendarClock} tone="info" href="/cx?tab=handovers" />
      </div>

      <Tabs key={searchParams.tab ?? "complaints"} defaultValue={searchParams.tab ?? "complaints"}>
        <TabsList>
          <TabsTrigger value="complaints">Complaints ({complaints.length})</TabsTrigger>
          <TabsTrigger value="handoffs">Sales Handoffs ({handoffs.length})</TabsTrigger>
          <TabsTrigger value="handovers">Handovers ({handovers.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="complaints">
          <ComplaintsTable complaints={complaints} />
        </TabsContent>
        <TabsContent value="handoffs">
          <p className="mb-3 text-sm text-muted-foreground">
            Deal Won → CX relationship handoff (Sales Playbook §6) — distinct from the physical unit
            handover below.
          </p>
          <HandoffsTable handoffs={handoffs} assignableUsers={assignableUsers} />
        </TabsContent>
        <TabsContent value="handovers">
          <HandoversPanel handovers={handovers} customerUnits={customerUnits} currentUserId={currentUser.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
