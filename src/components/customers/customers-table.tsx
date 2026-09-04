"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, LayoutGrid, List as ListIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { SavedViewsBar, type SavedView } from "@/components/shared/saved-views-bar";
import { orEmpty } from "@/lib/utils";
import type { CustomerListItem } from "@/lib/queries/customers";

const SEGMENT_LABEL: Record<string, string> = {
  LOCAL_RESIDENTIAL: "Local Residential",
  DIASPORA: "Diaspora",
  CORPORATE: "Corporate",
  INVESTOR: "Investor",
};
const SEGMENTS = Object.keys(SEGMENT_LABEL);

const KYC_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  VERIFIED: "success",
  PENDING: "warning",
  REJECTED: "destructive",
};

type ViewState = { query: string; segmentFilter: string; layout: "TABLE" | "KANBAN" };
const NONE_SEGMENT = "ALL";

export function CustomersTable({
  customers,
  savedViews,
  currentUserId,
}: {
  customers: CustomerListItem[];
  savedViews: SavedView[];
  currentUserId: string;
}) {
  const [query, setQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState(NONE_SEGMENT);
  const [layout, setLayout] = useState<"TABLE" | "KANBAN">("TABLE");

  function applyView(state: ViewState) {
    setQuery(state.query ?? "");
    setSegmentFilter(state.segmentFilter ?? NONE_SEGMENT);
    setLayout(state.layout ?? "TABLE");
  }

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (segmentFilter !== NONE_SEGMENT && c.segment !== segmentFilter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email ?? "").toLowerCase().includes(q);
    });
  }, [customers, query, segmentFilter]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SavedViewsBar
          entityType="CUSTOMER"
          currentUserId={currentUserId}
          views={savedViews}
          currentState={{ query, segmentFilter, layout }}
          onApply={applyView}
          revalidatePath="/customers"
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
            placeholder="Filter by name, phone, or email..."
            aria-label="Filter customers"
            className="pl-9"
          />
        </div>
        <Select value={segmentFilter} onValueChange={setSegmentFilter}>
          <SelectTrigger className="w-48" aria-label="Filter by segment">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_SEGMENT}>All segments</SelectItem>
            {SEGMENTS.map((s) => (
              <SelectItem key={s} value={s}>
                {SEGMENT_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {layout === "KANBAN" ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {SEGMENTS.map((segment) => {
            const cards = filtered.filter((c) => c.segment === segment);
            return (
              <div key={segment} className="flex w-64 shrink-0 flex-col gap-2 rounded-lg border border-border bg-muted/40 p-2">
                <div className="flex items-center justify-between px-1.5 py-1">
                  <span className="text-sm font-semibold text-foreground">{SEGMENT_LABEL[segment]}</span>
                  <span className="text-xs text-muted-foreground">{cards.length}</span>
                </div>
                <div className="flex min-h-16 flex-col gap-2">
                  {cards.map((c) => (
                    <Link key={c.id} href={`/customers/${c.id}`}>
                      <Card className="shadow-sm transition-colors hover:bg-accent/40">
                        <CardContent className="p-3">
                          <p className="text-sm font-medium text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{orEmpty(c.email)}</p>
                          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                            <span>{c.leadCount} lead{c.leadCount === 1 ? "" : "s"}</span>
                            <span>{c.saleCount} sale{c.saleCount === 1 ? "" : "s"}</span>
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
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead>KYC</TableHead>
              <TableHead>Leads</TableHead>
              <TableHead>Sales</TableHead>
              <TableHead>Complaints</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No customers match your filter.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/customers/${c.id}`} className="font-medium text-foreground hover:underline">
                      {c.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{orEmpty(c.email)}</p>
                  </TableCell>
                  <TableCell className="text-sm">{c.phone}</TableCell>
                  <TableCell className="text-sm">{c.segment ? SEGMENT_LABEL[c.segment] ?? c.segment : "--"}</TableCell>
                  <TableCell>
                    <Badge variant={KYC_VARIANT[c.kycStatus] ?? "outline"}>{c.kycStatus.toLowerCase()}</Badge>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{c.leadCount}</TableCell>
                  <TableCell className="text-sm tabular-nums">{c.saleCount}</TableCell>
                  <TableCell className="text-sm tabular-nums">{c.complaintCount}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      )}
    </div>
  );
}
