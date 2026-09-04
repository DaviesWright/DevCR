import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getOrderedStages } from "@/lib/pipeline/stages";
import type { NurtureLeadRow } from "@/lib/queries/nurture";

// Server component (no "use client") — self-fetches the ordered, admin-configurable
// LEAD_NURTURE stage list rather than requiring the parent page (src/app/(app)/leads/page.tsx,
// owned by a different agent in this migration) to fetch and pass stages down as a prop.
export async function NurturePipeline({ leads }: { leads: NurtureLeadRow[] }) {
  const allStages = await getOrderedStages("LEAD_NURTURE");
  const stages = allStages.filter((s) => s.countsAsNurtureActive);

  const byStage = new Map<string, NurtureLeadRow[]>();
  for (const stage of stages) byStage.set(stage.key, []);
  for (const lead of leads) byStage.get(lead.status)?.push(lead);

  const staleCount = leads.filter((l) => l.isStale).length;

  return (
    <div className="flex flex-col gap-3">
      {staleCount > 0 && (
        <p className="flex items-center gap-1.5 text-sm text-warning">
          <AlertTriangle className="size-4" />
          {staleCount} lead{staleCount === 1 ? "" : "s"} past its stage's staleness threshold — nobody's chasing them.
        </p>
      )}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageLeads = byStage.get(stage.key) ?? [];
          return (
            <div key={stage.key} className="flex w-64 shrink-0 flex-col gap-2 rounded-lg border border-border bg-muted/40 p-2">
              <div className="flex items-center justify-between px-1.5 py-1">
                <span className="text-sm font-semibold text-foreground">{stage.label}</span>
                <span className="text-xs text-muted-foreground">{stageLeads.length}</span>
              </div>
              <div className="flex min-h-16 flex-col gap-2">
                {stageLeads.map((lead) => (
                  <Link key={lead.id} href={`/leads/${lead.id}`}>
                    <Card className={cn("shadow-sm hover:border-primary/40", lead.isStale && "border-warning/50")}>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium text-foreground">{lead.customerName}</p>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{lead.assignedToName}</span>
                          <span>BANT {lead.bantScore}</span>
                        </div>
                        <div className="mt-2">
                          {lead.isStale ? (
                            <Badge variant="warning" className="text-[10px]">
                              Stale · {lead.daysSinceActivity}d (threshold {lead.staleThresholdDays}d)
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">
                              Active {lead.daysSinceActivity}d ago
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
