import { prisma } from "@/lib/prisma";
import { getDataScopeWhere, type PermissionProfile } from "@/lib/permissions";

// Real, server-enforced data scoping (src/lib/permissions.ts) — a Sales Consultant (OWN scope)
// only ever sees leads assignedToId === them; TEAM/DEPARTMENT scope widens to department peers;
// ALL/SYSTEM (Group Head of Sales, executives, admins) sees everything. Replaces the old
// unscoped findMany that returned every lead to every user regardless of role.
export async function getLeadsList(profile: PermissionProfile) {
  const scopeWhere = await getDataScopeWhere(profile, "assignedToId");
  const leads = await prisma.lead.findMany({
    where: { deletedAt: null, ...scopeWhere },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { firstName: true, lastName: true, email: true, segment: true } },
      source: { select: { name: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
      pipelineStage: { select: { key: true, label: true, badgeVariant: true } },
    },
    take: 100,
  });

  return leads.map((lead) => ({
    id: lead.id,
    name: `${lead.customer.firstName} ${lead.customer.lastName}`,
    email: lead.customer.email ?? "",
    segment: lead.customer.segment,
    source: lead.source.name,
    status: lead.status,
    // pipelineStageId/stage surface the dynamic PipelineStage FK alongside the legacy `status`
    // enum (write-both period) — `stage` is a minimal {key,label,badgeVariant} shape (not the
    // full StageDTO) since list rows only ever render a badge, never stage metadata like
    // probability/staleAfterDays. Null only for the (should-be-nonexistent post-backfill) case
    // of a lead with no pipelineStageId set yet.
    pipelineStageId: lead.pipelineStageId,
    stage: lead.pipelineStage
      ? { key: lead.pipelineStage.key, label: lead.pipelineStage.label, badgeVariant: lead.pipelineStage.badgeVariant }
      : null,
    qualificationStatus: lead.qualificationStatus,
    bantScore: lead.bantScore,
    lostReason: lead.lostReason,
    assignedToId: lead.assignedToId,
    assignedTo: lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : null,
    budgetMin: lead.budgetMin ? Number(lead.budgetMin) : null,
    budgetMax: lead.budgetMax ? Number(lead.budgetMax) : null,
    currency: lead.currency,
    createdAt: lead.createdAt,
  }));
}

export type LeadListItem = Awaited<ReturnType<typeof getLeadsList>>[number];

export async function getLeadDetail(id: string) {
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      customer: true,
      source: true,
      campaign: true,
      referredBy: { select: { id: true, firstName: true, lastName: true } },
      assignedTo: { select: { firstName: true, lastName: true, email: true } },
      propertyType: true,
      pipelineStage: { select: { key: true, label: true, badgeVariant: true } },
      activities: {
        orderBy: { occurredAt: "desc" },
        include: { createdBy: { select: { firstName: true, lastName: true } } },
      },
      opportunities: {
        include: { unit: { select: { unitNumber: true } } },
        orderBy: { createdAt: "desc" },
      },
      siteVisits: { orderBy: { scheduledAt: "desc" } },
      bantScores: { orderBy: { createdAt: "desc" }, take: 1 },
      behavioralScores: { orderBy: { scoreDate: "desc" }, take: 1 },
    },
  });

  if (!lead) return null;

  const tasks = await prisma.task.findMany({
    where: { relatedEntityType: "LEAD", relatedEntityId: id },
    orderBy: { createdAt: "desc" },
    include: { assignedTo: { select: { firstName: true, lastName: true } } },
  });

  const latestBant = lead.bantScores[0] ?? null;
  const latestBehavioral = lead.behavioralScores[0] ?? null;

  return {
    id: lead.id,
    status: lead.status,
    // pipelineStageId/stage mirror LeadListItem's shape above — a full {key,label,badgeVariant}
    // is enough for LeadStatusBadge; consumers needing stageOrder/probability/etc. should fetch
    // via getOrderedStages("LEAD_NURTURE") directly rather than widen this shape further.
    pipelineStageId: lead.pipelineStageId,
    stage: lead.pipelineStage
      ? { key: lead.pipelineStage.key, label: lead.pipelineStage.label, badgeVariant: lead.pipelineStage.badgeVariant }
      : null,
    qualificationStatus: lead.qualificationStatus,
    bantScore: lead.bantScore,
    realOpportunityAt: lead.realOpportunityAt,
    suspectedPersona: lead.suspectedPersona,
    suspectedPersonaNote: lead.suspectedPersonaNote,
    notes: lead.notes,
    lostReason: lead.lostReason,
    lostReasonNote: lead.lostReasonNote,
    assignedToId: lead.assignedToId,
    preferredLocation: lead.preferredLocation,
    propertyType: lead.propertyType?.name ?? null,
    budgetMin: lead.budgetMin ? Number(lead.budgetMin) : null,
    budgetMax: lead.budgetMax ? Number(lead.budgetMax) : null,
    currency: lead.currency,
    createdAt: lead.createdAt,
    customer: {
      id: lead.customer.id,
      firstName: lead.customer.firstName,
      lastName: lead.customer.lastName,
      email: lead.customer.email,
      phone: lead.customer.phone,
      segment: lead.customer.segment,
    },
    source: lead.source.name,
    campaign: lead.campaign?.name ?? null,
    referredBy: lead.referredBy ? { id: lead.referredBy.id, name: `${lead.referredBy.firstName} ${lead.referredBy.lastName}` } : null,
    referralRewardStatus: lead.referralRewardStatus,
    assignedTo: lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : null,
    bantBreakdown: latestBant
      ? {
          budget: latestBant.budgetScore,
          authority: latestBant.authorityScore,
          need: latestBant.needScore,
          timeline: latestBant.timelineScore,
          fit: latestBant.fitScore,
          total: latestBant.totalScore,
          notes: latestBant.notes,
        }
      : null,
    engagement: latestBehavioral
      ? {
          score: latestBehavioral.totalScore,
          level: latestBehavioral.engagementLevel,
          emailOpens: latestBehavioral.emailOpens,
          emailClicks: latestBehavioral.emailClicks,
          siteVisits: latestBehavioral.siteVisits,
          meetingsAttended: latestBehavioral.meetingsAttended,
          callsCompleted: latestBehavioral.callsCompleted,
        }
      : null,
    activities: lead.activities.map((a) => ({
      id: a.id,
      type: a.type,
      description: a.description,
      occurredAt: a.occurredAt,
      by: `${a.createdBy.firstName} ${a.createdBy.lastName}`,
    })),
    opportunities: lead.opportunities.map((o) => ({
      id: o.id,
      stage: o.stage,
      expectedValue: Number(o.expectedValue),
      currency: o.currency,
      unitNumber: o.unit?.unitNumber ?? null,
    })),
    siteVisits: lead.siteVisits.map((v) => ({
      id: v.id,
      status: v.status,
      scheduledAt: v.scheduledAt,
    })),
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      assignedTo: `${t.assignedTo.firstName} ${t.assignedTo.lastName}`,
    })),
  };
}

export type LeadDetail = NonNullable<Awaited<ReturnType<typeof getLeadDetail>>>;
