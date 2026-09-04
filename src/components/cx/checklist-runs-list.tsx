"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orEmpty, relativeTime } from "@/lib/utils";
import type { ChecklistRunListItem } from "@/lib/queries/checklists";

export function ChecklistRunsList({ runs }: { runs: ChecklistRunListItem[] }) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tab</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Open Flags</TableHead>
            <TableHead>Started By</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                No checklists started yet — pick a template above and click "Start Checklist".
              </TableCell>
            </TableRow>
          ) : (
            runs.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-sm font-medium">
                  Tab {r.stageNumber}
                  <p className="text-xs font-normal text-muted-foreground">{r.templateTitle}</p>
                </TableCell>
                <TableCell className="text-sm">
                  <Link href={`/cx/playbook/runs/${r.id}`} className="text-foreground hover:underline">
                    {orEmpty(r.customerName ?? r.label)}
                  </Link>
                </TableCell>
                <TableCell className="text-sm tabular-nums">
                  {r.completedSteps}/{r.totalSteps}
                  <div className="mt-1 h-1.5 w-24 rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full bg-highlight"
                      style={{ width: `${r.totalSteps ? (r.completedSteps / r.totalSteps) * 100 : 0}%` }}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  {r.openFlags > 0 ? (
                    <Badge variant="destructive">{r.openFlags} open</Badge>
                  ) : (
                    <Badge variant="success">Clear</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm">{orEmpty(r.startedByName)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{relativeTime(r.startedAt)}</TableCell>
                <TableCell>
                  {r.completedAt ? <Badge variant="success">Complete</Badge> : <Badge variant="info">In progress</Badge>}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
