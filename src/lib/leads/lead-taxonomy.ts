// Shared lead status/taxonomy constants — deliberately prisma-free so this file can be imported
// from both server query modules (lead-analytics.ts, nurture.ts) and client components
// (leads-table.tsx) without dragging the Prisma client into the browser bundle. Single source of
// truth for the two different "open pipeline" definitions already in use (lead ageing vs. rep
// active book size) so a drill-down link always filters to exactly the set its KPI counted.

export const AGEING_OPEN_STATUSES = ["NEW", "CONTACTED", "QUALIFIED"] as const;

export const NURTURE_ACTIVE_STATUSES = ["NEW", "CONTACTED", "NURTURING", "QUALIFIED", "REAL_OPPORTUNITY"] as const;

export const AGE_BUCKETS = [
  { label: "0-7 days", min: 0, max: 7 },
  { label: "8-14 days", min: 8, max: 14 },
  { label: "15-30 days", min: 15, max: 30 },
  { label: "31+ days", min: 31, max: Infinity },
] as const;

export const LOST_REASON_LABEL: Record<string, string> = {
  NO_BUDGET: "No budget",
  WRONG_TIMING: "Wrong timing",
  NOT_INTERESTED: "Not interested",
  UNRESPONSIVE: "Unresponsive",
  CHOSE_COMPETITOR: "Chose a competitor",
  WRONG_FIT: "Wrong fit",
  DUPLICATE: "Duplicate lead",
  OTHER: "Other",
};
