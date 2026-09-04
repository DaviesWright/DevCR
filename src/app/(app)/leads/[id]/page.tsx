import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadStatusBadge, QualificationBadge, SegmentBadge } from "@/components/leads/lead-status-badge";
import { EngagementScore } from "@/components/leads/engagement-score";
import { LeadActionBar } from "@/components/leads/lead-actions";
import { InteractionTimeline } from "@/components/shared/interaction-panel";
import { getLeadDetail } from "@/lib/queries/leads";
import { getLeadSyncedItems } from "@/lib/queries/interactions";
import { markReferralRewarded } from "@/lib/actions/leads";
import { getAssignableUsers, getAvailableUnitsForConversion, getCurrentUser } from "@/lib/queries/reference";
import { getPermissionProfile, assertCanAccessRecord } from "@/lib/permissions";
import { getStageMapByKey } from "@/lib/pipeline/stages";
import { LOST_REASON_LABEL } from "@/lib/leads/lead-taxonomy";
import { formatCurrency, formatDate, orEmpty, relativeTime } from "@/lib/utils";

const SEGMENT_LABEL: Record<string, string> = {
  LOCAL_RESIDENTIAL: "Local Residential",
  DIASPORA: "Diaspora",
  CORPORATE: "Corporate",
  INVESTOR: "Investor",
};

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const [lead, currentUser, assignableUsers, availableUnits, stagesByKey] = await Promise.all([
    getLeadDetail(params.id),
    getCurrentUser(),
    getAssignableUsers(),
    getAvailableUnitsForConversion(),
    getStageMapByKey("LEAD_NURTURE"),
  ]);
  if (!lead) notFound();
  const syncedItems = await getLeadSyncedItems(lead.customer.id);
  const timelineItems = [
    ...lead.activities.map((a) => ({ id: a.id, type: a.type, subject: null as string | null, notes: a.description, occurredAt: a.occurredAt, by: a.by })),
    ...syncedItems,
  ].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

  // Real, server-enforced ownership check (src/lib/permissions.ts) per the Devtraco CRM Roles &
  // Permissions Specification — the same engine mutating Server Actions check, not just this
  // page's UI. Read-only roles (Executives) never get the action bar, regardless of scope.
  const profile = await getPermissionProfile(currentUser.id);
  let canManage = !profile.isReadOnly;
  if (canManage && lead.assignedToId) {
    try {
      await assertCanAccessRecord(profile, lead.assignedToId);
    } catch {
      canManage = false;
    }
  }

  const budgetRange =
    lead.budgetMin || lead.budgetMax
      ? `${lead.budgetMin ? formatCurrency(lead.budgetMin, lead.currency) : "--"} – ${lead.budgetMax ? formatCurrency(lead.budgetMax, lead.currency) : "--"}`
      : null;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/leads" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Leads
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold">
              {lead.customer.firstName} {lead.customer.lastName}
            </h1>
            <LeadStatusBadge
              status={lead.status}
              label={stagesByKey.get(lead.status)?.label ?? lead.status}
              badgeVariant={stagesByKey.get(lead.status)?.badgeVariant ?? "outline"}
            />
            <QualificationBadge status={lead.qualificationStatus as never} />
            {lead.customer.segment && <SegmentBadge segment={lead.customer.segment} />}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {lead.source} {lead.campaign ? `· ${lead.campaign}` : ""} · Created {formatDate(lead.createdAt)}
          </p>
          {lead.status === "UNQUALIFIED" && lead.lostReason && (
            <p className="mt-1 text-sm text-destructive">
              Disqualified: {LOST_REASON_LABEL[lead.lostReason] ?? lead.lostReason}
              {lead.lostReasonNote ? ` — ${lead.lostReasonNote}` : ""}
            </p>
          )}
        </div>

        {canManage ? (
          <LeadActionBar
            leadId={lead.id}
            status={lead.status}
            leadCurrency={lead.currency}
            currentUser={currentUser}
            assignableUsers={assignableUsers}
            availableUnits={availableUnits}
          />
        ) : (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
            <Lock className="size-4 shrink-0" />
            Read-only — owned by {orEmpty(lead.assignedTo)}
          </div>
        )}
      </div>

      <EngagementScore lead={lead} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Activities ({timelineItems.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({lead.tasks.length})</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities ({lead.opportunities.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Key details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Email"
                value={orEmpty(lead.customer.email)}
                href={lead.customer.email ? `mailto:${lead.customer.email}` : undefined}
              />
              <Field label="Phone" value={lead.customer.phone} href={lead.customer.phone ? `tel:${lead.customer.phone}` : undefined} />
              <Field label="Assigned To" value={orEmpty(lead.assignedTo)} />
              <Field
                label="Buyer Segment"
                value={lead.customer.segment ? SEGMENT_LABEL[lead.customer.segment] ?? lead.customer.segment : "--"}
              />
              <Field label="Budget" value={budgetRange ?? "--"} />
              <Field label="Property Interest" value={orEmpty(lead.propertyType)} />
              <Field label="Preferred Location" value={orEmpty(lead.preferredLocation)} />
              {lead.suspectedPersona && <Field label="Suspected Persona" value={lead.suspectedPersona} />}
              {lead.referredBy && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Referred By</p>
                  <div className="flex items-center gap-2">
                    <Link href={`/customers/${lead.referredBy.id}`} className="text-sm text-primary hover:underline">
                      {lead.referredBy.name}
                    </Link>
                    <Badge variant={lead.referralRewardStatus === "REWARDED" ? "success" : "warning"}>
                      {lead.referralRewardStatus === "REWARDED" ? "Rewarded" : "Reward pending"}
                    </Badge>
                    {lead.referralRewardStatus === "PENDING" && (
                      <form action={markReferralRewarded.bind(null, lead.id, currentUser.id)}>
                        <button type="submit" className="text-xs text-primary hover:underline">
                          Mark rewarded
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-foreground">{orEmpty(lead.notes)}</p>
              {lead.suspectedPersonaNote && (
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Persona Notes</p>
                  <p className="mt-1 text-sm text-foreground">{lead.suspectedPersonaNote}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardContent className="p-5">
              <InteractionTimeline items={timelineItems} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardContent className="p-5">
              {lead.tasks.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No tasks yet.</p>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {lead.tasks.map((t) => (
                    <div key={t.id} className="flex items-start justify-between gap-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.title}</p>
                        {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {t.assignedTo}
                          {t.dueDate ? ` · Due ${formatDate(t.dueDate)}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <Badge variant={t.priority === "CRITICAL" || t.priority === "HIGH" ? "destructive" : "outline"}>
                          {t.priority.toLowerCase()}
                        </Badge>
                        <Badge variant={t.status === "COMPLETED" ? "success" : "secondary"}>
                          {t.status.toLowerCase().replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities">
          <Card>
            <CardContent className="p-5">
              {lead.opportunities.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No opportunities yet.</p>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {lead.opportunities.map((o) => (
                    <div key={o.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">{orEmpty(o.unitNumber)}</p>
                        <p className="text-xs text-muted-foreground capitalize">{o.stage.toLowerCase().replace("_", " ")}</p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums">{formatCurrency(o.expectedValue, o.currency)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Document uploads are on the roadmap for this module.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, value, href }: { label: string; value: string; href?: string }) {
  const isEmpty = value === "--";
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {href && !isEmpty ? (
        <a href={href} className="text-sm text-primary hover:underline">
          {value}
        </a>
      ) : (
        <p className={isEmpty ? "text-sm text-muted-foreground" : "text-sm text-foreground"}>{value}</p>
      )}
    </div>
  );
}
