// Second batch of seeded reports (2026-09-03), triggered by reviewing a Dynamics 365 SSRS report
// export ("All Reports, Including Sub-Reports") the user attached and asking which of those are
// not yet in the Reports Repository. Covers the genuinely new, real-data-backed gaps found:
// Marketing Campaigns, Sales Targets (with real attainment computed against closed Sales),
// Sales Gamification (points/achievements), Lead Activities, and staleness ("neglected")
// views on Leads and Complaints. Everything here reads real rows — no fabricated figures.
import { PrismaClient } from "@prisma/client";
import type { SavedReportConfig } from "../src/lib/actions/reports";

const prisma = new PrismaClient();

const OWNER_EMAIL = "akosua.frimpong@devtraco.com";

type SeedReport = {
  name: string;
  description: string;
  config: SavedReportConfig;
};

const REPORTS: SeedReport[] = [
  {
    name: "Campaigns by Status",
    description: "Marketing campaigns grouped by current status.",
    config: { entity: "MARKETING_CAMPAIGN", dimension: "status", metric: "COUNT", metricField: null, filters: [], chartType: "BAR" },
  },
  {
    name: "Campaigns by Channel",
    description: "Marketing campaigns grouped by send channel.",
    config: { entity: "MARKETING_CAMPAIGN", dimension: "channel", metric: "COUNT", metricField: null, filters: [], chartType: "BAR" },
  },
  {
    name: "Campaign Budget by Status",
    description: "Total allocated campaign budget by status (only reflects campaigns with a budget entered).",
    config: { entity: "MARKETING_CAMPAIGN", dimension: "status", metric: "SUM", metricField: "budget", filters: [], chartType: "TABLE" },
  },
  {
    name: "Sales Target Value by Rep",
    description: "Monthly sales target value assigned to each rep.",
    config: { entity: "SALES_TARGET", dimension: "user", metric: "SUM", metricField: "targetValue", filters: [{ field: "periodType", value: "MONTHLY" }], chartType: "BAR" },
  },
  {
    name: "Sales Target Attainment Rate by Rep",
    description: "Actual closed sales value vs. monthly target, as a percentage, per rep.",
    config: { entity: "SALES_TARGET", dimension: "user", metric: "AVG", metricField: "attainmentPct", filters: [{ field: "periodType", value: "MONTHLY" }], chartType: "BAR" },
  },
  {
    name: "Sales Leaderboard — Points by Rep",
    description: "Total gamification points earned by each sales rep.",
    config: { entity: "SALES_POINT", dimension: "user", metric: "SUM", metricField: "points", filters: [], chartType: "BAR" },
  },
  {
    name: "Sales Points by Category",
    description: "Where sales points are being earned — by activity category.",
    config: { entity: "SALES_POINT", dimension: "category", metric: "SUM", metricField: "points", filters: [], chartType: "BAR" },
  },
  {
    name: "Achievements Earned by Rep",
    description: "Count of gamification badges earned by each sales rep.",
    config: { entity: "SALES_ACHIEVEMENT", dimension: "user", metric: "COUNT", metricField: null, filters: [], chartType: "BAR" },
  },
  {
    name: "Lead Activities by Type",
    description: "Logged lead activities (calls, emails, meetings, etc.) grouped by type.",
    config: { entity: "LEAD_ACTIVITY", dimension: "type", metric: "COUNT", metricField: null, filters: [], chartType: "BAR" },
  },
  {
    name: "Lead Activities by Rep",
    description: "Who is logging the most lead activity — a proxy for rep engagement effort.",
    config: { entity: "LEAD_ACTIVITY", dimension: "createdBy", metric: "COUNT", metricField: null, filters: [], chartType: "BAR" },
  },
  {
    name: "Neglected Leads by Age",
    description: "All leads bucketed by days since their record last changed — flags ones going stale.",
    config: { entity: "LEAD", dimension: "ageBucket", metric: "COUNT", metricField: null, filters: [], chartType: "BAR" },
  },
  {
    name: "Neglected Open Complaints by Age",
    description: "Unresolved complaints bucketed by days since last update.",
    config: { entity: "COMPLAINT", dimension: "ageBucket", metric: "COUNT", metricField: null, filters: [{ field: "status", value: "OPEN" }], chartType: "BAR" },
  },
  {
    name: "Interactions by Channel",
    description: "Logged opportunity and customer interactions, grouped by channel.",
    config: { entity: "INTERACTION", dimension: "type", metric: "COUNT", metricField: null, filters: [], chartType: "BAR" },
  },
];

async function main() {
  const owner = await prisma.user.findFirst({ where: { email: OWNER_EMAIL } });
  if (!owner) throw new Error(`Seed owner ${OWNER_EMAIL} not found`);

  let created = 0;
  let skipped = 0;
  for (const r of REPORTS) {
    const existing = await prisma.dashboard.findFirst({ where: { name: r.name, createdById: owner.id } });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.dashboard.create({
      data: {
        name: r.name,
        description: r.description,
        isShared: true,
        config: r.config as never,
        createdById: owner.id,
      },
    });
    created++;
  }

  console.log(`Created ${created} reports (${skipped} already existed).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
