import { ReportsList } from "@/components/reports/reports-list";
import { getReportsList } from "@/lib/queries/reports";
import { getReportableEntities } from "@/lib/reports/schema";
import { getCurrentUser } from "@/lib/queries/reference";

export default async function ReportsPage() {
  const currentUser = await getCurrentUser();
  const [reports, entities] = await Promise.all([getReportsList(currentUser.id), Promise.resolve(getReportableEntities())]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Build your own chart from any table below — no code change needed. Reports you don't share are only visible to you.
        </p>
      </div>
      <ReportsList reports={reports} entities={entities} currentUserId={currentUser.id} />
    </div>
  );
}
