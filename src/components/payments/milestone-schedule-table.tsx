"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { MilestoneScheduleRow } from "@/lib/queries/payments";

const STATUS_VARIANT: Record<string, "secondary" | "info" | "destructive" | "success" | "outline"> = {
  PENDING: "secondary",
  PARTIAL: "info",
  OVERDUE: "destructive",
  PAID: "success",
  WAIVED: "outline",
};

const ALL_PROJECTS = "__all__";

export function MilestoneScheduleTable({ rows }: { rows: MilestoneScheduleRow[] }) {
  const [project, setProject] = React.useState(ALL_PROJECTS);
  const [query, setQuery] = React.useState("");

  const projects = React.useMemo(() => [...new Set(rows.map((r) => r.developmentName))].sort(), [rows]);

  const filtered = rows.filter((r) => {
    if (project !== ALL_PROJECTS && r.developmentName !== project) return false;
    if (query && !`${r.unitNumber} ${r.customerName} ${r.agentName ?? ""}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search unit, customer, or agent..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={project} onValueChange={setProject}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_PROJECTS}>All projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Sales agent</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No schedules match.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.scheduleId}>
                  <TableCell className="text-sm font-medium">
                    <Link href={`/payments/${r.saleId}`} className="hover:underline">
                      {r.unitNumber}
                    </Link>
                    {r.milestoneLabel && <p className="text-xs font-normal text-muted-foreground">{r.milestoneLabel}</p>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.developmentName}</TableCell>
                  <TableCell className="text-sm">{r.customerName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.agentName ?? "Unassigned"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(r.dueDate)}</TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {formatCurrency(r.amountPaid, r.currency)} / {formatCurrency(r.amountDue, r.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[r.status] ?? "secondary"}>{r.status}</Badge>
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
