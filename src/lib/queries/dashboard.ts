import { prisma } from "@/lib/prisma";
import { getOrderedStages } from "@/lib/pipeline/stages";

export type DashboardKpis = {
  activeLeads: number;
  activeLeadsChangePct: number | null;
  unitsAvailable: number;
  totalUnits: number;
  revenue: number;
  openComplaints: number;
};

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    activeLeads,
    leadsLast30,
    leadsPrior30,
    unitsAvailable,
    totalUnits,
    salesAgg,
    openComplaints,
  ] = await Promise.all([
    prisma.lead.count({ where: { pipelineStage: { countsAsAgeingOpen: true }, deletedAt: null } }),
    prisma.lead.count({ where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null } }),
    prisma.lead.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, deletedAt: null } }),
    prisma.unit.count({ where: { status: "AVAILABLE", deletedAt: null } }),
    prisma.unit.count({ where: { deletedAt: null } }),
    prisma.sale.aggregate({
      where: { status: { in: ["ACTIVE", "COMPLETED"] }, deletedAt: null },
      _sum: { salePrice: true },
    }),
    prisma.complaint.count({ where: { status: { notIn: ["RESOLVED", "CLOSED"] } } }),
  ]);

  const activeLeadsChangePct =
    leadsPrior30 > 0 ? Math.round(((leadsLast30 - leadsPrior30) / leadsPrior30) * 100) : null;

  return {
    activeLeads,
    activeLeadsChangePct,
    unitsAvailable,
    totalUnits,
    revenue: Number(salesAgg._sum.salePrice ?? 0),
    openComplaints,
  };
}

export type PipelineStage = {
  label: string;
  count: number;
  value: number;
};

export async function getPipelineFunnel(): Promise<PipelineStage[]> {
  const grouped = await prisma.opportunity.groupBy({
    by: ["pipelineStageId"],
    where: { pipelineStage: { isLostStage: { not: true } }, deletedAt: null },
    _count: { _all: true },
    _sum: { expectedValue: true },
  });

  const byStageId = new Map(grouped.map((g) => [g.pipelineStageId, g]));
  const stages = (await getOrderedStages("SALES_OPPORTUNITY")).filter((s) => !s.isLostStage);

  return stages.map((s) => ({
    label: s.label,
    count: byStageId.get(s.id)?._count._all ?? 0,
    value: Number(byStageId.get(s.id)?._sum.expectedValue ?? 0),
  }));
}

export type RecentActivityItem = {
  id: string;
  actor: string;
  description: string;
  occurredAt: Date;
};

export async function getRecentActivity(limit = 6): Promise<RecentActivityItem[]> {
  const activities = await prisma.leadActivity.findMany({
    orderBy: { occurredAt: "desc" },
    take: limit,
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      lead: { select: { customer: { select: { firstName: true, lastName: true } } } },
    },
  });

  return activities.map((a) => ({
    id: a.id,
    actor: `${a.createdBy.firstName} ${a.createdBy.lastName}`,
    description: `${a.type.replace("_", " ").toLowerCase()} — ${a.lead.customer.firstName} ${a.lead.customer.lastName}${a.description ? `: ${a.description}` : ""}`,
    occurredAt: a.occurredAt,
  }));
}
