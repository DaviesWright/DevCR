"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReportChart } from "@/components/reports/report-chart";
import { ReportBuilderSheet } from "@/components/reports/report-builder-sheet";
import { deleteReport } from "@/lib/actions/reports";
import type { getReportableEntities } from "@/lib/reports/schema";
import type { ReportDetail as ReportDetailType } from "@/lib/queries/reports";

export function ReportDetailView({
  report,
  entities,
  currentUserId,
}: {
  report: ReportDetailType;
  entities: ReturnType<typeof getReportableEntities>;
  currentUserId: string;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = React.useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${report.name}"? This can't be undone.`)) return;
    await deleteReport(report.id);
    router.push("/reports");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {report.description && <p className="text-sm text-muted-foreground">{report.description}</p>}
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            {report.createdByName ? `Created by ${report.createdByName}` : null}
            {report.isShared && (
              <Badge variant="outline">
                <Users className="size-3" /> Shared
              </Badge>
            )}
          </div>
        </div>
        {report.isOwn && (
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="size-3.5" /> Edit
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="size-3.5" /> Delete
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-5">
          <ReportChart chartType={report.config.chartType} result={report.result} />
        </CardContent>
      </Card>

      {report.isOwn && (
        <ReportBuilderSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          entities={entities}
          currentUserId={currentUserId}
          editing={{
            id: report.id,
            name: report.name,
            description: report.description,
            config: report.config,
            isShared: report.isShared,
            isOwn: report.isOwn,
            createdByName: report.createdByName,
            updatedAt: report.updatedAt,
          }}
        />
      )}
    </div>
  );
}
