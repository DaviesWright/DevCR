"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2, DollarSign, Clock3, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { formatCurrency, formatDate } from "@/lib/utils";
import { recordPayment, updatePaymentScheduleAmount } from "@/lib/actions/payments";
import { MILESTONE_TYPE_LABEL, type PaymentScheduleDetail } from "@/lib/queries/payments";

const STATUS_VARIANT: Record<string, "secondary" | "warning" | "info" | "success" | "destructive" | "outline"> = {
  PENDING: "secondary",
  PARTIAL: "info",
  OVERDUE: "destructive",
  PAID: "success",
  WAIVED: "outline",
};

// Same stage order as the standard schedule (src/lib/payments/schedule.ts) so groups always
// render Reservation → SPA → Construction → Handover regardless of DB return order. Rows with no
// milestoneType (legacy generic instalments predating this feature) fall into "Other".
const GROUP_ORDER = ["RESERVATION", "SPA_EXECUTION", "CONSTRUCTION", "HANDOVER", "OTHER"];

const PAYMENT_METHODS = ["BANK_TRANSFER", "CASH", "MOBILE_MONEY", "CARD", "CHEQUE", "OTHER"] as const;

export function PaymentScheduleView({ detail, currentUserId }: { detail: PaymentScheduleDetail; currentUserId: string }) {
  const [payingScheduleId, setPayingScheduleId] = React.useState<string | null>(null);
  const payingSchedule = detail.schedules.find((s) => s.id === payingScheduleId) ?? null;
  const [editingScheduleId, setEditingScheduleId] = React.useState<string | null>(null);
  const editingSchedule = detail.schedules.find((s) => s.id === editingScheduleId) ?? null;

  const totalPaid = detail.schedules.reduce((sum, s) => sum + s.amountPaid, 0);
  const pct = detail.totalAmount > 0 ? Math.min(Math.round((totalPaid / detail.totalAmount) * 100), 100) : 0;

  // Grouped by milestone type — CX-Playbook checklist style (one Card per stage/group, its
  // schedule row(s) rendered like that group's steps) instead of one flat list of instalments.
  const groups = new Map<string, PaymentScheduleDetail["schedules"]>();
  for (const s of detail.schedules) {
    const key = s.milestoneType ?? "OTHER";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }
  const orderedGroups = GROUP_ORDER.filter((g) => groups.has(g)).map((g) => ({ type: g, schedules: groups.get(g)! }));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment plan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {formatCurrency(totalPaid, detail.currency)} of {formatCurrency(detail.totalAmount, detail.currency)} collected
            </span>
            <span className="font-medium text-foreground">{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-2 rounded-full bg-success" style={{ width: `${pct}%` }} />
          </div>
        </CardContent>
      </Card>

      {orderedGroups.map((group) => (
        <Card key={group.type}>
          <CardHeader>
            <CardTitle className="text-base">{MILESTONE_TYPE_LABEL[group.type] ?? "Other Instalments"}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {group.schedules.map((s) => {
              const done = s.status === "PAID";
              const remaining = Math.max(s.amountDue - s.amountPaid, 0);
              return (
                <div key={s.id} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      {done ? (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                      ) : s.status === "OVERDUE" ? (
                        <Clock3 className="mt-0.5 size-4 shrink-0 text-destructive" />
                      ) : (
                        <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.milestoneLabel ?? "Instalment"}</p>
                        <p className="text-xs text-muted-foreground">Due {formatDate(s.dueDate)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums text-foreground">{formatCurrency(s.amountDue, detail.currency)}</p>
                      <Badge variant={STATUS_VARIANT[s.status] ?? "secondary"}>{s.status}</Badge>
                    </div>
                  </div>

                  {s.payments.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2">
                      {s.payments.map((p) => (
                        <p key={p.id} className="text-xs text-muted-foreground">
                          {formatCurrency(p.amount, detail.currency)} via {p.method.replace(/_/g, " ").toLowerCase()} on{" "}
                          {formatDate(p.paidAt)}
                          {p.reference && ` · ref ${p.reference}`}
                          {p.receiptNo && ` · ${p.receiptNo}`}
                        </p>
                      ))}
                    </div>
                  )}

                  {!done && s.status !== "WAIVED" && (
                    <div className="mt-2 flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPayingScheduleId(s.id)}>
                        <DollarSign className="size-3.5" /> Record payment{" "}
                        {remaining !== s.amountDue && `(${formatCurrency(remaining, detail.currency)} left)`}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingScheduleId(s.id)}>
                        <Pencil className="size-3.5" /> Adjust
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {payingSchedule && (
        <RecordPaymentSheet
          scheduleId={payingSchedule.id}
          milestoneLabel={payingSchedule.milestoneLabel}
          currency={detail.currency}
          suggestedAmount={Math.max(payingSchedule.amountDue - payingSchedule.amountPaid, 0)}
          currentUserId={currentUserId}
          open={!!payingScheduleId}
          onOpenChange={(open) => !open && setPayingScheduleId(null)}
        />
      )}

      {editingSchedule && (
        <EditScheduleSheet
          scheduleId={editingSchedule.id}
          milestoneLabel={editingSchedule.milestoneLabel}
          currency={detail.currency}
          amountDue={editingSchedule.amountDue}
          amountPaid={editingSchedule.amountPaid}
          dueDate={editingSchedule.dueDate}
          currentUserId={currentUserId}
          open={!!editingScheduleId}
          onOpenChange={(open) => !open && setEditingScheduleId(null)}
        />
      )}
    </div>
  );
}

function EditScheduleSheet({
  scheduleId,
  milestoneLabel,
  currency,
  amountDue,
  amountPaid,
  dueDate,
  currentUserId,
  open,
  onOpenChange,
}: {
  scheduleId: string;
  milestoneLabel: string | null;
  currency: string;
  amountDue: number;
  amountPaid: number;
  dueDate: Date;
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = React.useState(String(amountDue));
  const [date, setDate] = React.useState(new Date(dueDate).toISOString().slice(0, 10));
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setAmount(String(amountDue));
      setDate(new Date(dueDate).toISOString().slice(0, 10));
      setError(null);
    }
  }, [open, amountDue, dueDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const numeric = parseFloat(amount);
    if (!numeric || numeric <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setSubmitting(true);
    try {
      await updatePaymentScheduleAmount({ scheduleId, amountDue: numeric, dueDate: date, actorId: currentUserId });
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update this instalment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Adjust instalment</SheetTitle>
          <SheetDescription>
            {milestoneLabel ?? "Instalment"} · tailor this deal&apos;s plan to the buyer&apos;s cash flow — the plan
            total updates automatically.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          {amountPaid > 0 && (
            <p className="text-xs text-muted-foreground">
              {formatCurrency(amountPaid, currency)} already collected — the new amount can&apos;t go below this.
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="scheduleAmount">Amount due ({currency})</Label>
            <Input
              id="scheduleAmount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="scheduleDueDate">Due date</Label>
            <Input id="scheduleDueDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Pencil className="size-3.5" />}
            Save changes
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function RecordPaymentSheet({
  scheduleId,
  milestoneLabel,
  currency,
  suggestedAmount,
  currentUserId,
  open,
  onOpenChange,
}: {
  scheduleId: string;
  milestoneLabel: string | null;
  currency: string;
  suggestedAmount: number;
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = React.useState(String(suggestedAmount));
  const [method, setMethod] = React.useState<(typeof PAYMENT_METHODS)[number]>("BANK_TRANSFER");
  const [reference, setReference] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) setAmount(String(suggestedAmount));
  }, [open, suggestedAmount]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const numeric = parseFloat(amount);
    if (!numeric || numeric <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setSubmitting(true);
    try {
      await recordPayment({ scheduleId, amount: numeric, method, reference, notes, actorId: currentUserId });
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Record payment</SheetTitle>
          <SheetDescription>{milestoneLabel ?? "Instalment"} · issues a receipt automatically</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Amount ({currency})</Label>
            <Input id="amount" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Payment method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reference">Reference</Label>
            <Input id="reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Bank ref / transaction ID" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <DollarSign className="size-3.5" />}
            Record payment & issue receipt
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
