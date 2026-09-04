import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReconciliationTable } from "@/components/payments/reconciliation-table";
import { getBcMirrorTransactions, getBcReconciliationSummary } from "@/lib/queries/payments";
import { getCurrentUser } from "@/lib/queries/reference";
import { isBCConfigured } from "@/lib/integrations/config";

export default async function ReconciliationPage() {
  const [rows, summary, currentUser] = await Promise.all([
    getBcMirrorTransactions(),
    getBcReconciliationSummary(),
    getCurrentUser(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/payments" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Payments
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-semibold">BC Reconciliation</h1>
        <p className="text-sm text-muted-foreground">
          Every payment recorded in DevCRM mirrors here for Business Central reconciliation — {summary.synced} synced,{" "}
          {summary.pending} pending, {summary.failed} failed.
        </p>
      </div>

      <ReconciliationTable rows={rows} currentUserId={currentUser.id} bcConfigured={isBCConfigured()} />
    </div>
  );
}
