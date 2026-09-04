import Link from "next/link";
import { Plus, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadsTable } from "@/components/leads/leads-table";
import { NurturePipeline } from "@/components/leads/nurture-pipeline";
import { LeadsCsvActions } from "@/components/leads/leads-csv-actions";
import { getLeadsList } from "@/lib/queries/leads";
import { getNurturePipeline } from "@/lib/queries/nurture";
import { getSavedViews } from "@/lib/queries/saved-views";
import { getAssignableUsers, getCurrentUser } from "@/lib/queries/reference";
import { getOrderedStages } from "@/lib/pipeline/stages";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: {
    tab?: string;
    status?: string;
    group?: string;
    q?: string;
    assignedTo?: string;
    lostReason?: string;
    ageMin?: string;
    ageMax?: string;
    sort?: string;
    dir?: string;
  };
}) {
  const [currentUser, assignableUsers, nurtureLeads, stages] = await Promise.all([
    getCurrentUser(),
    getAssignableUsers(),
    getNurturePipeline(),
    getOrderedStages("LEAD_NURTURE"),
  ]);
  const leads = await getLeadsList({
    userId: currentUser.id,
    roleId: currentUser.roleId,
    roleName: currentUser.roleName ?? "",
    departmentId: currentUser.departmentId,
    dataScope: currentUser.dataScope,
    reportScope: currentUser.reportScope,
    isReadOnly: currentUser.isReadOnly,
  });
  const savedViews = await getSavedViews("LEAD", currentUser.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Leads</h1>
          <p className="text-sm text-muted-foreground">{leads.length} leads</p>
        </div>
        <div className="flex gap-2">
          <LeadsCsvActions actorId={currentUser.id} />
          <Button variant="outline" asChild>
            <Link href="/leads/analytics">
              <BarChart3 className="size-4" /> Analytics
            </Link>
          </Button>
          <Button asChild>
            <Link href="/leads/new">
              <Plus className="size-4" /> New Lead
            </Link>
          </Button>
        </div>
      </div>

      <Tabs key={searchParams.tab ?? "all"} defaultValue={searchParams.tab ?? "all"}>
        <TabsList>
          <TabsTrigger value="all">All Leads ({leads.length})</TabsTrigger>
          <TabsTrigger value="nurture">Nurture Pipeline ({nurtureLeads.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <LeadsTable
            leads={leads}
            assignableUsers={assignableUsers}
            canBulkAssign={currentUser.isManager}
            savedViews={savedViews}
            currentUserId={currentUser.id}
            initialFilters={searchParams}
            stages={stages}
          />
        </TabsContent>
        <TabsContent value="nurture">
          <p className="mb-3 text-sm text-muted-foreground">
            Leads between first capture and conversion — distinct from the post-conversion Opportunity
            pipeline at <Link href="/sales" className="underline">Sales</Link>. Cards flagged stale need a
            follow-up logged.
          </p>
          <NurturePipeline leads={nurtureLeads} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
