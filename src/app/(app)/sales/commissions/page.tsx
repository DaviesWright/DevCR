import Link from "next/link";
import { ArrowLeft, Clock3, BadgeCheck, Wallet, AlertTriangle, Snowflake } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommissionsTable } from "@/components/sales/commissions-table";
import { getCommissionsList, getCommissionKpis, getAgentCommissionSummary } from "@/lib/queries/commissions";
import { getCurrentUser } from "@/lib/queries/reference";
import { getPermissionProfile } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";

// Field-level permission (SALE.amount HIDDEN for CX roles) redacts these to null — show a
// clear "Restricted" label rather than letting formatCurrency coerce null to a misleading $0.
function amountLabel(amount: number | null) {
  return amount === null ? "Restricted" : formatCurrency(amount);
}

export default async function CommissionsPage() {
  const currentUser = await getCurrentUser();
  const profile = await getPermissionProfile(currentUser.id);
  const [commissions, kpis, agentSummary] = await Promise.all([
    getCommissionsList(profile),
    getCommissionKpis(profile),
    getAgentCommissionSummary(profile),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/sales" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Sales Pipeline
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-semibold">Commissions</h1>
        <p className="text-sm text-muted-foreground">
          3 milestone-gated tranches (T1 80% / T2 10% / T3 10%) auto-created on Closed Won. T1 releases once the
          milestone checklist is complete; T2/T3 release once their instalment is confirmed and the preceding tranche
          is paid.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard title="Awaiting approval" value={amountLabel(kpis.pendingAmount)} icon={Clock3} tone="warning" href="/sales/commissions" />
        <KpiCard title="Approved" value={amountLabel(kpis.approvedAmount)} icon={BadgeCheck} tone="info" href="/sales/commissions" />
        <KpiCard title="Paid this month" value={amountLabel(kpis.paidThisMonthAmount)} icon={Wallet} tone="success" href="/sales/commissions" />
        <KpiCard title="SLA overdue" value={String(kpis.overdueCount)} icon={AlertTriangle} tone="destructive" href="/sales/commissions" />
        <KpiCard title="Held / Frozen" value={String(kpis.frozenOrHeldCount)} icon={Snowflake} tone="destructive" href="/sales/commissions" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {agentSummary.map((a) => (
            <div key={a.agentId} className="rounded-md bg-muted px-3 py-2.5">
              <p className="text-sm font-medium text-foreground">
                {a.name} <span className="text-xs text-muted-foreground">({a.agentCode})</span>
              </p>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                <span>Pending {amountLabel(a.pendingAmount)}</span>
                <span>Approved {amountLabel(a.approvedAmount)}</span>
                <span>Paid {amountLabel(a.paidAmount)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <CommissionsTable commissions={commissions} currentUserId={currentUser.id} />
    </div>
  );
}
