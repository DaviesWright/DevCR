import { prisma } from "@/lib/prisma";
import { tierForLifetimeValue } from "@/lib/customer-tier";

// Self-service report builder's safety boundary: a manager can only build a chart from one of
// these allowlisted entities, grouped by one of its allowlisted dimensions, measuring one of its
// allowlisted numeric fields. Nothing here accepts a raw field name or raw SQL from the client —
// each entity's fetchRows() is a hand-written, typed Prisma query that already flattens relation
// fields (e.g. customer.segment) into plain string/number values, so grouping/filtering/
// aggregating afterward is just array math in JS, never a dynamically-built query. Dataset sizes
// here are small (dozens to low hundreds of rows), so this is fine without DB-level GROUP BY.
//
// A handful of dimensions/measures below are *computed*, not raw columns (e.g. Lead.monthCreated,
// Opportunity.isWon, Opportunity.ageBucket) — these back the standard report library seeded by
// prisma/seed-standard-reports.ts (2026-09-03), which needed date-bucketing and 0/1 "rate" fields
// (AVG of a 0/1 field = a percentage) that the generic group-by/aggregate engine can't express
// from raw columns alone. They're still computed in JS from real data, never fabricated.

export type ReportEntityKey =
  | "LEAD"
  | "CUSTOMER"
  | "OPPORTUNITY"
  | "SALE"
  | "COMMISSION"
  | "COMPLAINT"
  | "UNIT"
  | "HANDOVER"
  | "PAYMENT_SCHEDULE"
  | "MARKETING_CAMPAIGN"
  | "SALES_TARGET"
  | "SALES_POINT"
  | "SALES_ACHIEVEMENT"
  | "LEAD_ACTIVITY"
  | "INTERACTION";
export type ReportFieldOption = { key: string; label: string };
export type ReportRow = Record<string, string | number>;

type ReportEntityDef = {
  label: string;
  dimensions: ReportFieldOption[];
  measures: ReportFieldOption[];
  fetchRows: () => Promise<ReportRow[]>;
};

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function ageBucket(days: number): string {
  if (days <= 7) return "0-7 days";
  if (days <= 14) return "8-14 days";
  if (days <= 30) return "15-30 days";
  return "30+ days";
}

const REPORT_ENTITIES: Record<ReportEntityKey, ReportEntityDef> = {
  LEAD: {
    label: "Leads",
    dimensions: [
      { key: "status", label: "Status" },
      { key: "qualificationStatus", label: "Qualification" },
      { key: "source", label: "Source" },
      { key: "channel", label: "Channel" },
      { key: "channelGroup", label: "Channel Group" },
      { key: "medium", label: "Medium" },
      { key: "segment", label: "Buyer Segment" },
      { key: "assignedTo", label: "Assigned To" },
      { key: "propertyType", label: "Property Interest" },
      { key: "monthCreated", label: "Month Created" },
      { key: "dayCreated", label: "Day Created" },
      { key: "hourCreated", label: "Hour Created (0-23)" },
      { key: "ageBucket", label: "Days Since Last Update" },
    ],
    measures: [
      { key: "bantScore", label: "BANT Score" },
      { key: "score", label: "Engagement Score" },
      { key: "isConverted", label: "Conversion Rate (%)" },
      { key: "isContacted", label: "Contact Rate (%)" },
    ],
    fetchRows: async () => {
      const rows = await prisma.lead.findMany({
        where: { deletedAt: null },
        select: {
          status: true,
          qualificationStatus: true,
          bantScore: true,
          score: true,
          createdAt: true,
          updatedAt: true,
          source: { select: { name: true } },
          channel: { select: { name: true, group: { select: { name: true } } } },
          medium: { select: { name: true } },
          customer: { select: { segment: true } },
          assignedTo: { select: { firstName: true, lastName: true } },
          propertyType: { select: { name: true } },
          pipelineStage: { select: { key: true, isWonStage: true } },
        },
      });
      const now = Date.now();
      return rows.map((l) => ({
        status: l.status,
        qualificationStatus: l.qualificationStatus,
        source: l.source.name,
        channel: l.channel?.name ?? "Unattributed",
        channelGroup: l.channel?.group.name ?? "Unattributed",
        medium: l.medium?.name ?? "Unattributed",
        segment: l.customer.segment ?? "Unknown",
        assignedTo: l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}` : "Unassigned",
        propertyType: l.propertyType?.name ?? "Unspecified",
        monthCreated: monthKey(l.createdAt),
        dayCreated: dayKey(l.createdAt),
        hourCreated: String(l.createdAt.getHours()).padStart(2, "0"),
        ageBucket: ageBucket(Math.floor((now - l.updatedAt.getTime()) / 86400000)),
        bantScore: l.bantScore,
        score: l.score,
        // CONVERTED is the Lead pipeline's won-equivalent stage, so isWonStage is the correct
        // dynamic replacement for the old literal comparison. There's no generic flag for
        // "not NEW", so isContacted compares against the stable, curated "NEW" stage key.
        isConverted: l.pipelineStage?.isWonStage ? 100 : 0,
        isContacted: l.pipelineStage?.key !== "NEW" ? 100 : 0,
      }));
    },
  },
  CUSTOMER: {
    label: "Customers",
    dimensions: [
      { key: "segment", label: "Segment" },
      { key: "kycStatus", label: "KYC Status" },
      { key: "sentiment", label: "Sentiment" },
      { key: "tier", label: "Value Tier" },
    ],
    measures: [{ key: "engagementScore", label: "Engagement Score" }],
    fetchRows: async () => {
      const rows = await prisma.customer.findMany({
        where: { deletedAt: null },
        select: {
          segment: true,
          kycStatus: true,
          sentiment: true,
          engagementScore: true,
          sales: { where: { status: { in: ["ACTIVE", "COMPLETED"] } }, select: { salePrice: true } },
        },
      });
      return rows.map((c) => {
        const lifetimeValue = c.sales.reduce((sum, s) => sum + Number(s.salePrice), 0);
        return {
          segment: c.segment ?? "Unknown",
          kycStatus: c.kycStatus,
          sentiment: c.sentiment,
          tier: tierForLifetimeValue(lifetimeValue).label,
          engagementScore: Number(c.engagementScore),
        };
      });
    },
  },
  OPPORTUNITY: {
    label: "Opportunities",
    dimensions: [
      { key: "stage", label: "Stage" },
      { key: "owner", label: "Owner" },
      { key: "ageBucket", label: "Age (days since last update)" },
      { key: "monthCreated", label: "Month Created" },
    ],
    measures: [
      { key: "expectedValue", label: "Expected Value" },
      { key: "probability", label: "Probability" },
      { key: "weightedValue", label: "Weighted Value (Expected x Probability)" },
      { key: "isWon", label: "Win Rate (%)" },
    ],
    fetchRows: async () => {
      const rows = await prisma.opportunity.findMany({
        where: { deletedAt: null },
        select: {
          stage: true,
          expectedValue: true,
          probability: true,
          createdAt: true,
          updatedAt: true,
          owner: { select: { firstName: true, lastName: true } },
          pipelineStage: { select: { isWonStage: true, isLostStage: true, label: true } },
        },
      });
      const now = Date.now();
      return rows.map((o) => {
        const isWon = !!o.pipelineStage?.isWonStage;
        const isLost = !!o.pipelineStage?.isLostStage;
        const isClosed = isWon || isLost;
        const daysSinceUpdate = Math.floor((now - o.updatedAt.getTime()) / 86400000);
        return {
          stage: o.stage,
          owner: `${o.owner.firstName} ${o.owner.lastName}`,
          ageBucket: isClosed ? "Closed" : ageBucket(daysSinceUpdate),
          monthCreated: monthKey(o.createdAt),
          expectedValue: Number(o.expectedValue),
          probability: o.probability,
          weightedValue: Math.round(Number(o.expectedValue) * (o.probability / 100)),
          isWon: isWon ? 100 : 0,
        };
      });
    },
  },
  SALE: {
    label: "Sales",
    dimensions: [
      { key: "status", label: "Status" },
      { key: "development", label: "Development" },
      { key: "propertyType", label: "Property Type" },
      { key: "agent", label: "Sales Agent" },
      { key: "monthSold", label: "Month Sold" },
      { key: "spaStatus", label: "SPA Status" },
    ],
    measures: [{ key: "salePrice", label: "Sale Price" }],
    fetchRows: async () => {
      const rows = await prisma.sale.findMany({
        where: { deletedAt: null },
        select: {
          status: true,
          salePrice: true,
          saleDate: true,
          unit: { select: { development: { select: { name: true } }, propertyType: { select: { name: true } } } },
          commissions: { take: 1, select: { agent: { select: { user: { select: { firstName: true, lastName: true } } } } } },
          milestoneChecklist: { select: { spaSignedByClientAt: true, spaSignedByDevtracoAt: true } },
        },
      });
      return rows.map((s) => {
        const agent = s.commissions[0]?.agent;
        const ms = s.milestoneChecklist;
        const spaStatus = ms?.spaSignedByDevtracoAt
          ? "Fully Executed"
          : ms?.spaSignedByClientAt
            ? "Client Signed"
            : "Not Started";
        return {
          status: s.status,
          development: s.unit.development.name,
          propertyType: s.unit.propertyType.name,
          agent: agent ? `${agent.user.firstName} ${agent.user.lastName}` : "Unassigned",
          monthSold: monthKey(s.saleDate),
          spaStatus,
          salePrice: Number(s.salePrice),
        };
      });
    },
  },
  COMMISSION: {
    label: "Commissions",
    dimensions: [
      { key: "status", label: "Status" },
      { key: "tranche", label: "Tranche" },
      { key: "agent", label: "Agent" },
    ],
    measures: [{ key: "amount", label: "Amount" }],
    fetchRows: async () => {
      const rows = await prisma.commission.findMany({
        select: { status: true, tranche: true, amount: true, agent: { select: { user: { select: { firstName: true, lastName: true } } } } },
      });
      return rows.map((c) => ({
        status: c.status,
        tranche: c.tranche,
        agent: `${c.agent.user.firstName} ${c.agent.user.lastName}`,
        amount: Number(c.amount),
      }));
    },
  },
  COMPLAINT: {
    label: "Complaints",
    dimensions: [
      { key: "status", label: "Status" },
      { key: "priority", label: "Priority" },
      { key: "category", label: "Category" },
      { key: "ageBucket", label: "Days Since Last Update (open complaints)" },
    ],
    measures: [{ key: "resolutionDays", label: "Resolution Time (days)" }],
    fetchRows: async () => {
      const rows = await prisma.complaint.findMany({
        select: { status: true, priority: true, openedAt: true, resolvedAt: true, updatedAt: true, category: { select: { name: true } } },
      });
      const now = Date.now();
      return rows.map((c) => ({
        status: c.status,
        priority: c.priority,
        category: c.category.name,
        ageBucket: c.resolvedAt ? "Resolved" : ageBucket(Math.floor((now - c.updatedAt.getTime()) / 86400000)),
        resolutionDays: c.resolvedAt ? Math.round((c.resolvedAt.getTime() - c.openedAt.getTime()) / 86400000) : 0,
      }));
    },
  },
  UNIT: {
    label: "Units",
    dimensions: [
      { key: "status", label: "Status" },
      { key: "development", label: "Development" },
      { key: "propertyType", label: "Property Type" },
    ],
    measures: [{ key: "currentPrice", label: "Current Price" }],
    fetchRows: async () => {
      const rows = await prisma.unit.findMany({
        where: { deletedAt: null },
        select: { status: true, currentPrice: true, development: { select: { name: true } }, propertyType: { select: { name: true } } },
      });
      return rows.map((u) => ({
        status: u.status,
        development: u.development.name,
        propertyType: u.propertyType.name,
        currentPrice: Number(u.currentPrice),
      }));
    },
  },
  HANDOVER: {
    label: "Handovers",
    dimensions: [{ key: "status", label: "Status" }, { key: "development", label: "Development" }],
    measures: [],
    fetchRows: async () => {
      const rows = await prisma.handover.findMany({
        select: { status: true, unit: { select: { development: { select: { name: true } } } } },
      });
      return rows.map((h) => ({ status: h.status, development: h.unit.development.name }));
    },
  },
  PAYMENT_SCHEDULE: {
    label: "Payment Schedules (Collections)",
    dimensions: [{ key: "status", label: "Status" }],
    measures: [{ key: "amountDue", label: "Amount Due" }],
    fetchRows: async () => {
      const rows = await prisma.paymentSchedule.findMany({ select: { status: true, amountDue: true } });
      return rows.map((r) => ({ status: r.status, amountDue: Number(r.amountDue) }));
    },
  },
  MARKETING_CAMPAIGN: {
    label: "Marketing Campaigns",
    dimensions: [
      { key: "status", label: "Status" },
      { key: "channel", label: "Channel" },
    ],
    // Budget is optional on a campaign — most seeded campaigns don't have one set yet, so a SUM
    // here reflects only campaigns where a real budget was actually entered, not a fabricated total.
    measures: [{ key: "budget", label: "Budget" }],
    fetchRows: async () => {
      const rows = await prisma.marketingCampaign.findMany({
        select: { status: true, channel: true, budget: true },
      });
      return rows.map((c) => ({ status: c.status, channel: c.channel, budget: c.budget ? Number(c.budget) : 0 }));
    },
  },
  SALES_TARGET: {
    label: "Sales Targets",
    dimensions: [
      { key: "user", label: "Sales Rep" },
      { key: "periodType", label: "Period Type" },
    ],
    measures: [
      { key: "targetValue", label: "Target Value" },
      { key: "targetDeals", label: "Target Deals" },
      { key: "actualValue", label: "Actual Sales Value" },
      { key: "attainmentPct", label: "Attainment Rate (%)" },
    ],
    fetchRows: async () => {
      const targets = await prisma.salesTarget.findMany({
        select: {
          periodType: true,
          periodStart: true,
          periodEnd: true,
          targetValue: true,
          targetDeals: true,
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      });
      const rows: ReportRow[] = [];
      for (const t of targets) {
        const sales = await prisma.sale.findMany({
          where: {
            deletedAt: null,
            status: "COMPLETED",
            saleDate: { gte: t.periodStart, lte: t.periodEnd },
            commissions: { some: { agent: { userId: t.user.id } } },
          },
          select: { salePrice: true },
        });
        const actualValue = sales.reduce((sum, s) => sum + Number(s.salePrice), 0);
        const targetValue = Number(t.targetValue);
        rows.push({
          user: `${t.user.firstName} ${t.user.lastName}`,
          periodType: t.periodType,
          targetValue,
          targetDeals: t.targetDeals,
          actualValue,
          attainmentPct: targetValue > 0 ? Math.round((actualValue / targetValue) * 100) : 0,
        });
      }
      return rows;
    },
  },
  SALES_POINT: {
    label: "Sales Points (Gamification)",
    dimensions: [
      { key: "user", label: "Sales Rep" },
      { key: "category", label: "Category" },
    ],
    measures: [{ key: "points", label: "Points" }],
    fetchRows: async () => {
      const rows = await prisma.salesPoint.findMany({
        select: { points: true, category: true, user: { select: { firstName: true, lastName: true } } },
      });
      return rows.map((p) => ({
        user: `${p.user.firstName} ${p.user.lastName}`,
        category: p.category,
        points: p.points,
      }));
    },
  },
  SALES_ACHIEVEMENT: {
    label: "Sales Achievements (Gamification)",
    dimensions: [
      { key: "user", label: "Sales Rep" },
      { key: "badgeCategory", label: "Badge Category" },
    ],
    measures: [],
    fetchRows: async () => {
      const rows = await prisma.salesAchievement.findMany({
        select: { user: { select: { firstName: true, lastName: true } }, badge: { select: { category: true } } },
      });
      return rows.map((a) => ({
        user: `${a.user.firstName} ${a.user.lastName}`,
        badgeCategory: a.badge.category,
      }));
    },
  },
  LEAD_ACTIVITY: {
    label: "Lead Activities",
    dimensions: [
      { key: "type", label: "Activity Type" },
      { key: "createdBy", label: "Logged By" },
    ],
    measures: [],
    fetchRows: async () => {
      const rows = await prisma.leadActivity.findMany({
        select: { type: true, createdBy: { select: { firstName: true, lastName: true } } },
      });
      return rows.map((a) => ({
        type: a.type,
        createdBy: `${a.createdBy.firstName} ${a.createdBy.lastName}`,
      }));
    },
  },
  INTERACTION: {
    label: "Interactions (Opportunities & Customers)",
    dimensions: [
      { key: "type", label: "Channel" },
      { key: "relatedEntityType", label: "Related To" },
    ],
    measures: [],
    fetchRows: async () => {
      const rows = await prisma.interaction.findMany({
        select: { type: true, relatedEntityType: true },
      });
      return rows.map((i) => ({ type: i.type, relatedEntityType: i.relatedEntityType }));
    },
  },
};

export const REPORT_ENTITY_KEYS = Object.keys(REPORT_ENTITIES) as ReportEntityKey[];

export function getReportEntityDef(entity: ReportEntityKey): ReportEntityDef {
  const def = REPORT_ENTITIES[entity];
  if (!def) throw new Error(`Unknown report entity "${entity}"`);
  return def;
}

export function isValidDimension(entity: ReportEntityKey, field: string): boolean {
  return getReportEntityDef(entity).dimensions.some((d) => d.key === field);
}

export function isValidMeasure(entity: ReportEntityKey, field: string): boolean {
  return getReportEntityDef(entity).measures.some((m) => m.key === field);
}

export function getReportableEntities() {
  return REPORT_ENTITY_KEYS.map((key) => ({
    key,
    label: REPORT_ENTITIES[key].label,
    dimensions: REPORT_ENTITIES[key].dimensions,
    measures: REPORT_ENTITIES[key].measures,
  }));
}
