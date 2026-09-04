"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HandoverStatusBadge } from "@/components/cx/cx-badges";
import { scheduleHandover, completeHandover, cancelHandover } from "@/lib/actions/cx";
import { formatDate, orEmpty } from "@/lib/utils";
import type { HandoverRow } from "@/lib/queries/cx";

type CustomerUnitOption = { customerId: string; unitId: string; label: string };

export function HandoversPanel({
  handovers,
  customerUnits,
  currentUserId,
}: {
  handovers: HandoverRow[];
  customerUnits: CustomerUnitOption[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function handleComplete(id: string) {
    setPendingId(id);
    await completeHandover(id, currentUserId);
    router.refresh();
    setPendingId(null);
  }

  async function handleCancel(id: string) {
    setPendingId(id);
    await cancelHandover(id);
    router.refresh();
    setPendingId(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setScheduleOpen(true)}>
          <CalendarPlus className="size-3.5" /> Schedule Handover
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Conducted By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {handovers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No handovers scheduled yet.
                </TableCell>
              </TableRow>
            ) : (
              handovers.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="text-sm font-medium">{h.customer}</TableCell>
                  <TableCell className="text-sm">{h.unit}</TableCell>
                  <TableCell>
                    <HandoverStatusBadge status={h.status as never} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {h.scheduledAt ? formatDate(h.scheduledAt) : "--"}
                  </TableCell>
                  <TableCell className="text-sm">{orEmpty(h.conductedBy)}</TableCell>
                  <TableCell className="text-right">
                    {h.status === "SCHEDULED" && (
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pendingId === h.id}
                          onClick={() => handleComplete(h.id)}
                        >
                          {pendingId === h.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-3.5" />
                          )}{" "}
                          Complete
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={pendingId === h.id}
                          onClick={() => handleCancel(h.id)}
                        >
                          <XCircle className="size-3.5" /> Cancel
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ScheduleHandoverSheet open={scheduleOpen} onOpenChange={setScheduleOpen} customerUnits={customerUnits} currentUserId={currentUserId} />
    </div>
  );
}

function ScheduleHandoverSheet({
  open,
  onOpenChange,
  customerUnits,
  currentUserId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerUnits: CustomerUnitOption[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [customerUnitKey, setCustomerUnitKey] = React.useState("");
  const [scheduledAt, setScheduledAt] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerUnitKey || !scheduledAt) return;
    const [customerId, unitId] = customerUnitKey.split(":");
    setPending(true);
    await scheduleHandover({ customerId, unitId, scheduledAt, actorId: currentUserId });
    router.refresh();
    setPending(false);
    setCustomerUnitKey("");
    setScheduledAt("");
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Schedule handover</SheetTitle>
          <SheetDescription>Creates a handover record for Client Experience to track.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div>
            <Label>Customer & unit *</Label>
            <Select value={customerUnitKey} onValueChange={setCustomerUnitKey}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customerUnits.map((cu) => (
                  <SelectItem key={`${cu.customerId}:${cu.unitId}`} value={`${cu.customerId}:${cu.unitId}`}>
                    {cu.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="scheduledAt">Date & time *</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              className="mt-1.5"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={pending || !customerUnitKey || !scheduledAt}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} Schedule
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
