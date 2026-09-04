import { prisma } from "@/lib/prisma";

// Pre-conversion pipeline — distinct from the post-conversion Opportunity Kanban at /sales.
// Tracks a contacted Lead through Nurturing toward Real Opportunity / Convert, surfacing
// staleness per stage since that's the single biggest finding in the real pipeline diagnostic
// (203 leads sat in Nurturing, 65% untouched 60+ days).
//
// Stage membership/labels/staleness thresholds now come from PipelineStage
// (countsAsNurtureActive / label / staleAfterDays) instead of the old hardcoded
// NURTURE_STAGES/NURTURE_STAGE_LABEL/STALE_THRESHOLD_DAYS maps — src/components/leads/
// nurture-pipeline.tsx resolves the ordered stage list itself via getOrderedStages().
export async function getNurturePipeline() {
  const leads = await prisma.lead.findMany({
    where: { deletedAt: null, pipelineStage: { countsAsNurtureActive: true } },
    select: {
      id: true,
      status: true,
      createdAt: true,
      bantScore: true,
      customer: { select: { firstName: true, lastName: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
      activities: { select: { occurredAt: true }, orderBy: { occurredAt: "desc" }, take: 1 },
      pipelineStage: { select: { staleAfterDays: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = Date.now();

  return leads.map((l) => {
    const lastActivityAt = l.activities[0]?.occurredAt ?? l.createdAt;
    const daysSinceActivity = Math.floor((now - lastActivityAt.getTime()) / 86400000);
    // Same "?? 14" fallback default the old STALE_THRESHOLD_DAYS-driven code used for any
    // status not explicitly listed in that map.
    const threshold = l.pipelineStage?.staleAfterDays ?? 14;
    return {
      id: l.id,
      status: l.status,
      customerName: `${l.customer.firstName} ${l.customer.lastName}`,
      assignedToName: l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}` : "Unassigned",
      bantScore: l.bantScore,
      daysSinceActivity,
      isStale: daysSinceActivity >= threshold,
      staleThresholdDays: threshold,
    };
  });
}

export type NurtureLeadRow = Awaited<ReturnType<typeof getNurturePipeline>>[number];

// Per-rep active book size — the real diagnostic shows conversion collapses past ~40 active
// leads per rep. Surfaced as a KPI + over-capacity flag, not enforced (no auto-routing built).
export const REP_BOOK_SIZE_CAP = 40;

export async function getRepBookSizes() {
  const grouped = await prisma.lead.groupBy({
    by: ["assignedToId"],
    where: { deletedAt: null, assignedToId: { not: null }, pipelineStage: { countsAsNurtureActive: true } },
    _count: { _all: true },
  });

  const users = await prisma.user.findMany({
    where: { id: { in: grouped.map((g) => g.assignedToId).filter((id): id is string => !!id) } },
    select: { id: true, firstName: true, lastName: true },
  });
  const nameById = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));

  return grouped
    .map((g) => ({
      userId: g.assignedToId as string,
      name: nameById.get(g.assignedToId as string) ?? "Unknown",
      activeLeads: g._count._all,
      overCapacity: g._count._all > REP_BOOK_SIZE_CAP,
    }))
    .sort((a, b) => b.activeLeads - a.activeLeads);
}
