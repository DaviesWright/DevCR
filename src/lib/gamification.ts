import { prisma } from "@/lib/prisma";

// Point values for real, already-instrumented sales events (Sales Enhancement doc §2.1.2,
// trimmed to what this app can actually observe — no CSAT-survey or streak tracking exists).
export const SALES_POINTS = {
  LEAD_CREATED: 5,
  LEAD_QUALIFIED: 15,
  REAL_OPPORTUNITY: 20,
  SITE_VISIT_LOGGED: 25,
  RESERVATION_MADE: 30,
  CONTRACT_STAGE: 50,
  CLOSED_WON: 200,
  HANDOVER_QUALITY: 50,
} as const;

export function awardPoints(userId: string, points: number, reason: string, category: string) {
  return prisma.salesPoint.create({ data: { userId, points, reason, category } });
}

export const TIERS = [
  { name: "Bronze", min: 0, icon: "🥉" },
  { name: "Silver", min: 501, icon: "🥈" },
  { name: "Gold", min: 1501, icon: "🥇" },
  { name: "Platinum", min: 3001, icon: "💎" },
  { name: "Diamond", min: 5001, icon: "👑" },
] as const;

export function tierForPoints(points: number): (typeof TIERS)[number] {
  let current: (typeof TIERS)[number] = TIERS[0];
  for (const t of TIERS) if (points >= t.min) current = t;
  return current;
}

export const BADGE_DEFINITIONS = [
  { code: "ROOKIE", name: "Rookie", icon: "🌱", category: "GROWTH", description: "First deal closed." },
  { code: "CLOSER", name: "Closer", icon: "📈", category: "VOLUME", description: "10 deals closed." },
  { code: "CHAMPION", name: "Champion", icon: "🏆", category: "VOLUME", description: "25 deals closed." },
  { code: "LEGEND", name: "Legend", icon: "👑", category: "VOLUME", description: "50+ deals closed." },
  { code: "ROCKET", name: "Rocket", icon: "🚀", category: "SPEED", description: "Closed a deal in under 30 days." },
  { code: "LIGHTNING", name: "Lightning", icon: "⚡", category: "SPEED", description: "Closed a deal in under 14 days." },
  { code: "NETWORKER", name: "Networker", icon: "🤝", category: "REFERRALS", description: "3+ referral-sourced deals won." },
  { code: "INFLUENCER", name: "Influencer", icon: "📣", category: "REFERRALS", description: "10+ referral-sourced deals won." },
  { code: "STAR", name: "Star", icon: "⭐", category: "QUALITY", description: "5+ handovers rated 8/10 or higher." },
  { code: "CLIMBER", name: "Climber", icon: "🧗", category: "GROWTH", description: "Reached Silver tier." },
  { code: "SUMMIT", name: "Summit", icon: "🏔️", category: "GROWTH", description: "Reached Diamond tier." },
] as const;

// Recomputes badge eligibility from real records and upserts newly-earned ones. Called
// opportunistically (Sales Performance page load, and after point-earning actions) rather
// than via a background job — same "no scheduler exists" convention as reservation expiry.
export async function evaluateAndAwardBadges(userId: string) {
  const [totalPointsAgg, closedWonOpportunities, handovers] = await Promise.all([
    prisma.salesPoint.aggregate({ where: { userId }, _sum: { points: true } }),
    prisma.opportunity.findMany({
      where: { ownerId: userId, pipelineStage: { isWonStage: true } },
      select: { createdAt: true, closedAt: true, lead: { select: { source: { select: { name: true } } } } },
    }),
    prisma.clientHandover.findMany({
      where: { consultantId: userId, qualityScore: { not: null } },
      select: { qualityScore: true },
    }),
  ]);

  const totalPoints = totalPointsAgg._sum.points ?? 0;
  const dealsClosedCount = closedWonOpportunities.length;
  const fastCloses = closedWonOpportunities.filter(
    (o) => o.closedAt && o.closedAt.getTime() - o.createdAt.getTime() < 30 * 86400000
  );
  const veryFastCloses = closedWonOpportunities.filter(
    (o) => o.closedAt && o.closedAt.getTime() - o.createdAt.getTime() < 14 * 86400000
  );
  const referralClosedCount = closedWonOpportunities.filter((o) => o.lead?.source?.name === "Referral").length;
  const starHandovers = handovers.filter((h) => (h.qualityScore ?? 0) >= 8).length;

  const earnedCodes: string[] = [];
  if (dealsClosedCount >= 1) earnedCodes.push("ROOKIE");
  if (dealsClosedCount >= 10) earnedCodes.push("CLOSER");
  if (dealsClosedCount >= 25) earnedCodes.push("CHAMPION");
  if (dealsClosedCount >= 50) earnedCodes.push("LEGEND");
  if (fastCloses.length >= 1) earnedCodes.push("ROCKET");
  if (veryFastCloses.length >= 1) earnedCodes.push("LIGHTNING");
  if (referralClosedCount >= 3) earnedCodes.push("NETWORKER");
  if (referralClosedCount >= 10) earnedCodes.push("INFLUENCER");
  if (starHandovers >= 5) earnedCodes.push("STAR");
  if (totalPoints >= 501) earnedCodes.push("CLIMBER");
  if (totalPoints >= 5001) earnedCodes.push("SUMMIT");

  if (earnedCodes.length === 0) return;

  const badges = await prisma.salesBadge.findMany({ where: { code: { in: earnedCodes } } });
  await Promise.all(
    badges.map((b) =>
      prisma.salesAchievement.upsert({
        where: { userId_badgeId: { userId, badgeId: b.id } },
        create: { userId, badgeId: b.id },
        update: {},
      })
    )
  );
}

// Seed-only: the existing sample data (leads, opportunities, sales) is created directly via
// prisma.*.create rather than through the point-awarding actions above, so the leaderboard
// would otherwise be empty on first load. Walks the already-seeded records once and awards
// the same points a rep would have earned had they done this work through the app.
export async function backfillHistoricalPoints() {
  const leads = await prisma.lead.findMany({
    where: { assignedToId: { not: null } },
    select: { assignedToId: true, qualificationStatus: true, status: true },
  });
  for (const l of leads) {
    if (!l.assignedToId) continue;
    await awardPoints(l.assignedToId, SALES_POINTS.LEAD_CREATED, "Lead created (seed)", "LEAD");
    if (l.qualificationStatus === "QUALIFIED") {
      await awardPoints(l.assignedToId, SALES_POINTS.LEAD_QUALIFIED, "Lead qualified (seed)", "QUALIFY");
    }
    if (l.status === "REAL_OPPORTUNITY") {
      await awardPoints(l.assignedToId, SALES_POINTS.REAL_OPPORTUNITY, "Real Opportunity (seed)", "REAL_OPPORTUNITY");
    }
  }

  const opportunities = await prisma.opportunity.findMany({
    select: { ownerId: true, pipelineStage: { select: { key: true, isWonStage: true } } },
  });
  for (const o of opportunities) {
    if (o.pipelineStage?.key === "CONTRACT" || o.pipelineStage?.isWonStage) {
      await awardPoints(o.ownerId, SALES_POINTS.CONTRACT_STAGE, "Deal reached Contract (seed)", "CONTRACT");
    }
    if (o.pipelineStage?.isWonStage) {
      await awardPoints(o.ownerId, SALES_POINTS.CLOSED_WON, "Deal closed won (seed)", "CLOSED_WON");
    }
  }

  const reservations = await prisma.reservation.findMany({
    where: { opportunityId: { not: null } },
    select: { opportunity: { select: { ownerId: true } } },
  });
  for (const r of reservations) {
    if (r.opportunity) {
      await awardPoints(r.opportunity.ownerId, SALES_POINTS.RESERVATION_MADE, "Reservation (seed)", "RESERVATION");
    }
  }

  const userIds = new Set<string>();
  for (const l of leads) if (l.assignedToId) userIds.add(l.assignedToId);
  for (const o of opportunities) userIds.add(o.ownerId);
  for (const userId of userIds) await evaluateAndAwardBadges(userId);
}
