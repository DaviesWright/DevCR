// One-off seed (2026-09-03) for the user's 60-report catalog request ("Build the following CRM
// Reports for DevCRM into the Reports Repository"). Creates one shared Dashboard row per report
// that is honestly buildable against REAL DevCRM data through the report-builder engine
// (src/lib/reports/schema.ts / engine.ts) — no fabricated numbers. Reports from the user's list
// that need data DevCRM doesn't track anywhere (sales targets/quotas, campaign spend, physical
// event attendance, pre-launch marketing checklist items, board-level financial ratios, revenue
// recognition schedules, project cost/profitability, lead first-response timestamps, forecast
// snapshots, or true itemized record-list exports) are intentionally skipped — see the summary
// printed at the end of this script and the chat message that accompanies this run.
import { PrismaClient } from "@prisma/client";
import type { SavedReportConfig } from "../src/lib/actions/reports";

const prisma = new PrismaClient();

const OWNER_EMAIL = "akosua.frimpong@devtraco.com";

type SeedReport = {
  name: string;
  description: string;
  department: "Sales" | "Marketing" | "CX" | "Executive" | "Projects" | "Collections";
  config: SavedReportConfig;
};

const REPORTS: SeedReport[] = [
  // ---- Sales ----
  {
    name: "Lead Source Performance",
    description: "Leads grouped by source, to see which channels bring in the most volume.",
    department: "Sales",
    config: { entity: "LEAD", dimension: "source", metric: "COUNT", metricField: null, filters: [], chartType: "BAR" },
  },
  {
    name: "Lead Conversion Rate by Source",
    description: "Share of leads from each source that convert, as a percentage.",
    department: "Sales",
    config: { entity: "LEAD", dimension: "source", metric: "AVG", metricField: "isConverted", filters: [], chartType: "BAR" },
  },
  {
    name: "Lead Pipeline by Status",
    description: "Current count of leads at each pipeline status.",
    department: "Sales",
    config: { entity: "LEAD", dimension: "status", metric: "COUNT", metricField: null, filters: [], chartType: "TABLE" },
  },
  {
    name: "Lead Qualification Breakdown",
    description: "Leads grouped by BANT qualification outcome.",
    department: "Sales",
    config: { entity: "LEAD", dimension: "qualificationStatus", metric: "COUNT", metricField: null, filters: [], chartType: "BAR" },
  },
  {
    name: "Average BANT Score by Source",
    description: "Average BANT score of leads from each source — a proxy for lead quality by channel.",
    department: "Sales",
    config: { entity: "LEAD", dimension: "source", metric: "AVG", metricField: "bantScore", filters: [], chartType: "BAR" },
  },
  {
    name: "Leads by Assigned Rep",
    description: "Current lead load carried by each sales rep.",
    department: "Sales",
    config: { entity: "LEAD", dimension: "assignedTo", metric: "COUNT", metricField: null, filters: [], chartType: "BAR" },
  },
  {
    name: "Lead Contact Rate by Rep",
    description: "Share of assigned leads each rep has actually made contact with.",
    department: "Sales",
    config: { entity: "LEAD", dimension: "assignedTo", metric: "AVG", metricField: "isContacted", filters: [], chartType: "BAR" },
  },
  {
    name: "New Leads by Month",
    description: "Lead intake volume trended month over month.",
    department: "Sales",
    config: { entity: "LEAD", dimension: "monthCreated", metric: "COUNT", metricField: null, filters: [], chartType: "LINE" },
  },
  {
    name: "Leads by Property Interest",
    description: "Which property types are drawing the most lead interest.",
    department: "Sales",
    config: { entity: "LEAD", dimension: "propertyType", metric: "COUNT", metricField: null, filters: [], chartType: "BAR" },
  },
  {
    name: "Opportunity Pipeline by Stage",
    description: "Number of open and closed opportunities at each pipeline stage.",
    department: "Sales",
    config: { entity: "OPPORTUNITY", dimension: "stage", metric: "COUNT", metricField: null, filters: [], chartType: "BAR" },
  },
  {
    name: "Pipeline Value by Stage",
    description: "Total expected value of opportunities sitting at each stage.",
    department: "Sales",
    config: { entity: "OPPORTUNITY", dimension: "stage", metric: "SUM", metricField: "expectedValue", filters: [], chartType: "BAR" },
  },
  {
    name: "Weighted Pipeline Value by Owner",
    description: "Probability-weighted pipeline value carried by each opportunity owner.",
    department: "Sales",
    config: { entity: "OPPORTUNITY", dimension: "owner", metric: "SUM", metricField: "weightedValue", filters: [], chartType: "BAR" },
  },
  {
    name: "Win Rate by Owner",
    description: "Share of an owner's opportunities that closed won.",
    department: "Sales",
    config: { entity: "OPPORTUNITY", dimension: "owner", metric: "AVG", metricField: "isWon", filters: [], chartType: "BAR" },
  },
  {
    name: "Stalled Opportunity Aging",
    description: "Open opportunities grouped by how long since their last update — flags ones going stale.",
    department: "Sales",
    config: { entity: "OPPORTUNITY", dimension: "ageBucket", metric: "COUNT", metricField: null, filters: [], chartType: "BAR" },
  },
  {
    name: "Sales by Agent",
    description: "Confirmed sale value closed by each sales agent.",
    department: "Sales",
    config: { entity: "SALE", dimension: "agent", metric: "SUM", metricField: "salePrice", filters: [], chartType: "BAR" },
  },

  // ---- Marketing ----
  {
    name: "Leads by Segment",
    description: "Lead volume split by buyer segment (Diaspora, Local, Investor, etc).",
    department: "Marketing",
    config: { entity: "LEAD", dimension: "segment", metric: "COUNT", metricField: null, filters: [], chartType: "BAR" },
  },
  {
    name: "Customer Base by Segment",
    description: "Existing customer base split by buyer segment.",
    department: "Marketing",
    config: { entity: "CUSTOMER", dimension: "segment", metric: "COUNT", metricField: null, filters: [], chartType: "TABLE" },
  },
  {
    name: "Customer Value Tier Distribution",
    description: "Customers grouped by lifetime-value tier (Platinum/Prestige/Executive/Premium).",
    department: "Marketing",
    config: { entity: "CUSTOMER", dimension: "tier", metric: "COUNT", metricField: null, filters: [], chartType: "BAR" },
  },
  {
    name: "Average Engagement Score by Segment",
    description: "How engaged each customer segment is, on average.",
    department: "Marketing",
    config: { entity: "CUSTOMER", dimension: "segment", metric: "AVG", metricField: "engagementScore", filters: [], chartType: "BAR" },
  },
  {
    name: "Lead Volume by Hour of Day",
    description: "What time of day leads tend to come in — useful for staffing response coverage.",
    department: "Marketing",
    config: { entity: "LEAD", dimension: "hourCreated", metric: "COUNT", metricField: null, filters: [], chartType: "LINE" },
  },
  {
    name: "Daily Lead Volume Trend",
    description: "Day-by-day lead intake, for spotting campaign spikes.",
    department: "Marketing",
    config: { entity: "LEAD", dimension: "dayCreated", metric: "COUNT", metricField: null, filters: [], chartType: "LINE" },
  },

  // ---- CX / Client Experience ----
  {
    name: "Complaints by Category",
    description: "Open and resolved complaints grouped by category.",
    department: "CX",
    config: { entity: "COMPLAINT", dimension: "category", metric: "COUNT", metricField: null, filters: [], chartType: "BAR" },
  },
  {
    name: "Complaints by Status",
    description: "Current complaint caseload by status.",
    department: "CX",
    config: { entity: "COMPLAINT", dimension: "status", metric: "COUNT", metricField: null, filters: [], chartType: "TABLE" },
  },
  {
    name: "Complaints by Priority",
    description: "Complaint volume split by priority level.",
    department: "CX",
    config: { entity: "COMPLAINT", dimension: "priority", metric: "COUNT", metricField: null, filters: [], chartType: "BAR" },
  },
  {
    name: "Average Resolution Time by Category",
    description: "Average days to resolve a complaint, by category.",
    department: "CX",
    config: { entity: "COMPLAINT", dimension: "category", metric: "AVG", metricField: "resolutionDays", filters: [], chartType: "BAR" },
  },
  {
    name: "Handovers by Status",
    description: "Unit handovers grouped by current status.",
    department: "CX",
    config: { entity: "HANDOVER", dimension: "status", metric: "COUNT", metricField: null, filters: [], chartType: "TABLE" },
  },
  {
    name: "Handovers by Development",
    description: "Which developments have the most handover activity.",
    department: "CX",
    config: { entity: "HANDOVER", dimension: "development", metric: "COUNT", metricField: null, filters: [], chartType: "BAR" },
  },
  {
    name: "Customer Sentiment Breakdown",
    description: "Customers grouped by recorded sentiment.",
    department: "CX",
    config: { entity: "CUSTOMER", dimension: "sentiment", metric: "COUNT", metricField: null, filters: [], chartType: "BAR" },
  },
  {
    name: "KYC Completion Status",
    description: "Customer base grouped by KYC verification status.",
    department: "CX",
    config: { entity: "CUSTOMER", dimension: "kycStatus", metric: "COUNT", metricField: null, filters: [], chartType: "TABLE" },
  },

  // ---- Executive ----
  {
    name: "Total Confirmed Sales Value",
    description: "Company-wide confirmed sales value across all developments.",
    department: "Executive",
    config: { entity: "SALE", dimension: null, metric: "SUM", metricField: "salePrice", filters: [{ field: "status", value: "COMPLETED" }], chartType: "NUMBER" },
  },
  {
    name: "Sales Value by Development",
    description: "Confirmed sales value broken down by development — Woodlands, The Address, Arlo, Lotus, etc.",
    department: "Executive",
    config: { entity: "SALE", dimension: "development", metric: "SUM", metricField: "salePrice", filters: [], chartType: "BAR" },
  },
  {
    name: "Sales Value by Property Type",
    description: "Confirmed sales value broken down by property type.",
    department: "Executive",
    config: { entity: "SALE", dimension: "propertyType", metric: "SUM", metricField: "salePrice", filters: [], chartType: "BAR" },
  },
  {
    name: "Unit Inventory by Status",
    description: "Company-wide unit inventory — available, reserved, sold — across all developments.",
    department: "Executive",
    config: { entity: "UNIT", dimension: "status", metric: "COUNT", metricField: null, filters: [], chartType: "BAR" },
  },
  {
    name: "Unit Inventory by Development",
    description: "Unit counts per development, for a portfolio-wide inventory view.",
    department: "Executive",
    config: { entity: "UNIT", dimension: "development", metric: "COUNT", metricField: null, filters: [], chartType: "BAR" },
  },
  {
    name: "Commission Payable by Status",
    description: "Total commission amounts grouped by approval/payment status.",
    department: "Executive",
    config: { entity: "COMMISSION", dimension: "status", metric: "SUM", metricField: "amount", filters: [], chartType: "TABLE" },
  },
  {
    name: "Sales Pipeline Win Rate (Company-wide)",
    description: "Overall opportunity win rate across the whole company.",
    department: "Executive",
    config: { entity: "OPPORTUNITY", dimension: null, metric: "AVG", metricField: "isWon", filters: [], chartType: "NUMBER" },
  },
  {
    name: "SPA Execution Status",
    description: "Confirmed sales grouped by Sale & Purchase Agreement signing status — a proxy for legal/paperwork bottlenecks.",
    department: "Executive",
    config: { entity: "SALE", dimension: "spaStatus", metric: "COUNT", metricField: null, filters: [], chartType: "BAR" },
  },

  // ---- Projects / Development ----
  {
    name: "Available Units by Development",
    description: "Currently-available unit counts per development — spot which projects are selling fastest.",
    department: "Projects",
    config: { entity: "UNIT", dimension: "development", metric: "COUNT", metricField: null, filters: [{ field: "status", value: "AVAILABLE" }], chartType: "BAR" },
  },
  {
    name: "Sold Units by Development",
    description: "Sold-unit counts per development.",
    department: "Projects",
    config: { entity: "UNIT", dimension: "development", metric: "COUNT", metricField: null, filters: [{ field: "status", value: "SOLD" }], chartType: "BAR" },
  },
  {
    name: "Reserved Units by Development",
    description: "Currently-reserved unit counts per development — near-term expected conversions.",
    department: "Projects",
    config: { entity: "UNIT", dimension: "development", metric: "COUNT", metricField: null, filters: [{ field: "status", value: "RESERVED" }], chartType: "BAR" },
  },
  {
    name: "Average Unit Price by Development",
    description: "Average current listed price per development.",
    department: "Projects",
    config: { entity: "UNIT", dimension: "development", metric: "AVG", metricField: "currentPrice", filters: [], chartType: "BAR" },
  },
  {
    name: "Average Unit Price by Property Type",
    description: "Average current listed price by property type across the portfolio.",
    department: "Projects",
    config: { entity: "UNIT", dimension: "propertyType", metric: "AVG", metricField: "currentPrice", filters: [], chartType: "BAR" },
  },
  {
    name: "Handover Readiness by Development",
    description: "Handover status per development — flags where inspection or scheduling is lagging.",
    department: "Projects",
    config: { entity: "HANDOVER", dimension: "development", metric: "COUNT", metricField: null, filters: [], chartType: "TABLE" },
  },
  {
    name: "Sales by Month",
    description: "Confirmed sales trended by month, across all developments.",
    department: "Projects",
    config: { entity: "SALE", dimension: "monthSold", metric: "COUNT", metricField: null, filters: [], chartType: "LINE" },
  },
  {
    name: "Sales Value by Month",
    description: "Confirmed sales revenue trended by month.",
    department: "Projects",
    config: { entity: "SALE", dimension: "monthSold", metric: "SUM", metricField: "salePrice", filters: [], chartType: "LINE" },
  },

  // ---- Collections ----
  {
    name: "Payment Schedule Status Overview",
    description: "All scheduled installments grouped by status — pending, paid, overdue, partial, waived.",
    department: "Collections",
    config: { entity: "PAYMENT_SCHEDULE", dimension: "status", metric: "COUNT", metricField: null, filters: [], chartType: "BAR" },
  },
  {
    name: "Amount Due by Payment Status",
    description: "Total amount due across all installments, grouped by status.",
    department: "Collections",
    config: { entity: "PAYMENT_SCHEDULE", dimension: "status", metric: "SUM", metricField: "amountDue", filters: [], chartType: "TABLE" },
  },
  {
    name: "Overdue Amount Outstanding",
    description: "Total outstanding amount currently overdue across all customers.",
    department: "Collections",
    config: { entity: "PAYMENT_SCHEDULE", dimension: null, metric: "SUM", metricField: "amountDue", filters: [{ field: "status", value: "OVERDUE" }], chartType: "NUMBER" },
  },
  {
    name: "Count of Overdue Installments",
    description: "How many individual installments are currently overdue.",
    department: "Collections",
    config: { entity: "PAYMENT_SCHEDULE", dimension: null, metric: "COUNT", metricField: null, filters: [{ field: "status", value: "OVERDUE" }], chartType: "NUMBER" },
  },
  {
    name: "Commission Amount by Tranche",
    description: "Commission amounts broken down by payout tranche.",
    department: "Collections",
    config: { entity: "COMMISSION", dimension: "tranche", metric: "SUM", metricField: "amount", filters: [], chartType: "BAR" },
  },
  {
    name: "Commission by Status",
    description: "Commission counts grouped by approval/payment status.",
    department: "Collections",
    config: { entity: "COMMISSION", dimension: "status", metric: "COUNT", metricField: null, filters: [], chartType: "TABLE" },
  },
  {
    name: "Commission Payable by Agent",
    description: "Total commission amount attributable to each agent, across all statuses.",
    department: "Collections",
    config: { entity: "COMMISSION", dimension: "agent", metric: "SUM", metricField: "amount", filters: [], chartType: "BAR" },
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

  const byDept = REPORTS.reduce<Record<string, number>>((acc, r) => {
    acc[r.department] = (acc[r.department] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`Created ${created} reports (${skipped} already existed).`);
  console.log("By department:", byDept);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
