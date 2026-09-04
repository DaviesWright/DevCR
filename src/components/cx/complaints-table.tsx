"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ComplaintStatusBadge, PriorityBadge, SlaBadge } from "@/components/cx/cx-badges";
import { Badge } from "@/components/ui/badge";
import { formatDate, orEmpty } from "@/lib/utils";
import type { ComplaintListItem } from "@/lib/queries/cx";
import { ESCALATION_LABEL, type EscalationLevel } from "@/lib/cx-sla";

const ESCALATION_VARIANT: Record<EscalationLevel, "secondary" | "warning" | "destructive"> = {
  0: "secondary",
  1: "warning",
  2: "warning",
  3: "destructive",
  4: "destructive",
};

const STATUS_FILTERS = ["ALL", "OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"] as const;

const STATUS_FILTER_LABEL: Record<(typeof STATUS_FILTERS)[number], string> = {
  ALL: "All statuses",
  OPEN: "Open",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  REOPENED: "Reopened",
};

export function ComplaintsTable({ complaints }: { complaints: ComplaintListItem[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("ALL");

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        c.subject.toLowerCase().includes(q) ||
        c.customer.toLowerCase().includes(q) ||
        (c.unit ?? "").toLowerCase().includes(q)
      );
    });
  }, [complaints, query, statusFilter]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by subject, customer, or unit..."
            aria-label="Filter complaints"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_FILTER_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead>Escalation</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Opened</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                  No complaints match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/cx/complaints/${c.id}`} className="font-medium text-foreground hover:underline">
                      {c.subject}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{c.customer}</TableCell>
                  <TableCell className="text-sm">{orEmpty(c.unit)}</TableCell>
                  <TableCell className="text-sm">{c.category}</TableCell>
                  <TableCell>
                    <PriorityBadge priority={c.priority as never} />
                  </TableCell>
                  <TableCell>
                    <ComplaintStatusBadge status={c.status as never} />
                  </TableCell>
                  <TableCell>
                    {c.resolutionDueAt ? (
                      <SlaBadge breached={c.slaBreached} />
                    ) : (
                      <span className="text-sm text-muted-foreground">--</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {c.isPaused ? (
                      <Badge variant="outline">Paused</Badge>
                    ) : (
                      <Badge variant={ESCALATION_VARIANT[c.escalationLevel as EscalationLevel]}>
                        {ESCALATION_LABEL[c.escalationLevel as EscalationLevel]}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{orEmpty(c.assignedTo)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(c.openedAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
