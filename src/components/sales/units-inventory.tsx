"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, CalendarClock, XCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { cn, formatCurrency, relativeTime } from "@/lib/utils";
import { reserveUnit, cancelReservation, releaseExpiredReservations } from "@/lib/actions/sales";
import { MAX_RESERVATION_DAYS, type UnitInventoryRow } from "@/lib/queries/sales";

type ReservableLead = { leadId: string; customerId: string; status: string; label: string };

const STATUS_BADGE: Record<string, { label: string; variant: "success" | "warning" | "highlight" | "secondary" | "destructive" }> = {
  AVAILABLE: { label: "Available", variant: "success" },
  RESERVED: { label: "Reserved", variant: "warning" },
  SOLD: { label: "Sold", variant: "highlight" },
  UNDER_CONSTRUCTION: { label: "Under construction", variant: "secondary" },
  HANDED_OVER: { label: "Handed over", variant: "secondary" },
  BLOCKED: { label: "Blocked", variant: "destructive" },
};

export function UnitsInventory({
  units,
  leads,
  currentUserId,
}: {
  units: UnitInventoryRow[];
  leads: ReservableLead[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [reservingUnit, setReservingUnit] = React.useState<UnitInventoryRow | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [releasing, setReleasing] = React.useState(false);

  const expiredCount = units.filter((u) => u.reservation?.expired).length;

  const byDevelopment = React.useMemo(() => {
    const map = new Map<string, UnitInventoryRow[]>();
    for (const u of units) {
      const list = map.get(u.developmentName) ?? [];
      list.push(u);
      map.set(u.developmentName, list);
    }
    return map;
  }, [units]);

  async function handleCancel(reservationId: string) {
    setPendingId(reservationId);
    try {
      await cancelReservation(reservationId, currentUserId);
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  async function handleReleaseExpired() {
    setReleasing(true);
    try {
      await releaseExpiredReservations(currentUserId);
      router.refresh();
    } finally {
      setReleasing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {expiredCount > 0 && (
        <div className="flex items-center justify-between rounded-md border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-warning">
          <span>
            {expiredCount} reservation{expiredCount === 1 ? "" : "s"} passed the {MAX_RESERVATION_DAYS}-day hold
            without converting.
          </span>
          <Button variant="outline" size="sm" disabled={releasing} onClick={handleReleaseExpired}>
            {releasing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Release expired holds
          </Button>
        </div>
      )}

      {[...byDevelopment.entries()].map(([developmentName, rows]) => (
        <Card key={developmentName}>
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="font-heading text-sm font-semibold">{developmentName}</p>
              <p className="text-xs text-muted-foreground">
                {rows.length} listed · {rows[0]?.developmentTotalUnits.toLocaleString()} total inventory ·{" "}
                {rows[0]?.projectCode}
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hold</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((u) => {
                  const badge = STATUS_BADGE[u.status] ?? { label: u.status, variant: "secondary" as const };
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.unitNumber}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.propertyTypeName}
                      </TableCell>
                      <TableCell className="tabular-nums">{formatCurrency(u.currentPrice, u.currency)}</TableCell>
                      <TableCell>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {u.reservation ? (
                          <span
                            className={cn(
                              "flex items-center gap-1 text-xs",
                              u.reservation.expired ? "text-destructive" : "text-muted-foreground"
                            )}
                          >
                            <CalendarClock className="size-3" />
                            {u.reservation.customerName} ·{" "}
                            {u.reservation.expired ? "hold expired" : relativeTime(u.reservation.expiryDate)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {u.status === "AVAILABLE" && (
                          <Button variant="outline" size="sm" onClick={() => setReservingUnit(u)}>
                            Reserve
                          </Button>
                        )}
                        {u.status === "RESERVED" && u.reservation && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            disabled={pendingId === u.reservation.id}
                            onClick={() => handleCancel(u.reservation!.id)}
                          >
                            {pendingId === u.reservation.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <XCircle className="size-3.5" />
                            )}
                            Cancel hold
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      <ReserveUnitSheet
        unit={reservingUnit}
        leads={leads}
        currentUserId={currentUserId}
        onOpenChange={(open) => !open && setReservingUnit(null)}
      />
    </div>
  );
}

function ReserveUnitSheet({
  unit,
  leads,
  currentUserId,
  onOpenChange,
}: {
  unit: UnitInventoryRow | null;
  leads: ReservableLead[];
  currentUserId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [leadId, setLeadId] = React.useState("");
  const [days, setDays] = React.useState(String(MAX_RESERVATION_DAYS));
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (unit) {
      setLeadId("");
      setDays(String(MAX_RESERVATION_DAYS));
      setError(null);
    }
  }, [unit]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!unit || !leadId) return;
    setPending(true);
    setError(null);
    try {
      await reserveUnit({ unitId: unit.id, leadId, days: Number(days) || MAX_RESERVATION_DAYS, actorId: currentUserId });
      router.refresh();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reserve this unit.");
    } finally {
      setPending(false);
    }
  }

  const fee = unit ? Math.round(unit.currentPrice * 0.1) : 0;

  return (
    <Sheet open={!!unit} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Reserve {unit?.unitNumber}</SheetTitle>
          <SheetDescription>
            Holds this unit for a potential or qualified customer for up to {MAX_RESERVATION_DAYS} days.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div>
            <Label>Customer (lead) *</Label>
            <Select value={leadId} onValueChange={setLeadId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select a lead" />
              </SelectTrigger>
              <SelectContent>
                {leads.map((l) => (
                  <SelectItem key={l.leadId} value={l.leadId}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="reserveDays">Hold length (days, max {MAX_RESERVATION_DAYS}) *</Label>
            <Input
              id="reserveDays"
              type="number"
              min="1"
              max={MAX_RESERVATION_DAYS}
              className="mt-1.5"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              required
            />
          </div>
          {unit && (
            <p className="text-xs text-muted-foreground">
              Reservation fee: {formatCurrency(fee, unit.currency)} (10% of {formatCurrency(unit.currentPrice, unit.currency)}).
            </p>
          )}
          <Button type="submit" variant="highlight" disabled={pending || !leadId}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} Reserve unit
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
