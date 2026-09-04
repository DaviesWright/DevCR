"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2, DollarSign, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  completeMilestoneStep,
  uncompleteMilestoneStep,
  confirmInstalmentReceived,
  approveCommission,
  markCommissionPaid,
  voidCommission,
} from "@/lib/actions/commissions";
import { MILESTONE_STEPS, isSpaEscalated, SPA_GRACE_PERIOD_DAYS, type MilestoneChecklist } from "@/lib/commission-milestones";
import type { SaleMilestoneDetail } from "@/lib/queries/commissions";

const STATUS_VARIANT: Record<string, "secondary" | "warning" | "info" | "success" | "destructive" | "outline"> = {
  PENDING: "secondary",
  AWAITING_APPROVAL: "info",
  APPROVED: "warning",
  HOLD: "warning",
  FROZEN: "destructive",
  PAID: "success",
  VOID: "outline",
};

export function MilestoneChecklistView({ sale, currentUserId }: { sale: SaleMilestoneDetail; currentUserId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  async function run(key: string, fn: () => Promise<void>) {
    setPending(key);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setPending(null);
    }
  }

  const checklist = sale.checklist;
  const spaEscalated = checklist ? isSpaEscalated(checklist as MilestoneChecklist) : false;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>T1 milestone checklist</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {spaEscalated && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              SPA not fully signed more than {SPA_GRACE_PERIOD_DAYS} days after deposit — escalated per the SPA Delay
              Protocol. Commission frozen until management records an override decision.
            </div>
          )}
          {MILESTONE_STEPS.map((step) => {
            const value = checklist?.[step.key] ?? null;
            const done = !!value;
            const isManagement = step.key === "managementApprovedAt";
            return (
              <div key={step.key} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                <div className="flex items-center gap-2.5">
                  {done ? (
                    <CheckCircle2 className="size-4 shrink-0 text-success" />
                  ) : (
                    <Circle className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm text-foreground">{step.label}</p>
                    {done && <p className="text-xs text-muted-foreground">{formatDate(value)}</p>}
                    {isManagement && sale.checklist?.managementApprovedByName && (
                      <p className="text-xs text-muted-foreground">by {sale.checklist.managementApprovedByName}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant={done ? "ghost" : "outline"}
                  size="sm"
                  disabled={pending === step.key}
                  onClick={() =>
                    run(step.key, () =>
                      done ? uncompleteMilestoneStep(sale.id, step.key) : completeMilestoneStep(sale.id, step.key, currentUserId)
                    )
                  }
                >
                  {pending === step.key ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  {done ? "Undo" : "Mark complete"}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commission tranches</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {sale.tranches.map((t) => (
            <div key={t.id} className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {t.tranche} — {t.percentage}%
                  </span>
                  <Badge variant={STATUS_VARIANT[t.status]}>{t.status.replace(/_/g, " ")}</Badge>
                </div>
                <span className="font-semibold tabular-nums">
                  {t.amount === null ? <span className="text-muted-foreground">Restricted</span> : formatCurrency(t.amount, t.currency)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t.agentName} ({t.agentCode})
                {t.holdReason ? ` · ${t.holdReason}` : ""}
              </p>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {t.tranche !== "T1" && !t.instalmentConfirmedAt && t.status !== "PAID" && t.status !== "VOID" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending === t.id}
                    onClick={() => run(t.id, () => confirmInstalmentReceived(t.id, currentUserId))}
                  >
                    {pending === t.id ? <Loader2 className="size-3.5 animate-spin" /> : null}
                    Confirm instalment received
                  </Button>
                )}
                {t.status === "AWAITING_APPROVAL" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending === t.id}
                    onClick={() => run(t.id, () => approveCommission(t.id, currentUserId))}
                  >
                    {pending === t.id ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                    Approve
                  </Button>
                )}
                {t.status === "APPROVED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending === t.id}
                    onClick={() => run(t.id, () => markCommissionPaid(t.id))}
                  >
                    {pending === t.id ? <Loader2 className="size-3.5 animate-spin" /> : <DollarSign className="size-3.5" />}
                    Mark paid
                  </Button>
                )}
                {t.status !== "PAID" && t.status !== "VOID" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={pending === t.id}
                    onClick={() => run(t.id, () => voidCommission(t.id))}
                  >
                    <Ban className="size-3.5" /> Void
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
