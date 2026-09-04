"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, UserPlus, Tag, Trash2, LayoutGrid, List as ListIcon, X } from "lucide-react";
import { AGE_BUCKETS, LOST_REASON_LABEL } from "@/lib/leads/lead-taxonomy";
import type { StageDTO } from "@/lib/pipeline/stages";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LeadStatusBadge, QualificationBadge, SegmentBadge } from "@/components/leads/lead-status-badge";
import { AssignSheet } from "@/components/leads/lead-actions";
import { SavedViewsBar, type SavedView } from "@/components/shared/saved-views-bar";
import { assignLeadsBulk } from "@/lib/actions/leads";
import { formatCurrency, formatDate, orEmpty } from "@/lib/utils";
import type { LeadListItem } from "@/lib/queries/leads";

type SortField = "createdAt" | "bantScore" | "name";
type ViewState = { query: string; statusFilter: string; sortField: SortField; sortDesc: boolean; layout: "TABLE" | "KANBAN" };
type GroupFilter = "NONE" | "AGEING_OPEN" | "NURTURE_ACTIVE";

// Drill-down entry points from Lead Analytics (src/app/(app)/leads/analytics/page.tsx) — read
// once on mount, not kept in sync with the URL afterward (matches this app's existing pattern of
// session-local filter state backed by Saved Views rather than continuous URL syncing).
export type LeadsInitialFilters = {
  status?: string;
  group?: string;
  q?: string;
  assignedTo?: string;
  lostReason?: string;
  ageMin?: string;
  ageMax?: string;
  sort?: string;
  dir?: string;
};

function parseGroupFilter(group: string | undefined): GroupFilter {
  if (group === "open") return "AGEING_OPEN";
  if (group === "active") return "NURTURE_ACTIVE";
  return "NONE";
}

function ageBucketLabel(min: number, max: number | null) {
  const exact = AGE_BUCKETS.find((b) => b.min === min && (max === null ? b.max === Infinity : b.max === max));
  if (exact) return exact.label;
  return max === null ? `${min}+ days` : `${min}-${max} days`;
}

const SORT_FIELDS: [SortField, string][] = [
  ["createdAt", "Created date"],
  ["bantScore", "BANT score"],
  ["name", "Name"],
];

export function LeadsTable({
  leads,
  assignableUsers,
  canBulkAssign = true,
  savedViews,
  currentUserId,
  initialFilters,
  stages,
}: {
  leads: LeadListItem[];
  assignableUsers: { id: string; name: string }[];
  canBulkAssign?: boolean;
  savedViews: SavedView[];
  currentUserId: string;
  initialFilters?: LeadsInitialFilters;
  stages: StageDTO[];
}) {
  const router = useRouter();
  const orderedStages = useMemo(() => [...stages].sort((a, b) => a.stageOrder - b.stageOrder), [stages]);
  const stagesByKey = useMemo(() => new Map(stages.map((s) => [s.key, s])), [stages]);
  const [query, setQuery] = useState(initialFilters?.q ?? "");
  const [statusFilter, setStatusFilter] = useState<string>(() =>
    initialFilters?.status && stagesByKey.has(initialFilters.status) ? initialFilters.status : "ALL"
  );
  const [sortField, setSortField] = useState<SortField>(
    () => (["createdAt", "bantScore", "name"] as const).includes((initialFilters?.sort ?? "") as never)
      ? (initialFilters!.sort as SortField)
      : "createdAt"
  );
  const [sortDesc, setSortDesc] = useState(initialFilters?.dir !== "asc");
  const [layout, setLayout] = useState<"TABLE" | "KANBAN">("TABLE");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assignOpen, setAssignOpen] = useState(false);
  const [groupFilter, setGroupFilter] = useState<GroupFilter>(() => parseGroupFilter(initialFilters?.group));
  const [assignedToFilter, setAssignedToFilter] = useState<string | null>(initialFilters?.assignedTo ?? null);
  const [lostReasonFilter, setLostReasonFilter] = useState<string | null>(initialFilters?.lostReason ?? null);
  const [ageRangeFilter, setAgeRangeFilter] = useState<{ min: number; max: number | null } | null>(() => {
    if (!initialFilters?.ageMin) return null;
    const min = parseInt(initialFilters.ageMin, 10);
    if (!Number.isFinite(min)) return null;
    const max = initialFilters.ageMax ? parseInt(initialFilters.ageMax, 10) : null;
    return { min, max: max !== null && Number.isFinite(max) ? max : null };
  });

  function applyView(state: ViewState) {
    setQuery(state.query ?? "");
    setStatusFilter(state.statusFilter ?? "ALL");
    setSortField(state.sortField ?? "createdAt");
    setSortDesc(state.sortDesc ?? true);
    setLayout(state.layout ?? "TABLE");
  }

  const now = Date.now();
  const filtered = useMemo(() => {
    const base = leads.filter((lead) => {
      if (statusFilter !== "ALL" && lead.status !== statusFilter) return false;
      if (groupFilter === "AGEING_OPEN" && !stagesByKey.get(lead.status)?.countsAsAgeingOpen) return false;
      if (groupFilter === "NURTURE_ACTIVE" && !stagesByKey.get(lead.status)?.countsAsNurtureActive) return false;
      if (assignedToFilter && lead.assignedToId !== assignedToFilter) return false;
      if (lostReasonFilter && lead.lostReason !== lostReasonFilter) return false;
      if (ageRangeFilter) {
        const ageDays = (now - lead.createdAt.getTime()) / 86_400_000;
        if (ageDays < ageRangeFilter.min) return false;
        if (ageRangeFilter.max !== null && ageDays > ageRangeFilter.max) return false;
      }
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return lead.name.toLowerCase().includes(q) || lead.email.toLowerCase().includes(q) || lead.source.toLowerCase().includes(q);
    });
    const sorted = [...base].sort((a, b) => {
      let cmp = 0;
      if (sortField === "createdAt") cmp = a.createdAt.getTime() - b.createdAt.getTime();
      else if (sortField === "bantScore") cmp = a.bantScore - b.bantScore;
      else cmp = a.name.localeCompare(b.name);
      return sortDesc ? -cmp : cmp;
    });
    return sorted;
  }, [leads, query, statusFilter, sortField, sortDesc, groupFilter, assignedToFilter, lostReasonFilter, ageRangeFilter, now, stagesByKey]);

  const allSelected = filtered.length > 0 && filtered.every((l) => selected.has(l.id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(filtered.map((l) => l.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Chips for the filter dimensions with no other visible control (group/assignedTo/lostReason/
  // age come only from an analytics drill-down link) — status, search, and sort already show
  // their own state via the dropdowns/search box below, so they don't need a chip too.
  const advancedFilterChips: { key: string; label: string; onClear: () => void }[] = [];
  if (groupFilter === "AGEING_OPEN") {
    advancedFilterChips.push({ key: "group", label: "Open pipeline (lead ageing)", onClear: () => setGroupFilter("NONE") });
  } else if (groupFilter === "NURTURE_ACTIVE") {
    advancedFilterChips.push({ key: "group", label: "Active nurture book", onClear: () => setGroupFilter("NONE") });
  }
  if (assignedToFilter) {
    const name = assignableUsers.find((u) => u.id === assignedToFilter)?.name ?? "Unknown rep";
    advancedFilterChips.push({ key: "assignedTo", label: `Assigned to ${name}`, onClear: () => setAssignedToFilter(null) });
  }
  if (lostReasonFilter) {
    advancedFilterChips.push({
      key: "lostReason",
      label: `Lost reason: ${LOST_REASON_LABEL[lostReasonFilter] ?? lostReasonFilter}`,
      onClear: () => setLostReasonFilter(null),
    });
  }
  if (ageRangeFilter) {
    advancedFilterChips.push({
      key: "age",
      label: `Age: ${ageBucketLabel(ageRangeFilter.min, ageRangeFilter.max)}`,
      onClear: () => setAgeRangeFilter(null),
    });
  }

  function clearAllFilters() {
    setQuery("");
    setStatusFilter("ALL");
    setSortField("createdAt");
    setSortDesc(true);
    setGroupFilter("NONE");
    setAssignedToFilter(null);
    setLostReasonFilter(null);
    setAgeRangeFilter(null);
    router.replace("/leads");
  }

  const hasAnyFilter = advancedFilterChips.length > 0 || query.trim() !== "" || statusFilter !== "ALL";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SavedViewsBar
          entityType="LEAD"
          currentUserId={currentUserId}
          views={savedViews}
          currentState={{ query, statusFilter, sortField, sortDesc, layout }}
          onApply={applyView}
          revalidatePath="/leads"
        />
        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
          <Button variant={layout === "TABLE" ? "secondary" : "ghost"} size="sm" onClick={() => setLayout("TABLE")}>
            <ListIcon className="size-3.5" /> Table
          </Button>
          <Button variant={layout === "KANBAN" ? "secondary" : "ghost"} size="sm" onClick={() => setLayout("KANBAN")}>
            <LayoutGrid className="size-3.5" /> Kanban
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name, email, or source..."
            aria-label="Filter leads"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
            <SelectTrigger className="w-44" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {orderedStages.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
            <SelectTrigger className="w-40" aria-label="Sort by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_FIELDS.map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  Sort: {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setSortDesc((d) => !d)}>
            {sortDesc ? "↓ Desc" : "↑ Asc"}
          </Button>
        </div>
      </div>

      {(advancedFilterChips.length > 0 || hasAnyFilter) && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            {filtered.length} of {leads.length} lead{leads.length === 1 ? "" : "s"} match
            {advancedFilterChips.length > 0 ? " — filtered from Lead Analytics:" : ":"}
          </span>
          {advancedFilterChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onClear}
              className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-foreground hover:bg-accent"
            >
              {chip.label}
              <X className="size-3" />
            </button>
          ))}
          <Button variant="ghost" size="sm" className="ml-auto h-6 px-2 text-xs" onClick={clearAllFilters}>
            Clear all filters
          </Button>
        </div>
      )}

      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-accent px-3 py-2 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <div className="ml-auto flex gap-1">
            {canBulkAssign && (
              <Button variant="ghost" size="sm" onClick={() => setAssignOpen(true)}>
                <UserPlus className="size-3.5" /> Assign
              </Button>
            )}
            <Button variant="ghost" size="sm">
              <Tag className="size-3.5" /> Update status
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
              <Trash2 className="size-3.5" /> Delete
            </Button>
          </div>
        </div>
      )}

      {layout === "KANBAN" ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {orderedStages.map((stage) => {
            const cards = filtered.filter((l) => l.status === stage.key);
            return (
              <div key={stage.key} className="flex w-64 shrink-0 flex-col gap-2 rounded-lg border border-border bg-muted/40 p-2">
                <div className="flex items-center justify-between px-1.5 py-1">
                  <span className="text-sm font-semibold text-foreground">{stage.label}</span>
                  <span className="text-xs text-muted-foreground">{cards.length}</span>
                </div>
                <div className="flex min-h-16 flex-col gap-2">
                  {cards.map((lead) => (
                    <Link key={lead.id} href={`/leads/${lead.id}`}>
                      <Card className="shadow-sm transition-colors hover:bg-accent/40">
                        <CardContent className="p-3">
                          <p className="text-sm font-medium text-foreground">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{orEmpty(lead.assignedTo)}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <QualificationBadge status={lead.qualificationStatus as never} />
                            <span className="text-xs tabular-nums text-muted-foreground">{lead.bantScore}</span>
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
      ) : (
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all leads" />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Qualification</TableHead>
              <TableHead>BANT Score</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                  No leads match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((lead) => (
                <TableRow key={lead.id} data-state={selected.has(lead.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(lead.id)}
                      onCheckedChange={() => toggleOne(lead.id)}
                      aria-label={`Select ${lead.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={`/leads/${lead.id}`} className="font-medium text-foreground hover:underline">
                      {lead.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{lead.email}</p>
                  </TableCell>
                  <TableCell>{lead.segment ? <SegmentBadge segment={lead.segment} /> : <span className="text-sm text-muted-foreground">--</span>}</TableCell>
                  <TableCell className="text-sm">{lead.source}</TableCell>
                  <TableCell>
                    <LeadStatusBadge
                      status={lead.status}
                      label={stagesByKey.get(lead.status)?.label ?? lead.status}
                      badgeVariant={stagesByKey.get(lead.status)?.badgeVariant ?? "outline"}
                    />
                  </TableCell>
                  <TableCell>
                    <QualificationBadge status={lead.qualificationStatus as never} />
                  </TableCell>
                  <TableCell className="tabular-nums">{lead.bantScore}</TableCell>
                  <TableCell className="text-sm">{orEmpty(lead.assignedTo)}</TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {lead.budgetMin || lead.budgetMax
                      ? `${lead.budgetMin ? formatCurrency(lead.budgetMin, lead.currency) : "--"} – ${lead.budgetMax ? formatCurrency(lead.budgetMax, lead.currency) : "--"}`
                      : "--"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(lead.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      )}

      <AssignSheet
        open={assignOpen}
        onOpenChange={setAssignOpen}
        assignableUsers={assignableUsers}
        run={async (fn, onDone) => {
          await fn();
          router.refresh();
          setSelected(new Set());
          onDone?.();
        }}
        onAssign={(userId) => assignLeadsBulk(Array.from(selected), userId, currentUserId)}
      />
    </div>
  );
}
