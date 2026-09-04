"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { segmentCriteriaToWhere, matchesBirthdayCriteria, type SegmentCriteria } from "@/lib/queries/marketing";
import { logAudit } from "@/lib/audit";

function revalidateMarketing() {
  revalidatePath("/marketing");
}

// ---- Personas ----

export async function createMarketingPersona(input: { name: string; description?: string; suggestedChannels?: string }) {
  await prisma.marketingPersona.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      suggestedChannels: input.suggestedChannels?.trim() || null,
    },
  });
  revalidateMarketing();
}

// ---- Segments ----

// Evaluates `criteria` against Customer and replaces the segment's membership list — same
// "clear then re-add" refresh pattern as the reference spec's SegmentationService, just
// synchronous (no scheduler/cron in this app) and triggered on create/edit/manual refresh.
async function recomputeMarketingSegment(segmentId: string, criteria: SegmentCriteria) {
  const candidates = await prisma.customer.findMany({
    where: segmentCriteriaToWhere(criteria),
    select: { id: true, dateOfBirth: true },
  });
  const matches = candidates.filter((c) => matchesBirthdayCriteria(c.dateOfBirth, criteria.birthdayWithinDays));

  await prisma.$transaction([
    prisma.marketingSegmentMember.deleteMany({ where: { segmentId, manuallyAdded: false } }),
    ...matches.map((c) =>
      prisma.marketingSegmentMember.upsert({
        where: { segmentId_customerId: { segmentId, customerId: c.id } },
        create: { segmentId, customerId: c.id },
        update: {},
      })
    ),
  ]);

  const memberCount = await prisma.marketingSegmentMember.count({ where: { segmentId } });
  await prisma.marketingSegment.update({
    where: { id: segmentId },
    data: { memberCount, lastComputedAt: new Date() },
  });
}

export async function createMarketingSegment(input: {
  name: string;
  description?: string;
  criteria: SegmentCriteria;
  createdById: string;
  isDynamic?: boolean;
  channel?: string;
}) {
  const isDynamic = input.isDynamic ?? true;
  const segment = await prisma.marketingSegment.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      criteria: isDynamic ? input.criteria : {},
      isDynamic,
      channel: input.channel ? (input.channel as never) : null,
      createdById: input.createdById,
    },
  });
  // Manual lists start empty — members are hand-picked afterward via addCustomerToSegment,
  // not computed from criteria.
  if (isDynamic) {
    await recomputeMarketingSegment(segment.id, input.criteria);
  }
  await logAudit(input.createdById, "CREATE", "MarketingSegment", segment.id, { name: segment.name, isDynamic, channel: input.channel, criteria: input.criteria } as Prisma.InputJsonValue);
  revalidateMarketing();
  return { segmentId: segment.id };
}

export async function refreshMarketingSegment(segmentId: string) {
  const segment = await prisma.marketingSegment.findUniqueOrThrow({ where: { id: segmentId } });
  // Manual lists have no criteria to recompute from — refreshing would otherwise re-run
  // recomputeMarketingSegment with empty criteria, which matches every customer.
  if (!segment.isDynamic) return;
  await recomputeMarketingSegment(segmentId, segment.criteria as SegmentCriteria);
  revalidateMarketing();
  revalidatePath(`/marketing/segments/${segmentId}`);
}

export async function addCustomerToSegment(segmentId: string, customerId: string) {
  await prisma.marketingSegmentMember.upsert({
    where: { segmentId_customerId: { segmentId, customerId } },
    create: { segmentId, customerId, manuallyAdded: true },
    update: { manuallyAdded: true },
  });
  const memberCount = await prisma.marketingSegmentMember.count({ where: { segmentId } });
  await prisma.marketingSegment.update({ where: { id: segmentId }, data: { memberCount } });
  revalidatePath(`/marketing/segments/${segmentId}`);
}

export async function removeCustomerFromSegment(segmentId: string, customerId: string) {
  await prisma.marketingSegmentMember.deleteMany({ where: { segmentId, customerId } });
  const memberCount = await prisma.marketingSegmentMember.count({ where: { segmentId } });
  await prisma.marketingSegment.update({ where: { id: segmentId }, data: { memberCount } });
  revalidatePath(`/marketing/segments/${segmentId}`);
}

// ---- Templates ----

export async function createMessageTemplate(input: {
  name: string;
  channel: string;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
}) {
  await prisma.messageTemplate.create({
    data: {
      name: input.name.trim(),
      channel: input.channel as never,
      subject: input.subject?.trim() || null,
      bodyHtml: input.bodyHtml?.trim() || null,
      bodyText: input.bodyText?.trim() || null,
    },
  });
  revalidateMarketing();
}

export async function updateMessageTemplate(
  id: string,
  input: { name: string; channel: string; subject?: string; bodyHtml?: string; bodyText?: string }
) {
  await prisma.messageTemplate.update({
    where: { id },
    data: {
      name: input.name.trim(),
      channel: input.channel as never,
      subject: input.subject?.trim() || null,
      bodyHtml: input.bodyHtml?.trim() || null,
      bodyText: input.bodyText?.trim() || null,
    },
  });
  revalidateMarketing();
}

// Mailchimp-style "Replicate" — the fastest way to reuse a template is to start from a copy
// rather than rebuild it, since campaigns reference a template by id and editing in place would
// change the content of every campaign that already used it.
export async function duplicateMessageTemplate(id: string) {
  const original = await prisma.messageTemplate.findUniqueOrThrow({ where: { id } });
  const copy = await prisma.messageTemplate.create({
    data: {
      name: `Copy of ${original.name}`,
      channel: original.channel,
      subject: original.subject,
      bodyHtml: original.bodyHtml,
      bodyText: original.bodyText,
      variables: original.variables ?? undefined,
    },
  });
  revalidateMarketing();
  return { templateId: copy.id };
}

export async function deleteMessageTemplate(id: string) {
  await prisma.messageTemplate.delete({ where: { id } });
  revalidateMarketing();
}

// ---- Campaigns ----

export async function createMarketingCampaign(input: {
  name: string;
  channel: string;
  segmentId?: string;
  personaId?: string;
  templateId?: string;
  objective?: string;
  budget?: number;
  currency?: string;
  createdById: string;
}) {
  const campaign = await prisma.marketingCampaign.create({
    data: {
      name: input.name.trim(),
      channel: input.channel as never,
      segmentId: input.segmentId || null,
      personaId: input.personaId || null,
      templateId: input.templateId || null,
      objective: input.objective?.trim() || null,
      budget: input.budget,
      currency: input.currency || "USD",
      createdById: input.createdById,
    },
  });
  await logAudit(input.createdById, "CREATE", "MarketingCampaign", campaign.id, { name: campaign.name, channel: campaign.channel });
  revalidateMarketing();
  return { campaignId: campaign.id };
}

// Mailchimp's "Replicate campaign" — clone a past campaign's targeting/content as a fresh DRAFT
// rather than rebuilding it, since the settings that make a campaign reusable (segment, persona,
// template, objective, budget) are exactly what's copied here.
export async function duplicateMarketingCampaign(id: string, createdById: string) {
  const original = await prisma.marketingCampaign.findUniqueOrThrow({ where: { id } });
  const copy = await prisma.marketingCampaign.create({
    data: {
      name: `Copy of ${original.name}`,
      personaId: original.personaId,
      segmentId: original.segmentId,
      templateId: original.templateId,
      channel: original.channel,
      objective: original.objective,
      budget: original.budget,
      currency: original.currency,
      status: "DRAFT",
      createdById,
    },
  });
  await logAudit(createdById, "CREATE", "MarketingCampaign", copy.id, { name: copy.name, replicatedFrom: id });
  revalidateMarketing();
  return { campaignId: copy.id };
}

const OPT_OUT_FIELD = { EMAIL: "optOutEmail", SMS: "optOutSms", WHATSAPP: "optOutWhatsapp" } as const;

// Simulated send (no ESP/SMS/WhatsApp provider configured) — same pattern as the simulated
// lead-acknowledgment email and Reservation Form doc generation elsewhere in this app. Sends
// to every current segment member not opted out of the campaign's channel; safe to re-run
// (e.g. after the segment grows) since it always reflects current membership.
export async function sendMarketingCampaign(campaignId: string, actorId: string) {
  const campaign = await prisma.marketingCampaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: { segment: { include: { members: { include: { customer: true } } } }, template: true },
  });

  if (!campaign.segment) {
    throw new Error("Campaign has no target segment — assign one before sending.");
  }

  const optOutField = OPT_OUT_FIELD[campaign.channel];
  const eligible = campaign.segment.members.filter((m) => !m.customer[optOutField]);
  if (eligible.length === 0) {
    throw new Error("No eligible recipients — everyone in this segment has opted out of this channel.");
  }

  const subject = campaign.template?.subject || campaign.objective || campaign.name;
  const body = `${campaign.template?.bodyText || campaign.template?.bodyHtml || campaign.objective || campaign.name} (simulated — no ${campaign.channel.toLowerCase()} provider configured).`;
  const now = new Date();

  await prisma.$transaction([
    ...eligible.map((m) =>
      prisma.marketingMessage.create({
        data: {
          customerId: m.customerId,
          campaignId: campaign.id,
          channel: campaign.channel,
          templateId: campaign.templateId,
          subject,
          body,
          status: "SENT",
          sentAt: now,
        },
      })
    ),
    ...eligible.map((m) =>
      prisma.engagementEvent.create({
        data: { customerId: m.customerId, eventType: "CAMPAIGN_SENT", channel: campaign.channel, source: campaign.name },
      })
    ),
    prisma.customer.updateMany({
      where: { id: { in: eligible.map((m) => m.customerId) } },
      data: { lastMarketingContactAt: now },
    }),
    prisma.marketingCampaign.update({
      where: { id: campaign.id },
      data: { status: campaign.status === "DRAFT" ? "ACTIVE" : campaign.status },
    }),
  ]);

  await logAudit(actorId, "SEND", "MarketingCampaign", campaign.id, { channel: campaign.channel, recipientCount: eligible.length });

  revalidateMarketing();
  revalidatePath(`/marketing/campaigns/${campaignId}`);
  return { sentCount: eligible.length };
}

// ---- Journeys ----

export async function createMarketingJourney(input: {
  name: string;
  description?: string;
  segmentId?: string;
  createdById: string;
  steps: { name: string; actionType: string; actionConfig: Record<string, unknown>; waitHours?: number }[];
}) {
  if (input.steps.length === 0) {
    throw new Error("A journey needs at least one step.");
  }
  const journey = await prisma.marketingJourney.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      segmentId: input.segmentId || null,
      createdById: input.createdById,
      steps: {
        create: input.steps.map((s, i) => ({
          stepOrder: i + 1,
          name: s.name,
          actionType: s.actionType as never,
          actionConfig: s.actionConfig as Prisma.InputJsonValue,
          waitHours: s.waitHours,
        })),
      },
    },
  });
  await logAudit(input.createdById, "CREATE", "MarketingJourney", journey.id, { name: journey.name, stepCount: input.steps.length });
  revalidateMarketing();
  return { journeyId: journey.id };
}

type JourneyStepForExec = {
  id: string;
  actionType: string;
  actionConfig: unknown;
  name: string;
};

// Executes one step's action against one customer. There's no background scheduler in this
// app, so steps run synchronously the moment enrollment/advancement calls them — `waitHours`
// on WAIT steps is recorded for display only, not enforced by a live clock.
async function executeJourneyStep(
  step: JourneyStepForExec,
  customerId: string,
  journeyId: string,
  journeyName: string,
  actorId: string
) {
  const config = (step.actionConfig ?? {}) as Record<string, string | undefined>;

  if (step.actionType === "SEND_EMAIL" || step.actionType === "SEND_SMS" || step.actionType === "SEND_WHATSAPP") {
    const channel = step.actionType === "SEND_EMAIL" ? "EMAIL" : step.actionType === "SEND_SMS" ? "SMS" : "WHATSAPP";
    const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    if (customer[OPT_OUT_FIELD[channel as keyof typeof OPT_OUT_FIELD]]) return;

    await prisma.marketingMessage.create({
      data: {
        customerId,
        journeyId,
        channel: channel as never,
        subject: config.subject || journeyName,
        body: `${config.body || step.name} (simulated — no ${channel.toLowerCase()} provider configured).`,
        status: "SENT",
        sentAt: new Date(),
      },
    });
    await prisma.engagementEvent.create({
      data: { customerId, eventType: "CAMPAIGN_SENT", channel, source: journeyName },
    });
    await prisma.customer.update({ where: { id: customerId }, data: { lastMarketingContactAt: new Date() } });
    return;
  }

  if (step.actionType === "ADD_TO_SEGMENT" && config.segmentId) {
    await addCustomerToSegment(config.segmentId, customerId);
    return;
  }

  if (step.actionType === "REMOVE_FROM_SEGMENT" && config.segmentId) {
    await removeCustomerFromSegment(config.segmentId, customerId);
    return;
  }

  if (step.actionType === "CREATE_TASK") {
    await prisma.task.create({
      data: {
        relatedEntityType: "CUSTOMER",
        relatedEntityId: customerId,
        title: config.title || step.name,
        description: config.description || `Journey step "${step.name}" (${journeyName})`,
        assignedToId: actorId,
        priority: "MEDIUM",
      },
    });
    return;
  }

  // WAIT: no-op — the pointer advance itself is the only effect.
}

export async function enrollSegmentInJourney(journeyId: string, actorId: string) {
  const journey = await prisma.marketingJourney.findUniqueOrThrow({
    where: { id: journeyId },
    include: { steps: { orderBy: { stepOrder: "asc" } }, segment: { include: { members: true } } },
  });
  if (!journey.segment) throw new Error("Journey has no target segment — assign one before enrolling.");
  if (journey.steps.length === 0) throw new Error("Journey has no steps.");

  const firstStep = journey.steps[0];
  const existing = await prisma.customerJourney.findMany({
    where: { journeyId, status: "ACTIVE", customerId: { in: journey.segment.members.map((m) => m.customerId) } },
    select: { customerId: true },
  });
  const alreadyEnrolled = new Set(existing.map((e) => e.customerId));
  const toEnroll = journey.segment.members.filter((m) => !alreadyEnrolled.has(m.customerId));

  for (const member of toEnroll) {
    await prisma.customerJourney.create({
      data: { customerId: member.customerId, journeyId, currentStepId: firstStep.id },
    });
    await executeJourneyStep(firstStep, member.customerId, journeyId, journey.name, actorId);
  }

  if (journey.status === "DRAFT") {
    await prisma.marketingJourney.update({ where: { id: journeyId }, data: { status: "ACTIVE" } });
  }

  await logAudit(actorId, "ENROLL", "MarketingJourney", journeyId, { enrolledCount: toEnroll.length });

  revalidateMarketing();
  revalidatePath(`/marketing/journeys/${journeyId}`);
  return { enrolledCount: toEnroll.length };
}

export async function advanceCustomerJourney(customerJourneyId: string, actorId: string) {
  const cj = await prisma.customerJourney.findUniqueOrThrow({
    where: { id: customerJourneyId },
    include: {
      journey: { include: { steps: { orderBy: { stepOrder: "asc" } } } },
      currentStep: true,
    },
  });

  const currentOrder = cj.currentStep?.stepOrder ?? 0;
  const nextStep = cj.journey.steps.find((s) => s.stepOrder === currentOrder + 1);

  if (!nextStep) {
    await prisma.customerJourney.update({
      where: { id: customerJourneyId },
      data: { status: "COMPLETED", lastActivityAt: new Date() },
    });
  } else {
    await executeJourneyStep(nextStep, cj.customerId, cj.journeyId, cj.journey.name, actorId);
    await prisma.customerJourney.update({
      where: { id: customerJourneyId },
      data: { currentStepId: nextStep.id, lastActivityAt: new Date() },
    });
  }

  await logAudit(actorId, "ADVANCE", "CustomerJourney", customerJourneyId, { toStepOrder: nextStep?.stepOrder ?? null });

  revalidatePath(`/marketing/journeys/${cj.journeyId}`);
}

// ---- Customer 360 marketing panel ----

export async function updateCustomerMarketingPrefs(
  customerId: string,
  actorId: string,
  input: { sentiment?: string; optOutEmail?: boolean; optOutSms?: boolean; optOutWhatsapp?: boolean }
) {
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      sentiment: input.sentiment as never,
      optOutEmail: input.optOutEmail,
      optOutSms: input.optOutSms,
      optOutWhatsapp: input.optOutWhatsapp,
    },
  });

  // Consent trail (Master Technical Specification §23) — stamped every time staff records this
  // customer's channel preferences, since that's the only consent-capture flow this app has
  // (no public web-form consent widget).
  await prisma.customerPreference.upsert({
    where: { customerId },
    create: { customerId, marketingConsentAt: new Date(), marketingConsentSource: "Staff-recorded via Customer 360" },
    update: { marketingConsentAt: new Date(), marketingConsentSource: "Staff-recorded via Customer 360" },
  });

  await logAudit(actorId, "UPDATE", "Customer", customerId, input as Prisma.InputJsonValue);
  revalidatePath(`/customers/${customerId}`);
}

// ---- Omnichannel view ----

// One-off simulated send to a single customer, outside any campaign/journey — the "Quick
// Actions: Send Email/SMS" flow from the Omnichannel design. Respects the same per-channel
// opt-outs as campaign sends.
export async function sendDirectMessage(
  customerId: string,
  actorId: string,
  input: { channel: "EMAIL" | "SMS" | "WHATSAPP"; subject?: string; body: string }
) {
  const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });

  const optOutField = { EMAIL: "optOutEmail", SMS: "optOutSms", WHATSAPP: "optOutWhatsapp" } as const;
  if (customer[optOutField[input.channel]]) {
    throw new Error(`This customer has opted out of ${input.channel}.`);
  }
  if (input.channel === "EMAIL" && !customer.email) throw new Error("This customer has no email on file.");
  if ((input.channel === "SMS" || input.channel === "WHATSAPP") && !customer.phone) {
    throw new Error("This customer has no phone number on file.");
  }

  await prisma.marketingMessage.create({
    data: {
      customerId,
      channel: input.channel,
      subject: input.subject || null,
      body: `${input.body} (simulated — no ${input.channel.toLowerCase()} provider configured).`,
      status: "SENT",
      sentAt: new Date(),
    },
  });
  await prisma.engagementEvent.create({
    data: { customerId, eventType: "DIRECT_MESSAGE_SENT", channel: input.channel, source: "Omnichannel quick action" },
  });
  await prisma.customer.update({ where: { id: customerId }, data: { lastMarketingContactAt: new Date() } });
  await logAudit(actorId, "SEND", "MarketingMessage", customerId, { channel: input.channel });

  revalidatePath(`/customers/${customerId}`);
  revalidatePath(`/customers/${customerId}/channels`);
}

// Logs a Phone call or In-Person meeting against a customer via the existing generic
// Interaction model — no new table needed, matches how Reservation Form generation already
// logs a NOTE-type Interaction against an Opportunity.
export async function logCustomerInteraction(
  customerId: string,
  input: { type: "CALL" | "MEETING" | "NOTE"; subject?: string; notes?: string; actorId: string }
) {
  await prisma.interaction.create({
    data: {
      type: input.type,
      subject: input.subject || (input.type === "CALL" ? "Phone call" : input.type === "MEETING" ? "In-person meeting" : "Note"),
      notes: input.notes || null,
      userId: input.actorId,
      relatedEntityType: "CUSTOMER",
      relatedEntityId: customerId,
    },
  });
  await prisma.customer.update({ where: { id: customerId }, data: { lastMarketingContactAt: new Date() } });

  revalidatePath(`/customers/${customerId}`);
  revalidatePath(`/customers/${customerId}/channels`);
}
