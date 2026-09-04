import Link from "next/link";
import { CircleDollarSign, FileSignature, HardHat, KeyRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { MilestoneTypeSummary } from "@/lib/queries/payments";

const MILESTONE_ICON: Record<string, typeof CircleDollarSign> = {
  RESERVATION: CircleDollarSign,
  SPA_EXECUTION: FileSignature,
  CONSTRUCTION: HardHat,
  HANDOVER: KeyRound,
};

// CX-Playbook-style stage tiles — each is an aggregate across every sale for one milestone type,
// drilling into the individual schedule rows at src/app/(app)/payments/milestones/[type]/page.tsx.
export function MilestoneTiles({ summary }: { summary: MilestoneTypeSummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summary.map((s) => {
        const Icon = MILESTONE_ICON[s.type] ?? CircleDollarSign;
        const pct = s.totalDue > 0 ? Math.round((s.totalCollected / s.totalDue) * 100) : 0;
        return (
          <Link key={s.type} href={`/payments/milestones/${s.type}`} className="block">
            <Card className="h-full transition-colors hover:border-primary/40 hover:bg-accent/40">
              <CardContent className="flex flex-col gap-2 p-5">
                <div className="flex items-center justify-between">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  {s.overdueCount > 0 && (
                    <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                      {s.overdueCount} overdue
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                <p className="font-heading text-xl font-semibold tabular-nums">
                  {s.paidCount}/{s.count} <span className="text-sm font-normal text-muted-foreground">paid</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(s.totalCollected)} of {formatCurrency(s.totalDue)} ({pct}%)
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
