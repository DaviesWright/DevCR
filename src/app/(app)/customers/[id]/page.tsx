import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadStatusBadge, QualificationBadge, SegmentBadge } from "@/components/leads/lead-status-badge";
import { ComplaintStatusBadge, HandoverStatusBadge } from "@/components/cx/cx-badges";
import { CustomerMarketingPanel } from "@/components/marketing/customer-marketing-panel";
import { CustomerInteractions } from "@/components/customers/customer-interactions";
import { getCustomerDetail } from "@/lib/queries/customers";
import { getCustomerMarketingProfile } from "@/lib/queries/marketing";
import { getInteractionTimeline } from "@/lib/queries/interactions";
import { getCurrentUser } from "@/lib/queries/reference";
import { getPermissionProfile } from "@/lib/permissions";
import { formatCurrency, formatDate, orEmpty } from "@/lib/utils";

const KYC_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  VERIFIED: "success",
  PENDING: "warning",
  REJECTED: "destructive",
};

const TIER_VARIANT: Record<string, "highlight" | "success" | "info" | "secondary"> = {
  PLATINUM: "highlight",
  PRESTIGE: "success",
  EXECUTIVE: "info",
  PREMIUM: "secondary",
};

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();
  const profile = await getPermissionProfile(currentUser.id);
  const [customer, marketingProfile] = await Promise.all([
    getCustomerDetail(params.id, profile),
    getCustomerMarketingProfile(params.id),
  ]);
  if (!customer) notFound();
  const interactionTimeline = await getInteractionTimeline("CUSTOMER", params.id, params.id);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/customers" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Customers
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold">{customer.name}</h1>
          <Badge variant={KYC_VARIANT[customer.kycStatus] ?? "outline"}>KYC: {customer.kycStatus.toLowerCase()}</Badge>
          {customer.segment && <SegmentBadge segment={customer.segment} />}
          {customer.lifetimeValue !== null && customer.lifetimeValue > 0 && (
            <Badge variant={TIER_VARIANT[customer.purchaseTier.key]}>
              {customer.purchaseTier.icon} {customer.purchaseTier.label}
            </Badge>
          )}
          {customer.isMultiProjectBuyer && <Badge variant="highlight">Multi-project buyer</Badge>}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {customer.phone} {customer.email ? `· ${customer.email}` : ""} · Customer since {formatDate(customer.createdAt)}
          {customer.assignedSalesRep ? ` · Rep: ${customer.assignedSalesRep}` : ""}
        </p>
        {customer.lifetimeValue === null ? (
          <p className="mt-1 text-sm text-muted-foreground">Lifetime value: Restricted for your role.</p>
        ) : (
          customer.lifetimeValue > 0 && (
            <p className="mt-1 text-sm">
              Lifetime value: <span className="font-semibold tabular-nums">{formatCurrency(customer.lifetimeValue)}</span>
              {customer.isMultiProjectBuyer && (
                <span className="text-muted-foreground"> · Across {customer.developmentNames.join(", ")}</span>
              )}
            </p>
          )
        )}
      </div>

      {marketingProfile && (
        <CustomerMarketingPanel customerId={customer.id} profile={marketingProfile} currentUserId={currentUser.id} />
      )}

      <CustomerInteractions customerId={customer.id} timeline={interactionTimeline} currentUser={{ id: currentUser.id, name: currentUser.name }} />

      <Card>
        <CardHeader>
          <CardTitle>Sales journey — Leads ({customer.leads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.leads.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No leads yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {customer.leads.map((l) => (
                <Link
                  key={l.id}
                  href={`/leads/${l.id}`}
                  className="flex items-center justify-between gap-4 py-3 hover:bg-accent/40"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{l.source}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(l.createdAt)}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <LeadStatusBadge status={l.status} label={l.statusLabel} badgeVariant={l.statusBadgeVariant} />
                    <QualificationBadge status={l.qualificationStatus as never} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {customer.referralsGiven.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Referrals made ({customer.referralsGiven.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y divide-border">
              {customer.referralsGiven.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-4 py-3">
                  <p className="text-sm font-medium text-foreground">{r.leadName}</p>
                  <Badge variant={r.rewardStatus === "REWARDED" ? "success" : "warning"}>
                    {r.rewardStatus === "REWARDED" ? "Rewarded" : "Reward pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Opportunities ({customer.opportunities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.opportunities.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No opportunities yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {customer.opportunities.map((o) => (
                <Link
                  key={o.id}
                  href={`/sales/opportunities/${o.id}`}
                  className="flex items-center justify-between py-3 hover:bg-accent/40"
                >
                  <div>
                    <p className="text-sm font-medium">{orEmpty(o.unitNumber)}</p>
                    <p className="text-xs capitalize text-muted-foreground">{o.stage.toLowerCase().replace("_", " ")}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{formatCurrency(o.expectedValue, o.currency)}</p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales &amp; payment history ({customer.sales.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.sales.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No sales yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {customer.sales.map((s) => {
                const pct = s.totalAmount > 0 ? Math.min(100, (s.paidAmount / s.totalAmount) * 100) : 0;
                return (
                  <div key={s.id} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        Unit {s.unitNumber} · {formatCurrency(s.salePrice, s.currency)}
                      </p>
                      <Badge variant={s.status === "COMPLETED" ? "success" : s.status === "DEFAULTED" ? "destructive" : "info"}>
                        {s.status.toLowerCase()}
                      </Badge>
                    </div>
                    {s.paymentPlanStatus ? (
                      <>
                        <div className="mt-2 h-1.5 rounded-full bg-muted">
                          <div className="h-1.5 rounded-full bg-success" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Paid {formatCurrency(s.paidAmount, s.currency)} of {formatCurrency(s.totalAmount, s.currency)}
                          </span>
                          <span>
                            Balance {formatCurrency(s.balance, s.currency)}
                            {s.overdueInstallments > 0 && (
                              <span className="ml-2 text-destructive">{s.overdueInstallments} overdue</span>
                            )}
                          </span>
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">No payment plan on file.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Complaints ({customer.complaints.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.complaints.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No complaints on file.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {customer.complaints.map((c) => (
                  <Link
                    key={c.id}
                    href={`/cx/complaints/${c.id}`}
                    className="flex items-center justify-between gap-4 py-3 hover:bg-accent/40"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.subject}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(c.openedAt)}</p>
                    </div>
                    <ComplaintStatusBadge status={c.status as never} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Handovers ({customer.handovers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.handovers.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No handovers yet.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {customer.handovers.map((h) => (
                  <div key={h.id} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Unit {h.unitNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {h.completedAt ? `Completed ${formatDate(h.completedAt)}` : h.scheduledAt ? `Scheduled ${formatDate(h.scheduledAt)}` : "--"}
                      </p>
                    </div>
                    <HandoverStatusBadge status={h.status as never} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
