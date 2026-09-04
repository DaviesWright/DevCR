import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ComplaintStatusBadge, PriorityBadge } from "@/components/cx/cx-badges";
import { ComplaintActionBar, ResolveEscalationButton } from "@/components/cx/complaint-actions";
import { getComplaintDetail } from "@/lib/queries/cx";
import { getAssignableUsers, getCurrentUser } from "@/lib/queries/reference";
import { formatDate, relativeTime, orEmpty } from "@/lib/utils";
import { ESCALATION_LABEL, type EscalationLevel } from "@/lib/cx-sla";

export default async function ComplaintDetailPage({ params }: { params: { id: string } }) {
  const [complaint, currentUser, assignableUsers] = await Promise.all([
    getComplaintDetail(params.id),
    getCurrentUser(),
    getAssignableUsers(),
  ]);
  if (!complaint) notFound();

  const timeline = [
    ...complaint.updates.map((u) => ({
      id: u.id,
      kind: "update" as const,
      note: u.note,
      by: u.by,
      createdAt: u.createdAt,
      escalationStatus: null as string | null,
    })),
    ...complaint.escalations.map((e) => ({
      id: e.id,
      kind: "escalation" as const,
      note: `${e.reason} (${e.from} → ${e.to})`,
      by: e.from,
      createdAt: e.createdAt,
      escalationStatus: e.status,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="flex flex-col gap-6">
      <Link href="/cx" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Customer Experience
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold">{complaint.subject}</h1>
            <ComplaintStatusBadge status={complaint.status as never} />
            <PriorityBadge priority={complaint.priority as never} />
            {complaint.pausedAt ? (
              <Badge variant="outline">Paused</Badge>
            ) : (
              <Badge
                variant={
                  complaint.escalationLevel >= 3 ? "destructive" : complaint.escalationLevel >= 1 ? "warning" : "secondary"
                }
              >
                {ESCALATION_LABEL[complaint.escalationLevel as EscalationLevel]}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {complaint.customer.name} {complaint.unit ? `· Unit ${complaint.unit.number}` : ""} · {complaint.category} ·
            Opened {formatDate(complaint.openedAt)}
          </p>
          {complaint.pausedAt && (
            <p className="mt-1 text-sm text-muted-foreground">
              SLA paused {relativeTime(complaint.pausedAt)}{complaint.pauseReason ? ` — ${complaint.pauseReason}` : ""}
            </p>
          )}
        </div>

        <ComplaintActionBar
          complaintId={complaint.id}
          status={complaint.status}
          isPaused={!!complaint.pausedAt}
          currentUser={currentUser}
          assignableUsers={assignableUsers}
        />
      </div>

      {complaint.sla && (
        <Card>
          <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Response</p>
              <p
                className={
                  complaint.sla.responseBreached ? "text-sm font-medium text-destructive" : "text-sm text-foreground"
                }
              >
                {complaint.sla.respondedAt
                  ? `Responded ${relativeTime(complaint.sla.respondedAt)}`
                  : `Due ${relativeTime(complaint.sla.responseDueAt)}`}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Resolution</p>
              <p
                className={
                  complaint.sla.resolutionBreached ? "text-sm font-medium text-destructive" : "text-sm text-foreground"
                }
              >
                {complaint.sla.resolvedAt
                  ? `Resolved ${relativeTime(complaint.sla.resolvedAt)}`
                  : `Due ${relativeTime(complaint.sla.resolutionDueAt)}`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">{complaint.description}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</p>
              <p className="text-sm text-foreground">{complaint.customer.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phone</p>
              <p className="text-sm text-foreground">{orEmpty(complaint.customer.phone)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Assigned To</p>
              <p className="text-sm text-foreground">{orEmpty(complaint.assignedTo?.name)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No updates yet.</p>
          ) : (
            <ol className="flex flex-col gap-4">
              {timeline.map((item) => (
                <li key={`${item.kind}-${item.id}`} className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Badge variant={item.kind === "escalation" ? "destructive" : "outline"}>
                      {item.kind === "escalation" ? "Escalated" : "Update"}
                    </Badge>
                    <div>
                      <p className="text-sm text-foreground">
                        {item.note}
                        {item.kind === "escalation" && item.escalationStatus === "RESOLVED" && (
                          <span className="ml-2 text-xs font-medium text-success">Resolved</span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.by} · {relativeTime(item.createdAt)}
                      </p>
                    </div>
                  </div>
                  {item.kind === "escalation" && item.escalationStatus !== "RESOLVED" && (
                    <ResolveEscalationButton escalationId={item.id} complaintId={complaint.id} />
                  )}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
