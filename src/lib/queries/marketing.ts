import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// The shape of MarketingSegment.criteria (stored as Json). Kept intentionally small — this is
// a simple structured filter, not a full rules engine (see docs/marketing-spec.md §8, adapted).
export type SegmentCriteria = {
  buyerSegment?: string;
  kycStatus?: string;
  sentiment?: string;
  minEngagementScore?: number;
  createdAfter?: string;
  // Real estate's equivalent of "abandoned cart" — a unit reservation made but not yet
  // converted to a Sale. hasActiveReservation is the broad net; reservationExpiringWithinDays
  // narrows it to reservations about to lapse, matching the urgency window the dashboard's
  // "Reservation expiring soon" alert already uses.
  hasActiveReservation?: boolean;
  reservationExpiringWithinDays?: number;
  // Month/day match ignoring year (a birthday), evaluated in JS post-filter below — Prisma's
  // typed query API can't express "day-of-year within N days" portably across databases.
  birthdayWithinDays?: number;
};

export function segmentCriteriaToWhere(criteria: SegmentCriteria): Prisma.CustomerWhereInput {
  const where: Prisma.CustomerWhereInput = { deletedAt: null };
  if (criteria.buyerSegment) where.segment = criteria.buyerSegment as never;
  if (criteria.kycStatus) where.kycStatus = criteria.kycStatus as never;
  if (criteria.sentiment) where.sentiment = criteria.sentiment as never;
  if (criteria.minEngagementScore !== undefined) {
    where.engagementScore = { gte: criteria.minEngagementScore };
  }
  if (criteria.createdAfter) {
    where.createdAt = { gte: new Date(criteria.createdAfter) };
  }
  if (criteria.reservationExpiringWithinDays !== undefined) {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + criteria.reservationExpiringWithinDays * 86400000);
    where.reservations = { some: { status: "ACTIVE", expiryDate: { gte: now, lte: windowEnd } } };
  } else if (criteria.hasActiveReservation) {
    where.reservations = { some: { status: "ACTIVE" } };
  }
  if (criteria.birthdayWithinDays !== undefined) {
    where.dateOfBirth = { not: null };
  }
  return where;
}

// Post-filter applied after the Prisma query for criteria that can't be expressed as a
// portable `where` clause — currently just birthdayWithinDays (month/day match ignoring year).
export function matchesBirthdayCriteria(dateOfBirth: Date | null, birthdayWithinDays: number | undefined): boolean {
  if (birthdayWithinDays === undefined) return true;
  if (!dateOfBirth) return false;

  const now = new Date();
  const thisYearBirthday = new Date(now.getFullYear(), dateOfBirth.getMonth(), dateOfBirth.getDate());
  const nextYearBirthday = new Date(now.getFullYear() + 1, dateOfBirth.getMonth(), dateOfBirth.getDate());
  const upcoming = thisYearBirthday >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) ? thisYearBirthday : nextYearBirthday;
  const daysUntil = Math.round((upcoming.getTime() - now.getTime()) / 86400000);
  return daysUntil <= birthdayWithinDays;
}

export async function getMarketingPersonas() {
  const personas = await prisma.marketingPersona.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { campaigns: true, personaSignals: true } } },
  });
  return personas.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    suggestedChannels: p.suggestedChannels,
    campaignCount: p._count.campaigns,
    signalCount: p._count.personaSignals,
    createdAt: p.createdAt,
  }));
}

export async function getMarketingSegments() {
  const segments = await prisma.marketingSegment.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { firstName: true, lastName: true } } },
  });
  return segments.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    criteria: s.criteria as SegmentCriteria,
    isDynamic: s.isDynamic,
    channel: s.channel,
    memberCount: s.memberCount,
    lastComputedAt: s.lastComputedAt,
    createdBy: s.createdBy ? `${s.createdBy.firstName} ${s.createdBy.lastName}` : null,
    createdAt: s.createdAt,
  }));
}

export async function getMarketingSegmentDetail(id: string) {
  const segment = await prisma.marketingSegment.findUnique({
    where: { id },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      members: {
        orderBy: { addedAt: "desc" },
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true, segment: true, engagementScore: true, optOutEmail: true, optOutSms: true, optOutWhatsapp: true },
          },
        },
      },
      campaigns: { select: { id: true, name: true, status: true, channel: true }, orderBy: { createdAt: "desc" } },
      journeys: { select: { id: true, name: true, status: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!segment) return null;
  return {
    id: segment.id,
    name: segment.name,
    description: segment.description,
    criteria: segment.criteria as SegmentCriteria,
    isDynamic: segment.isDynamic,
    channel: segment.channel,
    memberCount: segment.memberCount,
    lastComputedAt: segment.lastComputedAt,
    createdBy: segment.createdBy ? `${segment.createdBy.firstName} ${segment.createdBy.lastName}` : null,
    createdAt: segment.createdAt,
    members: segment.members.map((m) => ({
      id: m.id,
      addedAt: m.addedAt,
      manuallyAdded: m.manuallyAdded,
      customer: {
        id: m.customer.id,
        name: `${m.customer.firstName} ${m.customer.lastName}`,
        email: m.customer.email,
        phone: m.customer.phone,
        segment: m.customer.segment,
        engagementScore: Number(m.customer.engagementScore),
        optOutEmail: m.customer.optOutEmail,
        optOutSms: m.customer.optOutSms,
        optOutWhatsapp: m.customer.optOutWhatsapp,
      },
    })),
    campaigns: segment.campaigns,
    journeys: segment.journeys,
  };
}

// Customer picker for manually building a list — excludes customers already in this segment.
export async function getCustomersForListPicker(segmentId: string) {
  const [customers, members] = await Promise.all([
    prisma.customer.findMany({
      where: { deletedAt: null },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      orderBy: { firstName: "asc" },
      take: 300,
    }),
    prisma.marketingSegmentMember.findMany({ where: { segmentId }, select: { customerId: true } }),
  ]);
  const memberIds = new Set(members.map((m) => m.customerId));
  return customers
    .filter((c) => !memberIds.has(c.id))
    .map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}`, email: c.email, phone: c.phone }));
}

export async function getMessageTemplates() {
  const templates = await prisma.messageTemplate.findMany({ orderBy: { createdAt: "desc" } });
  return templates;
}

export async function getMarketingCampaigns() {
  const campaigns = await prisma.marketingCampaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      segment: { select: { id: true, name: true, memberCount: true } },
      persona: { select: { id: true, name: true } },
      _count: { select: { messages: true } },
    },
  });
  return campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    channel: c.channel,
    status: c.status,
    objective: c.objective,
    budget: c.budget ? Number(c.budget) : null,
    currency: c.currency,
    startDate: c.startDate,
    endDate: c.endDate,
    segment: c.segment,
    persona: c.persona,
    messageCount: c._count.messages,
    createdAt: c.createdAt,
  }));
}

export async function getMarketingCampaignDetail(id: string) {
  const campaign = await prisma.marketingCampaign.findUnique({
    where: { id },
    include: {
      segment: { select: { id: true, name: true, memberCount: true } },
      persona: { select: { id: true, name: true } },
      template: { select: { id: true, name: true, subject: true, bodyText: true, bodyHtml: true } },
      createdBy: { select: { firstName: true, lastName: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { firstName: true, lastName: true } } },
      },
    },
  });
  if (!campaign) return null;

  const sent = campaign.messages.filter((m) => m.sentAt).length;
  const delivered = campaign.messages.filter((m) => m.deliveredAt).length;
  const opened = campaign.messages.filter((m) => m.openedAt).length;
  const clicked = campaign.messages.filter((m) => m.clickedAt).length;
  const replied = campaign.messages.filter((m) => m.repliedAt).length;

  return {
    id: campaign.id,
    name: campaign.name,
    channel: campaign.channel,
    status: campaign.status,
    objective: campaign.objective,
    budget: campaign.budget ? Number(campaign.budget) : null,
    currency: campaign.currency,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    segment: campaign.segment,
    persona: campaign.persona,
    template: campaign.template,
    createdBy: campaign.createdBy ? `${campaign.createdBy.firstName} ${campaign.createdBy.lastName}` : null,
    createdAt: campaign.createdAt,
    kpis: {
      sent,
      delivered,
      opened,
      clicked,
      replied,
      openRate: sent > 0 ? (opened / sent) * 100 : 0,
      clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
      replyRate: sent > 0 ? (replied / sent) * 100 : 0,
    },
    messages: campaign.messages.map((m) => ({
      id: m.id,
      customerName: `${m.customer.firstName} ${m.customer.lastName}`,
      status: m.status,
      subject: m.subject,
      sentAt: m.sentAt,
      openedAt: m.openedAt,
      clickedAt: m.clickedAt,
      repliedAt: m.repliedAt,
    })),
  };
}

export async function getMarketingJourneys() {
  const journeys = await prisma.marketingJourney.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      segment: { select: { id: true, name: true, memberCount: true } },
      _count: { select: { steps: true, customerJourneys: true } },
    },
  });
  return journeys.map((j) => ({
    id: j.id,
    name: j.name,
    description: j.description,
    status: j.status,
    segment: j.segment,
    stepCount: j._count.steps,
    enrolledCount: j._count.customerJourneys,
    createdAt: j.createdAt,
  }));
}

export async function getMarketingJourneyDetail(id: string) {
  const journey = await prisma.marketingJourney.findUnique({
    where: { id },
    include: {
      segment: { select: { id: true, name: true, memberCount: true } },
      steps: { orderBy: { stepOrder: "asc" } },
      customerJourneys: {
        orderBy: { enteredAt: "desc" },
        include: {
          customer: { select: { firstName: true, lastName: true } },
          currentStep: { select: { stepOrder: true, name: true } },
        },
      },
    },
  });
  if (!journey) return null;

  return {
    id: journey.id,
    name: journey.name,
    description: journey.description,
    status: journey.status,
    segment: journey.segment,
    createdAt: journey.createdAt,
    steps: journey.steps.map((s) => ({
      id: s.id,
      stepOrder: s.stepOrder,
      name: s.name,
      actionType: s.actionType,
      actionConfig: s.actionConfig as Record<string, unknown>,
      waitHours: s.waitHours,
    })),
    customerJourneys: journey.customerJourneys.map((cj) => ({
      id: cj.id,
      customerName: `${cj.customer.firstName} ${cj.customer.lastName}`,
      status: cj.status,
      currentStepOrder: cj.currentStep?.stepOrder ?? null,
      currentStepName: cj.currentStep?.name ?? null,
      enteredAt: cj.enteredAt,
      lastActivityAt: cj.lastActivityAt,
    })),
  };
}

export async function getMarketingOverview() {
  const [segmentCount, campaignCount, journeyCount, messageCount, recentEvents] = await Promise.all([
    prisma.marketingSegment.count(),
    prisma.marketingCampaign.count(),
    prisma.marketingJourney.count(),
    prisma.marketingMessage.count(),
    prisma.engagementEvent.findMany({
      orderBy: { occurredAt: "desc" },
      take: 8,
      include: { customer: { select: { firstName: true, lastName: true } } },
    }),
  ]);
  return {
    segmentCount,
    campaignCount,
    journeyCount,
    messageCount,
    recentEvents: recentEvents.map((e) => ({
      id: e.id,
      customerName: `${e.customer.firstName} ${e.customer.lastName}`,
      eventType: e.eventType,
      occurredAt: e.occurredAt,
    })),
  };
}

// Customer 360 marketing panel — engagement, opt-outs, segment memberships, persona signals.
export async function getCustomerMarketingProfile(customerId: string) {
  const [customer, segmentMemberships, recentMessages, recentEvents, personaSignals] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: customerId },
      select: { engagementScore: true, sentiment: true, lastMarketingContactAt: true, optOutEmail: true, optOutSms: true, optOutWhatsapp: true },
    }),
    prisma.marketingSegmentMember.findMany({
      where: { customerId },
      include: { segment: { select: { id: true, name: true } } },
    }),
    prisma.marketingMessage.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { campaign: { select: { name: true } } },
    }),
    prisma.engagementEvent.findMany({
      where: { customerId },
      orderBy: { occurredAt: "desc" },
      take: 10,
    }),
    prisma.lead.findMany({
      where: { customerId, suspectedPersona: { not: null } },
      select: { id: true, suspectedPersona: true, suspectedPersonaNote: true, realOpportunityAt: true },
    }),
  ]);
  if (!customer) return null;

  return {
    engagementScore: Number(customer.engagementScore),
    sentiment: customer.sentiment,
    lastMarketingContactAt: customer.lastMarketingContactAt,
    optOutEmail: customer.optOutEmail,
    optOutSms: customer.optOutSms,
    optOutWhatsapp: customer.optOutWhatsapp,
    segments: segmentMemberships.map((m) => ({ id: m.segment.id, name: m.segment.name })),
    recentMessages: recentMessages.map((m) => ({
      id: m.id,
      channel: m.channel,
      status: m.status,
      subject: m.subject,
      campaignName: m.campaign?.name ?? null,
      sentAt: m.sentAt,
    })),
    recentEvents: recentEvents.map((e) => ({ id: e.id, eventType: e.eventType, occurredAt: e.occurredAt })),
    personaSignals: personaSignals.map((l) => ({
      leadId: l.id,
      suspectedPersona: l.suspectedPersona,
      note: l.suspectedPersonaNote,
      capturedAt: l.realOpportunityAt,
    })),
  };
}

// Omnichannel view (docs/marketing-spec.md) — channels are scoped to what this app actually
// has real data for: EMAIL/SMS/WHATSAPP via MarketingMessage, PHONE/IN_PERSON via the existing
// Interaction model. No Website/App/Social/Chatbot/Marketplace channels — this app has no
// analytics, mobile app, social, chatbot, or marketplace integration to back an "available"
// badge for those with real data.
export const OMNICHANNEL_CHANNELS = ["EMAIL", "SMS", "WHATSAPP", "PHONE", "IN_PERSON"] as const;
export type OmnichannelChannel = (typeof OMNICHANNEL_CHANNELS)[number];

const CHANNEL_OPT_OUT_KEY: Partial<Record<OmnichannelChannel, "optOutEmail" | "optOutSms" | "optOutWhatsapp">> = {
  EMAIL: "optOutEmail",
  SMS: "optOutSms",
  WHATSAPP: "optOutWhatsapp",
};

export async function getCustomerOmnichannelProfile(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      optOutEmail: true,
      optOutSms: true,
      optOutWhatsapp: true,
      preferences: { select: { preferredContact: true } },
    },
  });
  if (!customer) return null;

  const [messages, interactions] = await Promise.all([
    prisma.marketingMessage.findMany({
      where: { customerId, channel: { in: ["EMAIL", "SMS", "WHATSAPP"] } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.interaction.findMany({
      where: { relatedEntityType: "CUSTOMER", relatedEntityId: customerId, type: { in: ["CALL", "MEETING", "SITE_VISIT"] } },
      orderBy: { occurredAt: "desc" },
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  const interactionChannel = (type: string): OmnichannelChannel => (type === "CALL" ? "PHONE" : "IN_PERSON");

  const timeline = [
    ...messages.map((m) => ({
      id: m.id,
      channel: m.channel as OmnichannelChannel,
      kind: "message" as const,
      label: m.subject || m.channel,
      detail: m.body,
      status: m.status,
      occurredAt: m.sentAt ?? m.createdAt,
      by: null as string | null,
    })),
    ...interactions.map((i) => ({
      id: i.id,
      channel: interactionChannel(i.type),
      kind: "interaction" as const,
      label: i.subject || i.type,
      detail: i.notes,
      status: null as string | null,
      occurredAt: i.occurredAt,
      by: `${i.user.firstName} ${i.user.lastName}`,
    })),
  ].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

  const preferredContact = customer.preferences?.preferredContact?.toUpperCase().replace(/[^A-Z]/g, "_");

  const channels = OMNICHANNEL_CHANNELS.map((id) => {
    const channelTimeline = timeline.filter((t) => t.channel === id);
    const optOutKey = CHANNEL_OPT_OUT_KEY[id];
    return {
      id,
      available: id === "EMAIL" ? !!customer.email : id === "IN_PERSON" ? true : !!customer.phone,
      optedOut: optOutKey ? customer[optOutKey] : false,
      preferred: preferredContact === id,
      lastUsed: channelTimeline[0]?.occurredAt ?? null,
      interactionCount: channelTimeline.length,
    };
  });

  const byChannel: Record<string, number> = {};
  for (const t of timeline) byChannel[t.channel] = (byChannel[t.channel] ?? 0) + 1;

  return {
    customer: { id: customer.id, name: `${customer.firstName} ${customer.lastName}`, email: customer.email, phone: customer.phone },
    channels,
    timeline: timeline.slice(0, 20),
    stats: {
      total: timeline.length,
      sent: messages.filter((m) => m.sentAt).length,
      opened: messages.filter((m) => m.openedAt).length,
      replied: messages.filter((m) => m.repliedAt).length,
      byChannel,
    },
  };
}
