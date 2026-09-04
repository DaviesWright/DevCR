"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InteractionActionBar, InteractionTimeline, type InteractionTimelineItem } from "@/components/shared/interaction-panel";
import { logInteraction, type InteractionEntityType } from "@/lib/actions/interactions";
import { type OpportunityDetail } from "@/lib/queries/sales";
import { formatCurrency, formatDate, orEmpty, relativeTime } from "@/lib/utils";

export function OpportunityDetailView({
  opportunity,
  timeline,
  currentUser,
  canManage,
}: {
  opportunity: OpportunityDetail;
  timeline: InteractionTimelineItem[];
  currentUser: { id: string; name: string };
  canManage: boolean;
}) {
  const router = useRouter();
  const entityType: InteractionEntityType = "OPPORTUNITY";

  async function handleSubmit(type: string, input: { subject?: string; notes?: string; occurredAt?: string }) {
    await logInteraction(entityType, opportunity.id, { ...input, type, userId: currentUser.id });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold">
              <Link href={`/customers/${opportunity.customer.id}`} className="hover:underline">
                {opportunity.customer.name}
              </Link>
            </h1>
            <Badge variant={opportunity.stageBadgeVariant as never}>{opportunity.stageLabel}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {opportunity.unit ? `${opportunity.unit.unitNumber} · ${opportunity.unit.developmentName}` : "No unit yet"} · Owner {opportunity.owner.name} · Created{" "}
            {formatDate(opportunity.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tabular-nums">{formatCurrency(opportunity.expectedValue, opportunity.currency)}</p>
          <p className="text-xs text-muted-foreground">{opportunity.probability}% probability</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Customer</p>
            <p className="text-sm text-foreground">{orEmpty(opportunity.customer.email)}</p>
            <p className="text-sm text-foreground">{opportunity.customer.phone}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Expected close</p>
            <p className="text-sm text-foreground">{opportunity.expectedCloseDate ? formatDate(opportunity.expectedCloseDate) : "--"}</p>
            {opportunity.leadId && (
              <Link href={`/leads/${opportunity.leadId}`} className="text-xs text-primary hover:underline">
                View originating lead
              </Link>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reservation</p>
            {opportunity.reservation ? (
              <p className={`text-sm ${opportunity.reservation.expired ? "text-destructive" : "text-success"}`}>
                {opportunity.reservation.expired ? "Hold expired" : `Held · ${relativeTime(opportunity.reservation.expiryDate)}`}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No active hold</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interactions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {canManage ? (
            <InteractionActionBar onSubmit={handleSubmit} loggedBy={currentUser.name} />
          ) : (
            <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              View only — this opportunity isn't assigned to you.
            </p>
          )}
          <InteractionTimeline items={timeline} />
        </CardContent>
      </Card>
    </div>
  );
}
