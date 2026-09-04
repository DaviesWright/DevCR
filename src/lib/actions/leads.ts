"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { awardPoints, SALES_POINTS } from "@/lib/gamification";
import { triggerWorkflows } from "@/lib/workflow-engine";
import { getPermissionProfile, assertCanAccessRecord, assertCanWrite } from "@/lib/permissions";
import { getStageIdByKey } from "@/lib/pipeline/stages";

function revalidateLead(leadId: string) {
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads/analytics");
}

export async function createLead(input: {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  nationality?: string;
  segment?: string;
  sourceId: string;
  campaignId?: string;
  channelId?: string;
  mediumId?: string;
  touchpoint?: string;
  assignedToId?: string;
  propertyTypeId?: string;
  preferredLocation?: string;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  notes?: string;
  actorId?: string;
  referredByCustomerId?: string;
}): Promise<{ leadId: string }> {
  // actorId is optional here — an anonymous/public capture path (e.g. a website form) has no
  // logged-in internal user to check. Only enforced when an internal actor is actually creating
  // the lead through the CRM UI.
  if (input.actorId) {
    assertCanWrite(await getPermissionProfile(input.actorId));
  }

  // Reuses an existing customer by phone (same convention as the tablet
  // lead-capture endpoint) so re-submitting a known contact doesn't fork
  // their record.
  const customer = await prisma.customer.upsert({
    where: { phone: input.phone.trim() },
    update: {
      email: input.email?.trim() || undefined,
      nationality: input.nationality?.trim() || undefined,
      segment: (input.segment as never) || undefined,
      assignedSalesRepId: input.assignedToId || undefined,
    },
    create: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
      nationality: input.nationality?.trim() || null,
      segment: (input.segment as never) || null,
      assignedSalesRepId: input.assignedToId || null,
    },
  });

  // Write-both: resolve the LEAD_NURTURE pipeline's NEW stage so a freshly created lead lands
  // on the dynamic pipeline from day one, alongside the legacy `status` enum.
  const newStage = await getStageIdByKey("LEAD_NURTURE", "NEW");

  const lead = await prisma.lead.create({
    data: {
      customerId: customer.id,
      sourceId: input.sourceId,
      campaignId: input.campaignId || null,
      channelId: input.channelId || null,
      mediumId: input.mediumId || null,
      touchpoint: input.touchpoint?.trim() || null,
      assignedToId: input.assignedToId || null,
      propertyTypeId: input.propertyTypeId || null,
      preferredLocation: input.preferredLocation?.trim() || null,
      budgetMin: input.budgetMin,
      budgetMax: input.budgetMax,
      currency: input.currency || "USD",
      notes: input.notes?.trim() || null,
      status: newStage.key as never,
      pipelineStageId: newStage.id,
      referredByCustomerId: input.referredByCustomerId || null,
      referralRewardStatus: input.referredByCustomerId ? "PENDING" : "NONE",
    },
  });

  // Simulated automated acknowledgment (Sales Team Memorandum issue #1) — no real email/SMS
  // provider is wired up, so this logs a real, visible activity record instead of silently
  // doing nothing, matching the "simulate/log only" scope agreed for external integrations.
  const actorId = input.actorId || input.assignedToId;
  if (actorId) {
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: "EMAIL",
        description: `Automated acknowledgment sent to ${input.email || input.phone} (simulated — no email/SMS provider configured).`,
        createdById: actorId,
      },
    });
  }

  if (actorId) {
    await awardPoints(actorId, SALES_POINTS.LEAD_CREATED, "Lead created", "LEAD");
    await triggerWorkflows("LEAD_CREATED", "LEAD", lead.id, actorId, { source: input.sourceId, segment: input.segment });
  }

  revalidateLead(lead.id);
  return { leadId: lead.id };
}

const VALID_SEGMENTS = new Set(["LOCAL_RESIDENTIAL", "DIASPORA", "CORPORATE", "INVESTOR"]);

export type LeadCsvRow = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  nationality?: string;
  segment?: string;
  source?: string;
  budgetMin?: string;
  budgetMax?: string;
  currency?: string;
  preferredLocation?: string;
  notes?: string;
};

// Bulk CSV import — reuses createLead's own upsert-by-phone/simulated-ack/points logic per row
// (one row is exactly one createLead call) rather than duplicating that logic here. Rows with a
// missing/invalid required field or unrecognized source name are reported back, not silently
// dropped, so the importer can fix and re-upload just the failures.
export async function importLeadsCsv(rows: LeadCsvRow[], actorId: string) {
  assertCanWrite(await getPermissionProfile(actorId));

  const sources = await prisma.leadSource.findMany({ select: { id: true, name: true } });
  const sourceByName = new Map(sources.map((s) => [s.name.toLowerCase(), s.id]));

  let createdCount = 0;
  const errors: { row: number; reason: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2; // +1 for 0-index, +1 for the header row

    if (!r.firstName?.trim() || !r.lastName?.trim()) {
      errors.push({ row: rowNum, reason: "Missing firstName or lastName" });
      continue;
    }
    if (!r.phone?.trim()) {
      errors.push({ row: rowNum, reason: "Missing phone" });
      continue;
    }
    if (r.segment && !VALID_SEGMENTS.has(r.segment.trim().toUpperCase())) {
      errors.push({ row: rowNum, reason: `Invalid segment "${r.segment}" (expected LOCAL_RESIDENTIAL, DIASPORA, CORPORATE, or INVESTOR)` });
      continue;
    }
    const sourceId = r.source?.trim() ? sourceByName.get(r.source.trim().toLowerCase()) : sources[0]?.id;
    if (!sourceId) {
      errors.push({ row: rowNum, reason: r.source ? `Unrecognized source "${r.source}"` : "No lead sources configured" });
      continue;
    }

    try {
      await createLead({
        firstName: r.firstName.trim(),
        lastName: r.lastName.trim(),
        phone: r.phone.trim(),
        email: r.email?.trim() || undefined,
        nationality: r.nationality?.trim() || undefined,
        segment: r.segment?.trim().toUpperCase() || undefined,
        sourceId,
        budgetMin: r.budgetMin ? Number(r.budgetMin) : undefined,
        budgetMax: r.budgetMax ? Number(r.budgetMax) : undefined,
        currency: r.currency?.trim() || undefined,
        preferredLocation: r.preferredLocation?.trim() || undefined,
        notes: r.notes?.trim() || undefined,
        actorId,
      });
      createdCount++;
    } catch (err) {
      errors.push({ row: rowNum, reason: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  revalidatePath("/leads");
  revalidatePath("/leads/analytics");
  return { createdCount, errors };
}

export async function qualifyLead(leadId: string, actorId: string) {
  const existing = await prisma.lead.findUniqueOrThrow({ where: { id: leadId }, select: { assignedToId: true, pipelineStageId: true } });
  const profile = await getPermissionProfile(actorId);
  assertCanWrite(profile);
  await assertCanAccessRecord(profile, existing.assignedToId);

  const targetStage = await getStageIdByKey("LEAD_NURTURE", "QUALIFIED");

  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: targetStage.key as never,
      pipelineStageId: targetStage.id,
      qualificationStatus: "QUALIFIED",
      qualifiedAt: new Date(),
    },
    select: { assignedToId: true },
  });

  await prisma.leadStageHistory.create({
    data: { leadId, fromStageId: existing.pipelineStageId, toStageId: targetStage.id, changedById: actorId },
  });

  if (lead.assignedToId) {
    await awardPoints(lead.assignedToId, SALES_POINTS.LEAD_QUALIFIED, "Lead qualified", "QUALIFY");
    await triggerWorkflows("LEAD_STATUS_CHANGED", "LEAD", leadId, lead.assignedToId, { toStatus: targetStage.key });
  }
  revalidateLead(leadId);
}

export async function disqualifyLead(
  leadId: string,
  input: { reason: string; note?: string; actorId: string }
) {
  const existing = await prisma.lead.findUniqueOrThrow({ where: { id: leadId }, select: { assignedToId: true, pipelineStageId: true } });
  const profile = await getPermissionProfile(input.actorId);
  assertCanWrite(profile);
  await assertCanAccessRecord(profile, existing.assignedToId);

  const targetStage = await getStageIdByKey("LEAD_NURTURE", "UNQUALIFIED");

  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: targetStage.key as never,
      pipelineStageId: targetStage.id,
      qualificationStatus: "UNQUALIFIED",
      lostReason: input.reason as never,
      lostReasonNote: input.note || null,
      disqualifiedAt: new Date(),
    },
    select: { assignedToId: true },
  });

  await prisma.leadStageHistory.create({
    data: { leadId, fromStageId: existing.pipelineStageId, toStageId: targetStage.id, changedById: input.actorId },
  });

  if (lead.assignedToId) {
    await triggerWorkflows("LEAD_STATUS_CHANGED", "LEAD", leadId, lead.assignedToId, { toStatus: targetStage.key, lostReason: input.reason });
  }
  revalidateLead(leadId);
}

// Real Opportunities entry gate (docs/real-opportunities-spec.md §1): a Qualified lead that
// has also proven sustained, real engagement — not just a good score on paper. Throws with a
// human-readable reason when the gate isn't met so the UI can surface exactly what's missing.
export async function markRealOpportunity(
  leadId: string,
  input: { suspectedPersona?: string; suspectedPersonaNote?: string; actorId: string }
) {
  const lead = await prisma.lead.findUniqueOrThrow({
    where: { id: leadId },
    select: {
      qualificationStatus: true,
      assignedToId: true,
      pipelineStageId: true,
      activities: { select: { type: true, occurredAt: true }, orderBy: { occurredAt: "desc" } },
      bantScores: { select: { authorityScore: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const profile = await getPermissionProfile(input.actorId);
  assertCanWrite(profile);
  await assertCanAccessRecord(profile, lead.assignedToId);

  if (lead.qualificationStatus !== "QUALIFIED") {
    throw new Error("Lead must be BANT-Qualified before it can be marked a Real Opportunity.");
  }

  const engagementActivities = lead.activities.filter((a) => a.type === "CALL" || a.type === "MEETING" || a.type === "SITE_VISIT");
  if (engagementActivities.length < 2) {
    throw new Error("Needs at least 2 logged calls, meetings, or site visits — not just notes/emails.");
  }

  const authorityScore = lead.bantScores[0]?.authorityScore ?? 0;
  if (authorityScore < 5) {
    throw new Error("BANT Authority score must be at least 5/10 — confirm who the decision-maker is first.");
  }

  const mostRecent = lead.activities[0]?.occurredAt;
  const daysSinceLastActivity = mostRecent ? (Date.now() - mostRecent.getTime()) / 86400000 : Infinity;
  if (daysSinceLastActivity > 14) {
    throw new Error("No activity logged in the last 14 days — re-engage before marking this a Real Opportunity.");
  }

  const targetStage = await getStageIdByKey("LEAD_NURTURE", "REAL_OPPORTUNITY");

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: targetStage.key as never,
      pipelineStageId: targetStage.id,
      realOpportunityAt: new Date(),
      suspectedPersona: input.suspectedPersona || null,
      suspectedPersonaNote: input.suspectedPersonaNote || null,
    },
  });

  await prisma.leadStageHistory.create({
    data: { leadId, fromStageId: lead.pipelineStageId, toStageId: targetStage.id, changedById: input.actorId },
  });

  // Bridge to Marketing (docs/real-opportunities-spec.md §3 / marketing-spec.md) — append-only,
  // Sales writes once per capture, Marketing only ever reads it via LeadPersonaSignal.
  if (input.suspectedPersona) {
    await prisma.leadPersonaSignal.create({
      data: { leadId, suspectedPersona: input.suspectedPersona, note: input.suspectedPersonaNote || null },
    });
  }

  if (lead.assignedToId) {
    await awardPoints(lead.assignedToId, SALES_POINTS.REAL_OPPORTUNITY, "Marked Real Opportunity", "REAL_OPPORTUNITY");
    await triggerWorkflows("LEAD_STATUS_CHANGED", "LEAD", leadId, lead.assignedToId, { toStatus: targetStage.key });
  }

  revalidateLead(leadId);
}

export async function markReferralRewarded(leadId: string, actorId: string) {
  const existing = await prisma.lead.findUniqueOrThrow({ where: { id: leadId }, select: { assignedToId: true } });
  const profile = await getPermissionProfile(actorId);
  assertCanWrite(profile);
  await assertCanAccessRecord(profile, existing.assignedToId);

  await prisma.lead.update({ where: { id: leadId }, data: { referralRewardStatus: "REWARDED" } });
  revalidateLead(leadId);
}

export async function assignLead(leadId: string, userId: string, actorId: string) {
  const existing = await prisma.lead.findUniqueOrThrow({ where: { id: leadId }, select: { assignedToId: true } });
  const profile = await getPermissionProfile(actorId);
  assertCanWrite(profile);
  await assertCanAccessRecord(profile, existing.assignedToId);

  await prisma.lead.update({ where: { id: leadId }, data: { assignedToId: userId } });
  revalidateLead(leadId);

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      customerId: true,
      customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
      source: { select: { name: true } },
      propertyType: { select: { name: true } },
    },
  });
  if (lead) {
    await triggerWorkflows("LEAD_ASSIGNED", "LEAD", leadId, userId, {
      customerId: lead.customerId,
      consultantId: userId,
      LeadName: `${lead.customer.firstName} ${lead.customer.lastName}`,
      LeadEmail: lead.customer.email,
      LeadPhone: lead.customer.phone,
      LeadSource: lead.source.name,
      PropertyInterest: lead.propertyType?.name,
    });
  }
}

// Bulk reassignment is already gated to managers in the UI (canBulkAssign) rather than per-lead
// ownership — a manager reassigning 30 leads at once may legitimately touch leads across many
// reps, so this checks write access, not per-record ownership of every lead in the batch.
export async function assignLeadsBulk(leadIds: string[], userId: string, actorId: string) {
  const profile = await getPermissionProfile(actorId);
  assertCanWrite(profile);
  if (profile.dataScope !== "ALL" && profile.dataScope !== "SYSTEM" && profile.dataScope !== "TEAM" && profile.dataScope !== "DEPARTMENT") {
    throw new Error("Bulk reassignment requires team, department, or organization-wide access.");
  }

  await prisma.lead.updateMany({ where: { id: { in: leadIds } }, data: { assignedToId: userId } });
  revalidatePath("/leads");
  revalidatePath("/leads/analytics");
}

export async function createLeadTask(
  leadId: string,
  input: { title: string; description?: string; dueDate?: string; priority: string; assignedToId: string; actorId: string }
) {
  const existing = await prisma.lead.findUniqueOrThrow({ where: { id: leadId }, select: { assignedToId: true } });
  const profile = await getPermissionProfile(input.actorId);
  assertCanWrite(profile);
  await assertCanAccessRecord(profile, existing.assignedToId);

  await prisma.task.create({
    data: {
      relatedEntityType: "LEAD",
      relatedEntityId: leadId,
      title: input.title,
      description: input.description || null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      priority: input.priority as never,
      assignedToId: input.assignedToId,
    },
  });
  revalidateLead(leadId);
}

export async function logLeadActivity(
  leadId: string,
  input: { type: string; description?: string; occurredAt?: string; createdById: string }
) {
  const existing = await prisma.lead.findUniqueOrThrow({ where: { id: leadId }, select: { assignedToId: true } });
  const profile = await getPermissionProfile(input.createdById);
  assertCanWrite(profile);
  await assertCanAccessRecord(profile, existing.assignedToId);

  await prisma.leadActivity.create({
    data: {
      leadId,
      type: input.type as never,
      description: input.description || null,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
      createdById: input.createdById,
    },
  });

  // Logging real contact on a brand-new lead is the natural "first contact" signal.
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { status: true, pipelineStageId: true } });
  if (lead?.status === "NEW" && input.type !== "NOTE") {
    const targetStage = await getStageIdByKey("LEAD_NURTURE", "CONTACTED");
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: targetStage.key as never, pipelineStageId: targetStage.id },
    });
    await prisma.leadStageHistory.create({
      data: { leadId, fromStageId: lead.pipelineStageId, toStageId: targetStage.id, changedById: input.createdById },
    });
    await triggerWorkflows("LEAD_STATUS_CHANGED", "LEAD", leadId, input.createdById, { toStatus: targetStage.key });
  }

  if (input.type === "SITE_VISIT") {
    await awardPoints(input.createdById, SALES_POINTS.SITE_VISIT_LOGGED, "Site visit logged", "SITE_VISIT");
  }

  revalidateLead(leadId);
}

export async function convertLead(
  leadId: string,
  input: { unitId?: string; expectedValue: number; currency: string; ownerId: string }
) {
  const lead = await prisma.lead.findUniqueOrThrow({
    where: { id: leadId },
    select: { customerId: true, assignedToId: true, pipelineStageId: true },
  });

  // The converting rep becomes the new Opportunity's owner (input.ownerId) — the same person
  // acting on the Lead, so that doubles as the actor for the permission check.
  const profile = await getPermissionProfile(input.ownerId);
  assertCanWrite(profile);
  await assertCanAccessRecord(profile, lead.assignedToId);

  // Resolve both target stages before entering the transaction — no I/O inside $transaction.
  const targetOppStage = await getStageIdByKey("SALES_OPPORTUNITY", "QUALIFIED");
  const targetLeadStage = await getStageIdByKey("LEAD_NURTURE", "CONVERTED");

  const [opportunity] = await prisma.$transaction([
    prisma.opportunity.create({
      data: {
        leadId,
        customerId: lead.customerId,
        unitId: input.unitId || null,
        expectedValue: input.expectedValue,
        currency: input.currency,
        stage: targetOppStage.key as never,
        pipelineStageId: targetOppStage.id,
        probability: 25,
        ownerId: input.ownerId,
      },
    }),
    prisma.lead.update({
      where: { id: leadId },
      data: {
        status: targetLeadStage.key as never,
        pipelineStageId: targetLeadStage.id,
        qualificationStatus: "QUALIFIED",
        qualifiedAt: new Date(),
      },
    }),
    prisma.leadStageHistory.create({
      data: { leadId, fromStageId: lead.pipelineStageId, toStageId: targetLeadStage.id, changedById: input.ownerId },
    }),
  ]);

  await triggerWorkflows("LEAD_STATUS_CHANGED", "LEAD", leadId, input.ownerId, { toStatus: targetLeadStage.key });
  await triggerWorkflows("OPPORTUNITY_CREATED", "OPPORTUNITY", opportunity.id, input.ownerId, { stage: targetOppStage.key, expectedValue: input.expectedValue });

  revalidateLead(leadId);
}

export async function addLeadNote(leadId: string, input: { note: string; createdById: string }) {
  await logLeadActivity(leadId, { type: "NOTE", description: input.note, createdById: input.createdById });
}

// BANT-Plus scoring (Devtraco_Sales_Playbook_v1.0.docx §2.1): four pillars entered by the agent —
// Budget, Authority, Need, Timeline — each 0-10. Fit is not a fifth manual entry: it's the
// automatic average of those four, since "does this buyer fit the profile" is really a
// derivative signal from how they scored elsewhere, not an independent pillar an agent should
// have to guess at from scratch. An agent can still override the computed Fit when they have
// real signal the four pillars don't capture (an existing buyer/customer, a referral, personal
// knowledge of the buyer, or a persona-based factor) — the override and its reason are recorded
// in BantScore.agentAdjustments so the auto value is never silently lost.
export async function scoreLead(
  leadId: string,
  input: {
    budgetScore: number;
    authorityScore: number;
    needScore: number;
    timelineScore: number;
    fitOverride?: number;
    fitAdjustmentReason?: string;
    notes?: string;
    userId: string;
  }
) {
  const existing = await prisma.lead.findUniqueOrThrow({ where: { id: leadId }, select: { assignedToId: true } });
  const profile = await getPermissionProfile(input.userId);
  assertCanWrite(profile);
  await assertCanAccessRecord(profile, existing.assignedToId);

  const autoFitScore = Math.round((input.budgetScore + input.authorityScore + input.needScore + input.timelineScore) / 4);
  const fitScore =
    input.fitOverride !== undefined ? Math.max(0, Math.min(10, Math.round(input.fitOverride))) : autoFitScore;
  const totalScore = Math.round(
    (input.budgetScore + input.authorityScore + input.needScore + input.timelineScore + fitScore) / 5
  );
  const qualificationStatus = totalScore >= 7 ? "QUALIFIED" : totalScore >= 4 ? "REVIEW" : "UNQUALIFIED";

  await prisma.bantScore.create({
    data: {
      leadId,
      userId: input.userId,
      budgetScore: input.budgetScore,
      authorityScore: input.authorityScore,
      needScore: input.needScore,
      timelineScore: input.timelineScore,
      fitScore,
      totalScore,
      status: qualificationStatus,
      notes: input.notes || null,
      agentAdjustments: input.fitAdjustmentReason
        ? { fit: { auto: autoFitScore, final: fitScore, reason: input.fitAdjustmentReason } }
        : undefined,
    },
  });

  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { status: true, pipelineStageId: true } });
  // Preserves a pre-existing inconsistency vs. logLeadActivity's equivalent auto-transition:
  // this implicit NEW->CONTACTED transition does not fire a workflow trigger.
  const targetStage = lead?.status === "NEW" ? await getStageIdByKey("LEAD_NURTURE", "CONTACTED") : null;

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      bantScore: totalScore,
      qualificationStatus,
      status: targetStage ? (targetStage.key as never) : undefined,
      pipelineStageId: targetStage ? targetStage.id : undefined,
    },
  });

  if (targetStage) {
    await prisma.leadStageHistory.create({
      data: { leadId, fromStageId: lead!.pipelineStageId, toStageId: targetStage.id, changedById: input.userId },
    });
  }

  revalidateLead(leadId);
}
