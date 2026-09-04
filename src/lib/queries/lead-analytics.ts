import { prisma } from "@/lib/prisma";
import type { InteractionType } from "@prisma/client";
import { AGE_BUCKETS, LOST_REASON_LABEL } from "@/lib/leads/lead-taxonomy";

const CONTACT_TYPES: InteractionType[] = ["CALL", "EMAIL", "MEETING", "SITE_VISIT"];

export async function getAvgTimeToFirstContact() {
  const [leads, firstContacts] = await Promise.all([
    prisma.lead.findMany({ where: { deletedAt: null }, select: { id: true, createdAt: true } }),
    prisma.leadActivity.groupBy({
      by: ["leadId"],
      where: { type: { in: CONTACT_TYPES } },
      _min: { occurredAt: true },
    }),
  ]);

  const firstContactByLead = new Map(
    firstContacts.filter((f) => f._min.occurredAt).map((f) => [f.leadId, f._min.occurredAt as Date])
  );
  const leadsById = new Map(leads.map((l) => [l.id, l.createdAt]));

  const diffsHours: number[] = [];
  for (const [leadId, firstAt] of firstContactByLead) {
    const createdAt = leadsById.get(leadId);
    if (!createdAt) continue;
    diffsHours.push((firstAt.getTime() - createdAt.getTime()) / 3_600_000);
  }

  const contactedCount = diffsHours.length;
  const avgHours = contactedCount ? diffsHours.reduce((a, b) => a + b, 0) / contactedCount : null;

  return { avgHours, contactedCount, totalLeads: leads.length };
}

export async function getTaskStats() {
  const now = new Date();
  const [completed, overdue, pending] = await Promise.all([
    prisma.task.count({ where: { relatedEntityType: "LEAD", status: "COMPLETED" } }),
    prisma.task.count({
      where: { relatedEntityType: "LEAD", status: { in: ["OPEN", "IN_PROGRESS"] }, dueDate: { lt: now } },
    }),
    prisma.task.count({ where: { relatedEntityType: "LEAD", status: { in: ["OPEN", "IN_PROGRESS"] } } }),
  ]);
  return { completed, overdue, pending };
}

export async function getConversionStats() {
  const [total, converted, opportunitiesFromLeads, valueAgg] = await Promise.all([
    prisma.lead.count({ where: { deletedAt: null } }),
    prisma.lead.count({ where: { deletedAt: null, pipelineStage: { isWonStage: true } } }),
    prisma.opportunity.groupBy({ by: ["leadId"], where: { leadId: { not: null }, deletedAt: null } }),
    prisma.opportunity.aggregate({
      where: { leadId: { not: null }, deletedAt: null },
      _sum: { expectedValue: true },
    }),
  ]);

  return {
    totalLeads: total,
    convertedLeads: converted,
    conversionRate: total ? (converted / total) * 100 : 0,
    leadsConvertedToOpportunities: opportunitiesFromLeads.length,
    opportunityValueFromLeads: Number(valueAgg._sum.expectedValue ?? 0),
  };
}

export async function getSalespersonActivity() {
  const users = await prisma.user.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true, firstName: true, lastName: true },
  });

  const [assignedCounts, activityCounts, completedTaskCounts, convertedCounts] = await Promise.all([
    prisma.lead.groupBy({ by: ["assignedToId"], where: { deletedAt: null, assignedToId: { not: null } }, _count: { _all: true } }),
    prisma.leadActivity.groupBy({ by: ["createdById"], _count: { _all: true } }),
    prisma.task.groupBy({
      by: ["assignedToId"],
      where: { relatedEntityType: "LEAD", status: "COMPLETED" },
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ["assignedToId"],
      where: { deletedAt: null, assignedToId: { not: null }, pipelineStage: { isWonStage: true } },
      _count: { _all: true },
    }),
  ]);

  const assignedMap = new Map(assignedCounts.map((c) => [c.assignedToId, c._count._all]));
  const activityMap = new Map(activityCounts.map((c) => [c.createdById, c._count._all]));
  const taskMap = new Map(completedTaskCounts.map((c) => [c.assignedToId, c._count._all]));
  const convertedMap = new Map(convertedCounts.map((c) => [c.assignedToId, c._count._all]));

  return users
    .map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      leadsAssigned: assignedMap.get(u.id) ?? 0,
      activitiesLogged: activityMap.get(u.id) ?? 0,
      tasksCompleted: taskMap.get(u.id) ?? 0,
      leadsConverted: convertedMap.get(u.id) ?? 0,
    }))
    .filter((u) => u.leadsAssigned > 0 || u.activitiesLogged > 0)
    .sort((a, b) => b.activitiesLogged - a.activitiesLogged);
}

export async function getLeadAgeing() {
  const openLeads = await prisma.lead.findMany({
    where: { deletedAt: null, pipelineStage: { countsAsAgeingOpen: true } },
    select: { createdAt: true },
  });

  const now = Date.now();
  const buckets = AGE_BUCKETS.map((b) => ({ ...b, count: 0 }));

  for (const lead of openLeads) {
    const ageDays = (now - lead.createdAt.getTime()) / 86_400_000;
    const bucket = buckets.find((b) => ageDays >= b.min && ageDays <= b.max);
    if (bucket) bucket.count += 1;
  }

  return { buckets, totalOpen: openLeads.length };
}

export async function getLostReasonBreakdown() {
  const grouped = await prisma.lead.groupBy({
    by: ["lostReason"],
    where: { deletedAt: null, pipelineStage: { isLostStage: true }, lostReason: { not: null } },
    _count: { _all: true },
  });

  return grouped
    .map((g) => ({
      reasonKey: g.lostReason as string,
      reason: LOST_REASON_LABEL[g.lostReason as string] ?? g.lostReason,
      count: g._count._all,
    }))
    .sort((a, b) => b.count - a.count);
}

// Average BANT+ pillar scores (Budget/Authority/Need/Timeline/Fit) across every lead's latest
// assessment — the aggregate view the per-lead breakdown on the Lead detail page never showed.
export async function getBantAverages() {
  const latestPerLead = await prisma.bantScore.findMany({
    orderBy: { createdAt: "desc" },
    distinct: ["leadId"],
    select: { budgetScore: true, authorityScore: true, needScore: true, timelineScore: true, fitScore: true, totalScore: true },
  });

  const count = latestPerLead.length;
  const avg = (key: keyof (typeof latestPerLead)[number]) =>
    count ? Math.round(latestPerLead.reduce((sum, s) => sum + s[key], 0) / count) : 0;

  return {
    scoredLeadCount: count,
    budget: avg("budgetScore"),
    authority: avg("authorityScore"),
    need: avg("needScore"),
    timeline: avg("timelineScore"),
    fit: avg("fitScore"),
    total: avg("totalScore"),
  };
}

export async function getConversionBySource() {
  const sources = await prisma.leadSource.findMany({ select: { id: true, name: true } });
  const [totals, converted] = await Promise.all([
    prisma.lead.groupBy({ by: ["sourceId"], where: { deletedAt: null }, _count: { _all: true } }),
    prisma.lead.groupBy({ by: ["sourceId"], where: { deletedAt: null, pipelineStage: { isWonStage: true } }, _count: { _all: true } }),
  ]);

  const totalMap = new Map(totals.map((t) => [t.sourceId, t._count._all]));
  const convertedMap = new Map(converted.map((c) => [c.sourceId, c._count._all]));

  return sources
    .map((s) => {
      const total = totalMap.get(s.id) ?? 0;
      const won = convertedMap.get(s.id) ?? 0;
      return { source: s.name, total, converted: won, rate: total ? (won / total) * 100 : 0 };
    })
    .filter((s) => s.total > 0)
    .sort((a, b) => b.total - a.total);
}
