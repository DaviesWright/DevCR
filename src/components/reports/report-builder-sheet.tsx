"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { ReportChart } from "@/components/reports/report-chart";
import { previewReport, createReport, updateReport, type SavedReportConfig } from "@/lib/actions/reports";
import type { ReportResult } from "@/lib/reports/engine";
import type { getReportableEntities } from "@/lib/reports/schema";
import type { ReportListItem } from "@/lib/queries/reports";

const NONE = "__none__";
const METRICS = [
  ["COUNT", "Count of records"],
  ["SUM", "Sum of"],
  ["AVG", "Average of"],
] as const;
const CHART_TYPES = [
  ["BAR", "Bar chart"],
  ["LINE", "Line chart"],
  ["TABLE", "Table"],
  ["NUMBER", "Single number"],
] as const;

type EntityOption = ReturnType<typeof getReportableEntities>[number];

export function ReportBuilderSheet({
  open,
  onOpenChange,
  entities,
  currentUserId,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entities: EntityOption[];
  currentUserId: string;
  editing?: ReportListItem | null;
}) {
  const router = useRouter();
  const isEdit = !!editing;

  const [name, setName] = React.useState(editing?.name ?? "");
  const [description, setDescription] = React.useState(editing?.description ?? "");
  const [isShared, setIsShared] = React.useState(editing?.isShared ?? false);
  const [entityKey, setEntityKey] = React.useState(editing?.config.entity ?? entities[0]?.key ?? "LEAD");
  const [dimension, setDimension] = React.useState(editing?.config.dimension ?? NONE);
  const [metric, setMetric] = React.useState<"COUNT" | "SUM" | "AVG">(editing?.config.metric ?? "COUNT");
  const [metricField, setMetricField] = React.useState(editing?.config.metricField ?? NONE);
  const [chartType, setChartType] = React.useState(editing?.config.chartType ?? "BAR");
  const [filters, setFilters] = React.useState<{ field: string; value: string }[]>(editing?.config.filters ?? []);
  const [pending, setPending] = React.useState(false);
  const [previewing, setPreviewing] = React.useState(false);
  const [preview, setPreview] = React.useState<ReportResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setDescription(editing?.description ?? "");
    setIsShared(editing?.isShared ?? false);
    setEntityKey(editing?.config.entity ?? entities[0]?.key ?? "LEAD");
    setDimension(editing?.config.dimension ?? NONE);
    setMetric(editing?.config.metric ?? "COUNT");
    setMetricField(editing?.config.metricField ?? NONE);
    setChartType(editing?.config.chartType ?? "BAR");
    setFilters(editing?.config.filters ?? []);
    setError(null);
  }, [open, editing, entities]);

  const entityDef = entities.find((e) => e.key === entityKey) ?? entities[0];

  // Reset dimension/measure/filters when the entity changes to one that doesn't have them.
  function handleEntityChange(key: string) {
    setEntityKey(key as never);
    const def = entities.find((e) => e.key === key);
    setDimension(NONE);
    setMetricField(def?.measures[0]?.key ?? NONE);
    setFilters([]);
  }

  const config: SavedReportConfig = React.useMemo(
    () => ({
      entity: entityKey as never,
      dimension: dimension === NONE ? null : dimension,
      metric,
      metricField: metric === "COUNT" ? null : metricField === NONE ? null : metricField,
      filters: filters.filter((f) => f.field && f.value),
      chartType: chartType as never,
    }),
    [entityKey, dimension, metric, metricField, filters, chartType]
  );

  React.useEffect(() => {
    if (!open) return;
    if (metric !== "COUNT" && metricField === NONE) return;
    let cancelled = false;
    setPreviewing(true);
    setError(null);
    previewReport(config)
      .then((res) => {
        if (!cancelled) setPreview(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not run this report.");
      })
      .finally(() => {
        if (!cancelled) setPreviewing(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, JSON.stringify(config)]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (metric !== "COUNT" && metricField === NONE) return;
    setPending(true);
    setError(null);
    try {
      if (isEdit && editing) {
        await updateReport(editing.id, { name, description, config, isShared });
        router.refresh();
        onOpenChange(false);
      } else {
        const { reportId } = await createReport({ name, description, config, createdById: currentUserId, isShared });
        onOpenChange(false);
        router.push(`/reports/${reportId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this report.");
    } finally {
      setPending(false);
    }
  }

  function addFilter() {
    setFilters((prev) => [...prev, { field: entityDef?.dimensions[0]?.key ?? "", value: "" }]);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit report" : "New report"}</SheetTitle>
          <SheetDescription>Pick a table, a way to group it, and what to measure — the chart updates live as you go.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          <div>
            <Label htmlFor="reportName">Name *</Label>
            <Input id="reportName" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="reportDescription">Description</Label>
            <Textarea id="reportDescription" className="mt-1.5" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Table</Label>
              <Select value={entityKey} onValueChange={handleEntityChange}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((e) => (
                    <SelectItem key={e.key} value={e.key}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Chart type</Label>
              <Select value={chartType} onValueChange={(v) => setChartType(v as never)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHART_TYPES.map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Group by</Label>
            <Select value={dimension} onValueChange={setDimension}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="No grouping — one total" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No grouping — one total</SelectItem>
                {entityDef?.dimensions.map((d) => (
                  <SelectItem key={d.key} value={d.key}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Measure</Label>
              <Select value={metric} onValueChange={(v) => setMetric(v as never)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METRICS.map(([v, l]) => (
                    <SelectItem key={v} value={v} disabled={v !== "COUNT" && (entityDef?.measures.length ?? 0) === 0}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {metric !== "COUNT" && (
              <div>
                <Label>Field</Label>
                <Select value={metricField} onValueChange={setMetricField}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select a field" />
                  </SelectTrigger>
                  <SelectContent>
                    {entityDef?.measures.map((m) => (
                      <SelectItem key={m.key} value={m.key}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="rounded-md border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Filters (optional)</p>
              <Button type="button" variant="ghost" size="sm" onClick={addFilter}>
                <Plus className="size-3.5" /> Add filter
              </Button>
            </div>
            {filters.length === 0 ? (
              <p className="text-xs text-muted-foreground">No filters — includes every record.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {filters.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Select value={f.field} onValueChange={(v) => setFilters((prev) => prev.map((x, xi) => (xi === i ? { ...x, field: v } : x)))}>
                      <SelectTrigger className="h-9 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {entityDef?.dimensions.map((d) => (
                          <SelectItem key={d.key} value={d.key}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="h-9 flex-1"
                      placeholder="exact value, e.g. QUALIFIED"
                      value={f.value}
                      onChange={(e) => setFilters((prev) => prev.map((x, xi) => (xi === i ? { ...x, value: e.target.value } : x)))}
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => setFilters((prev) => prev.filter((_, xi) => xi !== i))}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={isShared} onCheckedChange={(v) => setIsShared(!!v)} /> Share with everyone (not just me)
          </label>

          <Card>
            <CardContent className="p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview</p>
              {previewing && !preview ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : preview ? (
                <ReportChart chartType={chartType as never} result={preview} />
              ) : null}
            </CardContent>
          </Card>

          <Button type="submit" disabled={pending || !name.trim() || (metric !== "COUNT" && metricField === NONE)}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} {isEdit ? "Save changes" : "Create report"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
