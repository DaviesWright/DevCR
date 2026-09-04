import { prisma } from "@/lib/prisma";
import { BADGE_DEFINITIONS, tierForPoints, evaluateAndAwardBadges } from "@/lib/gamification";
import { getStageIdByKey } from "@/lib/pipeline/stages";

function periodStart(period: "monthly" | "quarterly" | "yearly", now: Date): Date {
  if (period === "monthly") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "quarterly") return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  return new Date(now.getFullYear(), 0, 1);
}

export async function getLeaderboard(period: "monthly" | "quarterly" | "yearly") {
  const since = periodStart(period, new Date());

  const grouped = await prisma.salesPoint.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: since } },
    _sum: { points: true },
  });

  const userIds = grouped.map((g) => g.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firstName: true, lastName: true, role: { select: { name: true } } },
  });
  const userById = new Map(users.map((u) => [u.id, u]));

  return grouped
    .map((g) => {
      const points = g._sum.points ?? 0;
      const user = userById.get(g.userId);
      return {
        userId: g.userId,
        name: user ? `${user.firstName} ${user.lastName}` : "Unknown",
        roleName: user?.role?.name ?? null,
        points,
        tier: tierForPoints(points),
      };
    })
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);
}

export async function getUserGamificationProfile(userId: string) {
  await evaluateAndAwardBadges(userId);

  const [totalAgg, monthAgg, achievements] = await Promise.all([
    prisma.salesPoint.aggregate({ where: { userId }, _sum: { points: true } }),
    prisma.salesPoint.aggregate({ where: { userId, createdAt: { gte: periodStart("monthly", new Date()) } }, _sum: { points: true } }),
    prisma.salesAchievement.findMany({ where: { userId }, select: { badge: { select: { code: true } } } }),
  ]);

  const totalPoints = totalAgg._sum.points ?? 0;
  const monthPoints = monthAgg._sum.points ?? 0;
  const earnedCodes = new Set(achievements.map((a) => a.badge.code));
  const nextBadge = BADGE_DEFINITIONS.find((b) => !earnedCodes.has(b.code)) ?? null;

  return {
    totalPoints,
    monthPoints,
    tier: tierForPoints(totalPoints),
    badges: BADGE_DEFINITIONS.map((b) => ({ ...b, earned: earnedCodes.has(b.code) })),
    earnedCount: earnedCodes.size,
    totalBadgeCount: BADGE_DEFINITIONS.length,
    nextBadge,
  };
}

export async function getUserTargetProgress(userId: string) {
  const now = new Date();
  const targets = await prisma.salesTarget.findMany({
    where: { userId, periodStart: { lte: now }, periodEnd: { gte: now } },
  });

  const results = await Promise.all(
    targets.map(async (t) => {
      const won = await prisma.opportunity.findMany({
        where: { ownerId: userId, pipelineStage: { isWonStage: true }, closedAt: { gte: t.periodStart, lte: t.periodEnd } },
        select: { expectedValue: true },
      });
      const achievedDeals = won.length;
      const achievedValue = won.reduce((sum, o) => sum + Number(o.expectedValue), 0);

      const totalMs = t.periodEnd.getTime() - t.periodStart.getTime();
      const elapsedMs = Math.min(Math.max(now.getTime() - t.periodStart.getTime(), 0), totalMs);
      const elapsedFraction = totalMs > 0 ? elapsedMs / totalMs : 1;
      const daysRemaining = Math.max(0, Math.ceil((t.periodEnd.getTime() - now.getTime()) / 86400000));

      const dealProgress = t.targetDeals > 0 ? achievedDeals / t.targetDeals : 0;
      const pace: "ahead" | "on_track" | "behind" =
        dealProgress >= elapsedFraction ? (dealProgress >= elapsedFraction + 0.15 ? "ahead" : "on_track") : "behind";
      const projectedDeals = elapsedFraction > 0.05 ? Math.round(achievedDeals / elapsedFraction) : achievedDeals;

      return {
        id: t.id,
        periodType: t.periodType,
        targetDeals: t.targetDeals,
        targetValue: Number(t.targetValue),
        currency: t.currency,
        achievedDeals,
        achievedValue,
        progressPct: Math.round(Math.min(dealProgress, 1) * 100),
        daysRemaining,
        pace,
        projectedDeals,
      };
    })
  );

  return results.sort((a, b) => a.periodType.localeCompare(b.periodType));
}

// Deal aging: how long an open Opportunity has sat since its last stage move. `updatedAt`
// changes on every moveOpportunityStage call, so days-since-updatedAt is a faithful proxy for
// "days in current stage" without needing a separate stage-history table.
export async function getDealAgingAlerts() {
  const opportunities = await prisma.opportunity.findMany({
    where: { deletedAt: null, pipelineStage: { isWonStage: false, isLostStage: false } },
    select: {
      id: true,
      stage: true,
      updatedAt: true,
      customer: { select: { firstName: true, lastName: true } },
      owner: { select: { firstName: true, lastName: true } },
    },
  });

  const now = Date.now();
  return opportunities
    .map((o) => ({
      id: o.id,
      customerName: `${o.customer.firstName} ${o.customer.lastName}`,
      ownerName: `${o.owner.firstName} ${o.owner.lastName}`,
      stage: o.stage,
      daysInStage: Math.floor((now - o.updatedAt.getTime()) / 86400000),
    }))
    .filter((o) => o.daysInStage >= 14)
    .map((o) => ({ ...o, severity: o.daysInStage >= 30 ? ("CRITICAL" as const) : ("WARNING" as const) }))
    .sort((a, b) => b.daysInStage - a.daysInStage);
}

export async function getTimeToCloseAnalytics() {
  const won = await prisma.opportunity.findMany({
    where: { pipelineStage: { isWonStage: true }, closedAt: { not: null } },
    select: { createdAt: true, closedAt: true, siteVisits: { select: { id: true }, take: 1 } },
  });

  if (won.length === 0) {
    return { avgDays: 0, bestDays: 0, worstDays: 0, count: 0, withSiteVisitAvgDays: null, withoutSiteVisitAvgDays: null };
  }

  const days = won.map((o) => Math.max(1, Math.round((o.closedAt!.getTime() - o.createdAt.getTime()) / 86400000)));
  const avgDays = Math.round(days.reduce((s, d) => s + d, 0) / days.length);
  const bestDays = Math.min(...days);
  const worstDays = Math.max(...days);

  const withVisit = won.filter((o) => o.siteVisits.length > 0);
  const withoutVisit = won.filter((o) => o.siteVisits.length === 0);
  const avgOf = (list: typeof won) =>
    list.length
      ? Math.round(
          list.reduce((s, o) => s + Math.max(1, Math.round((o.closedAt!.getTime() - o.createdAt.getTime()) / 86400000)), 0) /
            list.length
        )
      : null;

  return {
    avgDays,
    bestDays,
    worstDays,
    count: won.length,
    withSiteVisitAvgDays: avgOf(withVisit),
    withoutSiteVisitAvgDays: avgOf(withoutVisit),
  };
}

// Data completeness — genuinely computed from the same fields Sales actually fills in, not a
// decorative percentage. Two categories: Contacts (Customer) and Pipeline (Lead).
export async function getDataQualityScore() {
  const [totalCustomers, missingEmail, missingKyc, totalLeads, missingBudget, missingPropertyType] = await Promise.all([
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.customer.count({ where: { deletedAt: null, email: null } }),
    prisma.customer.count({ where: { deletedAt: null, kycStatus: "PENDING" } }),
    prisma.lead.count({ where: { deletedAt: null } }),
    prisma.lead.count({ where: { deletedAt: null, OR: [{ budgetMin: null }, { budgetMax: null }] } }),
    prisma.lead.count({ where: { deletedAt: null, propertyTypeId: null } }),
  ]);

  const contactsScore = totalCustomers ? Math.round(((totalCustomers - missingEmail - missingKyc) / (totalCustomers * 2)) * 100) : 100;
  const pipelineScore = totalLeads ? Math.round(((totalLeads - missingBudget - missingPropertyType) / (totalLeads * 2)) * 100) : 100;
  const overall = Math.round((contactsScore + pipelineScore) / 2);

  const criticalMissing = [
    { field: "Property type", count: missingPropertyType, percentage: totalLeads ? Math.round((missingPropertyType / totalLeads) * 100) : 0 },
    { field: "Budget range", count: missingBudget, percentage: totalLeads ? Math.round((missingBudget / totalLeads) * 100) : 0 },
    { field: "Email address", count: missingEmail, percentage: totalCustomers ? Math.round((missingEmail / totalCustomers) * 100) : 0 },
    { field: "KYC status", count: missingKyc, percentage: totalCustomers ? Math.round((missingKyc / totalCustomers) * 100) : 0 },
  ].filter((f) => f.count > 0);

  return { overall, contactsScore, pipelineScore, criticalMissing };
}

// Priority Action Center: reuses the same signals as the header alerts, but scoped to one
// rep's own book of business and bucketed by urgency rather than a flat list.
export async function getPriorityActions(userId: string) {
  const now = new Date();
  // "Not contacted within 48h" used to be a hardcoded literal (duplicated in alerts.ts) — now
  // reads the actual staleness threshold off the Lead pipeline's NEW stage, so an admin
  // reconfiguring PipelineStage.staleAfterDays changes this without a code deploy.
  const newLeadStage = await getStageIdByKey("LEAD_NURTURE", "NEW");
  const staleAfterDays = newLeadStage.staleAfterDays ?? 2;
  const staleThreshold = new Date(now.getTime() - staleAfterDays * 24 * 60 * 60 * 1000);
  const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  const [staleLeads, expiringReservations, agingDeals] = await Promise.all([
    prisma.lead.findMany({
      where: { assignedToId: userId, pipelineStage: { key: "NEW" }, deletedAt: null, createdAt: { lt: staleThreshold }, activities: { none: {} } },
      select: { id: true, customer: { select: { firstName: true, lastName: true } } },
    }),
    prisma.reservation.findMany({
      where: { status: "ACTIVE", expiryDate: { lte: in2Days, gte: now }, opportunity: { ownerId: userId } },
      select: { id: true, unit: { select: { unitNumber: true } }, customer: { select: { firstName: true, lastName: true } } },
    }),
    prisma.opportunity.findMany({
      where: { ownerId: userId, deletedAt: null, pipelineStage: { isWonStage: false, isLostStage: false } },
      select: { id: true, updatedAt: true, stage: true, customer: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  const urgent = [
    ...staleLeads.map((l) => ({
      id: `lead-${l.id}`,
      label: `Follow up with ${l.customer.firstName} ${l.customer.lastName} — no contact in ${staleAfterDays}d`,
      href: `/leads/${l.id}`,
    })),
    ...expiringReservations.map((r) => ({
      id: `res-${r.id}`,
      label: `Unit ${r.unit.unitNumber} hold expiring — ${r.customer.firstName} ${r.customer.lastName}`,
      href: "/projects",
    })),
  ];

  const important = agingDeals
    .filter((o) => (now.getTime() - o.updatedAt.getTime()) / 86400000 >= 14)
    .map((o) => ({
      id: `deal-${o.id}`,
      label: `${o.customer.firstName} ${o.customer.lastName} — stalled in ${o.stage.replace(/_/g, " ")}`,
      href: "/sales",
    }));

  return { urgent, important };
}
