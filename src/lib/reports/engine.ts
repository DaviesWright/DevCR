import { getReportEntityDef, isValidDimension, isValidMeasure, type ReportEntityKey, type ReportRow } from "@/lib/reports/schema";

export type ReportMetric = "COUNT" | "SUM" | "AVG";
export type ReportChartType = "BAR" | "LINE" | "PIE" | "TABLE" | "NUMBER";
export type ReportFilter = { field: string; value: string };

export type ReportConfig = {
  entity: ReportEntityKey;
  dimension: string | null; // null => single aggregate number, no grouping
  metric: ReportMetric;
  metricField: string | null; // required for SUM/AVG
  filters: ReportFilter[];
};

export type ReportResult =
  | { kind: "number"; value: number; rowCount: number }
  | { kind: "grouped"; data: { name: string; value: number }[]; rowCount: number };

function computeMetric(rows: ReportRow[], metric: ReportMetric, metricField: string | null): number {
  if (metric === "COUNT") return rows.length;
  if (!metricField) return 0;
  const nums = rows.map((r) => Number(r[metricField]) || 0);
  if (nums.length === 0) return 0;
  const sum = nums.reduce((a, b) => a + b, 0);
  if (metric === "SUM") return Math.round(sum * 100) / 100;
  return Math.round((sum / nums.length) * 100) / 100;
}

// Validates config against the entity's allowlist (defense in depth — callers should already
// only offer allowlisted options, but a saved report's config is untrusted input by the time
// it's re-run), fetches that entity's rows via its own safe query, applies simple equality
// filters, then groups/aggregates entirely in JS. No dynamic SQL anywhere in this path.
export async function runReport(config: ReportConfig): Promise<ReportResult> {
  const def = getReportEntityDef(config.entity);

  if (config.dimension && !isValidDimension(config.entity, config.dimension)) {
    throw new Error(`Invalid dimension "${config.dimension}" for entity ${config.entity}`);
  }
  if (config.metric !== "COUNT") {
    if (!config.metricField || !isValidMeasure(config.entity, config.metricField)) {
      throw new Error(`Invalid measure "${config.metricField}" for entity ${config.entity}`);
    }
  }
  for (const f of config.filters) {
    if (!isValidDimension(config.entity, f.field)) {
      throw new Error(`Invalid filter field "${f.field}" for entity ${config.entity}`);
    }
  }

  let rows = await def.fetchRows();

  for (const f of config.filters) {
    if (!f.value) continue;
    rows = rows.filter((r) => String(r[f.field]) === f.value);
  }

  if (!config.dimension) {
    return { kind: "number", value: computeMetric(rows, config.metric, config.metricField), rowCount: rows.length };
  }

  const groups = new Map<string, ReportRow[]>();
  for (const r of rows) {
    const key = String(r[config.dimension] ?? "Unknown");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  const data = Array.from(groups.entries())
    .map(([name, groupRows]) => ({ name, value: computeMetric(groupRows, config.metric, config.metricField) }))
    .sort((a, b) => b.value - a.value);

  return { kind: "grouped", data, rowCount: rows.length };
}
