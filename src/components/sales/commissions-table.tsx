"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, DollarSign, Ban, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { approveCommission, markCommissionPaid, voidCommission } from "@/lib/actions/commissions";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CommissionListItem, SlaTier } from "@/lib/queries/commissions";

const STATUS_VARIANT: Record<string, "secondary" | "info" | "warning" | "success" | "destructive" | "outline"> = {
  PENDING: "secondary",
  AWAITING_APPROVAL: "info",
  APPROVED: "warning",
  HOLD: "warning",
  FROZEN: "destructive",
  PAID: "success",
  VOID: "outline",
};

const SLA_LABEL: Record<SlaTier, string> = {
  ON_TRACK: "On track",
  DUE_SOON: "Due today",
  ESCALATE_MANAGER: "Escalate: Sales Mgr",
  ESCALATE_FINANCE: "Escalate: Finance Dir",
};

const SLA_VARIANT: Record<SlaTier, "success" | "warning" | "destructive"> = {
  ON_TRACK: "success",
  DUE_SOON: "warning",
  ESCALATE_MANAGER: "destructive",
  ESCALATE_FINANCE: "destructive",
};

export function CommissionsTable({
  commissions,
  currentUserId,
}: {
  commissions: CommissionListItem[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function run(id: string, fn: () => Promise<void>) {
    setPendingId(id);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Unit</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Tranche</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>SLA</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {commissions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                No commissions yet — closing a deal on the Sales Pipeline creates the 3 milestone-gated tranches
                automatically.
              </TableCell>
            </TableRow>
          ) : (
            commissions.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="text-sm font-medium">
                  <Link href={`/sales/commissions/${c.saleId}`} className="hover:underline">
                    {c.unitNumber}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{c.customerName}</TableCell>
                <TableCell className="text-sm">
                  {c.agentName} <span className="text-muted-foreground">({c.agentCode})</span>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">
                      {c.tranche} · {c.percentage}%
                    </span>
                    {c.tranche === "T1" && c.milestoneStepsTotal !== null && (
                      <span
                        className={
                          c.spaEscalated
                            ? "text-xs text-destructive"
                            : "text-xs text-muted-foreground"
                        }
                      >
                        {c.milestoneStepsCompleted}/{c.milestoneStepsTotal}
                        {c.spaEscalated ? " · SPA escalated" : ""}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm font-semibold tabular-nums">
                  {c.amount === null ? <span className="text-muted-foreground">Restricted</span> : formatCurrency(c.amount, c.currency)}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[c.status]} dot>
                    {c.status.replace(/_/g, " ").toLowerCase().replace(/^./, (ch) => ch.toUpperCase())}
                  </Badge>
                </TableCell>
                <TableCell>
                  {c.slaTier ? (
                    <Badge variant={SLA_VARIANT[c.slaTier]}>{SLA_LABEL[c.slaTier]}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">--</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/sales/commissions/${c.saleId}`}>
                        <ListChecks className="size-3.5" /> Milestones
                      </Link>
                    </Button>
                    {c.status === "AWAITING_APPROVAL" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pendingId === c.id}
                        onClick={() => run(c.id, () => approveCommission(c.id, currentUserId))}
                      >
                        {pendingId === c.id ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                        Approve
                      </Button>
                    )}
                    {c.status === "APPROVED" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pendingId === c.id}
                        onClick={() => run(c.id, () => markCommissionPaid(c.id))}
                      >
                        {pendingId === c.id ? <Loader2 className="size-3.5 animate-spin" /> : <DollarSign className="size-3.5" />}
                        Mark Paid
                      </Button>
                    )}
                    {c.status !== "PAID" && c.status !== "VOID" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={pendingId === c.id}
                        onClick={() => run(c.id, () => voidCommission(c.id))}
                      >
                        <Ban className="size-3.5" /> Void
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
