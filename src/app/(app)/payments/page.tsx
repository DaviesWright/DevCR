import Link from "next/link";
import { Wallet, TrendingUp, AlertTriangle, PiggyBank, Link2 } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshOverdueButton } from "@/components/payments/refresh-overdue-button";
import { MilestoneTiles } from "@/components/payments/milestone-tiles";
import {
  getFinanceKpis as getPaymentsKpis,
  getCollectionsByProject,
  getAgingSchedules,
  agingBucket,
  getFinancePipeline as getPaymentsPipeline,
  getRecentPayments,
  getMilestoneTypeSummary,
} from "@/lib/queries/payments";
import { getCurrentUser } from "@/lib/queries/reference";
import { formatCurrency, formatDate } from "@/lib/utils";

const PLAN_STATUS_VARIANT: Record<string, "secondary" | "success" | "destructive" | "warning"> = {
  ACTIVE: "secondary",
  COMPLETED: "success",
  DEFAULTED: "destructive",
  CANCELLED: "warning",
};

export default async function PaymentsPage() {
  const [kpis, byProject, aging, pipeline, recentPayments, currentUser, milestoneSummary] = await Promise.all([
    getPaymentsKpis(),
    getCollectionsByProject(),
    getAgingSchedules(),
    getPaymentsPipeline(),
    getRecentPayments(),
    getCurrentUser(),
    getMilestoneTypeSummary(),
  ]);

  const buckets = { current: 0, d30: 0, d60: 0, d90: 0 };
  for (const row of aging) buckets[agingBucket(row.daysOverdue)] += row.amountDue - row.amountPaid;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Payments</h1>
          <p className="text-sm text-muted-foreground">
            Property sale payment milestones, collections, aging, and Business Central reconciliation.
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshOverdueButton currentUserId={currentUser.id} />
          <Button variant="outline" asChild>
            <Link href="/payments/reconciliation">
              <Link2 className="size-4" /> BC Reconciliation
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total contracted" value={formatCurrency(kpis.totalContracted)} icon={Wallet} tone="primary" />
        <KpiCard title="Total collected" value={formatCurrency(kpis.totalCollected)} icon={TrendingUp} tone="success" />
        <KpiCard title="Outstanding" value={formatCurrency(kpis.totalOutstanding)} icon={PiggyBank} tone="info" />
        <KpiCard
          title="Overdue"
          value={`${formatCurrency(kpis.overdueAmount)} (${kpis.overdueCount})`}
          icon={AlertTriangle}
          tone="destructive"
        />
      </div>

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold">Milestones</h2>
        <MilestoneTiles summary={milestoneSummary} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Collections by project</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {byProject.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payment plans yet.</p>
            ) : (
              byProject.map((p) => {
                const pct = p.contracted > 0 ? Math.round((p.collected / p.contracted) * 100) : 0;
                return (
                  <div key={p.name} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">
                        {p.name} <span className="text-xs text-muted-foreground">({p.saleCount} sales)</span>
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatCurrency(p.collected)} / {formatCurrency(p.contracted)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted">
                      <div className="h-1.5 rounded-full bg-success" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aging (outstanding overdue)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            <AgingTile label="1–30 days" amount={buckets.d30} tone="warning" />
            <AgingTile label="31–60 days" amount={buckets.d60} tone="warning" />
            <AgingTile label="90+ days" amount={buckets.d90} tone="destructive" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment plans</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {pipeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payment plans yet — one is generated automatically the moment a deal is Closed Won.
            </p>
          ) : (
            pipeline.map((row) => {
              const pct = row.totalAmount > 0 ? Math.round((row.collected / row.totalAmount) * 100) : 0;
              return (
                <Link
                  key={row.saleId}
                  href={`/payments/${row.saleId}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-border p-3 hover:bg-accent/40"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Unit {row.unitNumber} — {row.customerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(row.collected, row.currency)} of {formatCurrency(row.totalAmount, row.currency)} ({pct}%)
                    </p>
                  </div>
                  <Badge variant={PLAN_STATUS_VARIANT[row.status] ?? "secondary"}>{row.status}</Badge>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent payments</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2 text-sm">
                <div>
                  <p className="text-foreground">
                    {p.customerName} <span className="text-xs text-muted-foreground">— {p.milestoneLabel ?? "Payment"}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(p.paidAt)} · {p.method.replace(/_/g, " ").toLowerCase()}
                    {p.receiptNo && ` · ${p.receiptNo}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium tabular-nums text-foreground">{formatCurrency(p.amount, p.currency)}</span>
                  {p.saleId && (
                    <Link href={`/payments/${p.saleId}`} className="text-xs text-primary hover:underline">
                      View
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AgingTile({ label, amount, tone }: { label: string; amount: number; tone: "warning" | "destructive" }) {
  return (
    <div className={`rounded-md px-3 py-2.5 ${tone === "destructive" ? "bg-destructive/10" : "bg-warning/10"}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-heading text-lg font-semibold tabular-nums ${tone === "destructive" ? "text-destructive" : "text-warning"}`}>
        {formatCurrency(amount)}
      </p>
    </div>
  );
}
