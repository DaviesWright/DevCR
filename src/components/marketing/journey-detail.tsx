"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { enrollSegmentInJourney, advanceCustomerJourney } from "@/lib/actions/marketing";
import { relativeTime, orEmpty } from "@/lib/utils";
import type { getMarketingJourneyDetail } from "@/lib/queries/marketing";

type JourneyDetail = NonNullable<Awaited<ReturnType<typeof getMarketingJourneyDetail>>>;

const CJ_STATUS_VARIANT: Record<string, "highlight" | "success" | "secondary"> = {
  ACTIVE: "highlight",
  COMPLETED: "success",
  EXITED: "secondary",
};

export function JourneyDetailView({ journey, currentUserId }: { journey: JourneyDetail; currentUserId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [advancingId, setAdvancingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function enroll() {
    setPending(true);
    setError(null);
    try {
      await enrollSegmentInJourney(journey.id, currentUserId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enroll this segment.");
    } finally {
      setPending(false);
    }
  }

  async function advance(customerJourneyId: string) {
    setAdvancingId(customerJourneyId);
    await advanceCustomerJourney(customerJourneyId, currentUserId);
    router.refresh();
    setAdvancingId(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
        <p className="text-sm text-muted-foreground">Segment: {orEmpty(journey.segment?.name)}</p>
        <Button size="sm" onClick={enroll} disabled={pending || !journey.segment}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />} Enroll segment now
        </Button>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Steps</p>
        <ol className="relative flex flex-col gap-4 border-l border-border pl-4">
          {journey.steps.map((s) => (
            <li key={s.id} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[21px] top-0.5 flex size-4 items-center justify-center rounded-full bg-highlight text-[10px] font-semibold text-highlight-foreground"
              >
                {s.stepOrder}
              </span>
              <p className="text-sm font-medium text-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                {s.actionType.replace(/_/g, " ")}
                {s.waitHours ? ` · ${s.waitHours}h wait (display only)` : ""}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Current step</TableHead>
              <TableHead>Entered</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {journey.customerJourneys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No one enrolled yet.
                </TableCell>
              </TableRow>
            ) : (
              journey.customerJourneys.map((cj) => (
                <TableRow key={cj.id}>
                  <TableCell className="text-sm font-medium text-foreground">{cj.customerName}</TableCell>
                  <TableCell>
                    <Badge variant={CJ_STATUS_VARIANT[cj.status] ?? "secondary"}>{cj.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {cj.currentStepOrder ? `${cj.currentStepOrder}. ${cj.currentStepName}` : "--"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{relativeTime(cj.enteredAt)}</TableCell>
                  <TableCell>
                    {cj.status === "ACTIVE" && (
                      <Button variant="outline" size="sm" onClick={() => advance(cj.id)} disabled={advancingId === cj.id}>
                        {advancingId === cj.id ? <Loader2 className="size-3.5 animate-spin" /> : <SkipForward className="size-3.5" />}
                        Advance
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
