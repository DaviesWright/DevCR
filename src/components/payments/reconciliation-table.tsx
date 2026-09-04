"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { retryBcSync, retryAllFailedBcSyncs } from "@/lib/actions/payments";
import type { getBcMirrorTransactions } from "@/lib/queries/payments";

const STATUS_VARIANT: Record<string, "secondary" | "success" | "destructive"> = {
  PENDING: "secondary",
  SYNCED: "success",
  FAILED: "destructive",
};

export function ReconciliationTable({
  rows,
  currentUserId,
  bcConfigured,
}: {
  rows: Awaited<ReturnType<typeof getBcMirrorTransactions>>;
  currentUserId: string;
  bcConfigured: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  async function retry(id: string) {
    setPending(id);
    try {
      await retryBcSync(id, currentUserId);
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  async function retryAll() {
    setPending("all");
    try {
      await retryAllFailedBcSyncs(currentUserId);
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  const retryable = rows.filter((r) => r.status !== "SYNCED");

  return (
    <div className="flex flex-col gap-3">
      {!bcConfigured && (
        <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          Business Central isn't configured (BC_TENANT_ID / BC_CLIENT_ID / BC_CLIENT_SECRET / BC_ENVIRONMENT /
          BC_COMPANY_ID) — payments still record and mirror rows still get created, they just stay PENDING until an
          Azure AD app registration is added to .env.
        </div>
      )}
      {bcConfigured && retryable.length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" disabled={pending === "all"} onClick={retryAll}>
            {pending === "all" ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Retry all pending/failed ({retryable.length})
          </Button>
        </div>
      )}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>BC journal</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No transactions yet — they appear here the moment a payment is recorded in Payments.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.customerName}</TableCell>
                  <TableCell className="tabular-nums">{formatCurrency(r.amount, r.currency)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[r.status] ?? "secondary"}>{r.status}</Badge>
                    {r.syncError && <p className="mt-1 max-w-xs truncate text-xs text-destructive">{r.syncError}</p>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.bcJournalId ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</TableCell>
                  <TableCell>
                    {r.status !== "SYNCED" && bcConfigured && (
                      <Button variant="ghost" size="sm" disabled={pending === r.id} onClick={() => retry(r.id)}>
                        {pending === r.id ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                        Retry
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
