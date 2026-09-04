import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChecklistRunDetailView } from "@/components/cx/checklist-run-detail";
import { getChecklistRunDetail } from "@/lib/queries/checklists";
import { getCurrentUser } from "@/lib/queries/reference";
import { formatDate, orEmpty } from "@/lib/utils";

export default async function ChecklistRunPage({ params }: { params: { id: string } }) {
  const [run, currentUser] = await Promise.all([getChecklistRunDetail(params.id), getCurrentUser()]);
  if (!run) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/cx/playbook" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to CX Playbook
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold">
            Tab {run.stageNumber}: {run.templateTitle}
          </h1>
          {run.completedAt ? <Badge variant="success">Complete</Badge> : <Badge variant="info">In progress</Badge>}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{run.goal}</p>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Subject</p>
            <p className="text-sm text-foreground">{orEmpty(run.customerName ?? run.label)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Owner</p>
            <p className="text-sm text-foreground">{run.owner}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">SLA</p>
            <p className="text-sm text-foreground">{run.sla}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Progress</p>
            <p className="text-sm text-foreground tabular-nums">
              {run.completedSteps}/{run.totalSteps} steps · started {formatDate(run.startedAt)} by {orEmpty(run.startedByName)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Quality score</p>
            {run.qualityScore === null ? (
              <p className="text-sm text-muted-foreground">No quality-check steps</p>
            ) : (
              <p className={`text-sm font-semibold tabular-nums ${run.qualityScore >= 80 ? "text-success" : run.qualityScore >= 50 ? "text-warning" : "text-destructive"}`}>
                {run.qualityScore}%
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <ChecklistRunDetailView run={run} currentUserId={currentUser.id} />
    </div>
  );
}
