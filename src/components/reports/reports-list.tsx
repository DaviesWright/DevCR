"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, BarChart3, LineChart, PieChart, Table2, Hash, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReportBuilderSheet } from "@/components/reports/report-builder-sheet";
import type { getReportableEntities } from "@/lib/reports/schema";
import type { ReportListItem } from "@/lib/queries/reports";

const CHART_ICON = { BAR: BarChart3, LINE: LineChart, PIE: PieChart, TABLE: Table2, NUMBER: Hash } as const;

export function ReportsList({
  reports,
  entities,
  currentUserId,
}: {
  reports: ReportListItem[];
  entities: ReturnType<typeof getReportableEntities>;
  currentUserId: string;
}) {
  const [open, setOpen] = React.useState(false);
  const entityLabel = React.useMemo(() => new Map(entities.map((e) => [e.key, e.label])), [entities]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-3.5" /> New report
        </Button>
      </div>

      {reports.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No reports yet — build one from any table's data.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {reports.map((r) => {
            const Icon = CHART_ICON[r.config.chartType] ?? BarChart3;
            return (
              <Link key={r.id} href={`/reports/${r.id}`}>
                <Card className="h-full transition-colors hover:bg-accent/40">
                  <CardContent className="flex flex-col gap-2 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 text-muted-foreground" />
                        <p className="font-heading text-base font-semibold text-foreground">{r.name}</p>
                      </div>
                      {r.isShared && (
                        <Badge variant="outline">
                          <Users className="size-3" /> Shared
                        </Badge>
                      )}
                    </div>
                    {r.description && <p className="line-clamp-2 text-sm text-muted-foreground">{r.description}</p>}
                    <p className="text-xs text-muted-foreground">
                      {entityLabel.get(r.config.entity) ?? r.config.entity}
                      {r.createdByName ? ` · by ${r.createdByName}` : ""}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <ReportBuilderSheet open={open} onOpenChange={setOpen} entities={entities} currentUserId={currentUserId} />
    </div>
  );
}
