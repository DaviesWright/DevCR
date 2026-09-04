import Link from "next/link";
import { Wallet, Scale, Trophy, Coins, Banknote, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PipelineBoard } from "@/components/sales/pipeline-board";
import { getPipelineKanban, getPipelineKpis } from "@/lib/queries/sales";
import { getCurrentUser } from "@/lib/queries/reference";
import { getPermissionProfile } from "@/lib/permissions";
import { getOrderedStages } from "@/lib/pipeline/stages";
import { formatCurrency } from "@/lib/utils";

export default async function SalesPage() {
  const currentUser = await getCurrentUser();
  const profile = await getPermissionProfile(currentUser.id);
  const [opportunities, kpis, stages] = await Promise.all([
    getPipelineKanban(profile),
    getPipelineKpis(profile),
    getOrderedStages("SALES_OPPORTUNITY"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Sales Pipeline</h1>
          <p className="text-sm text-muted-foreground">Drag a card to move it between stages.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/sales/performance">
              <LineChart className="size-4" /> Performance
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/sales/commissions">
              <Banknote className="size-4" /> Commissions
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Pipeline value" value={formatCurrency(kpis.pipelineValue)} icon={Wallet} tone="primary" href="/sales/performance" />
        <KpiCard title="Weighted pipeline" value={formatCurrency(kpis.weightedPipeline)} icon={Scale} tone="info" href="/sales/performance" />
        <KpiCard title="Win rate" value={`${kpis.winRate.toFixed(1)}%`} icon={Trophy} tone="success" href="/sales/performance" />
        <KpiCard title="Avg. deal size" value={formatCurrency(kpis.avgDealSize)} icon={Coins} tone="highlight" href="/sales/performance" />
      </div>

      <PipelineBoard opportunities={opportunities} currentUserId={currentUser.id} stages={stages} />
    </div>
  );
}
