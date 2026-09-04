import { prisma } from "@/lib/prisma";

export type InteractionTimelineItem = {
  id: string;
  type: string;
  subject: string | null;
  notes: string | null;
  occurredAt: Date;
  by: string;
};

// Real, OAuth-synced emails/calendar events (src/lib/integrations) are matched to a Customer,
// not a Lead/Opportunity directly — every entity type resolves to a customerId for this lookup
// (Lead.customerId, Opportunity.customerId, or the Customer's own id) so a rep's real inbox
// activity with that person shows up on all three pages, not just the Customer's.
async function getSyncedItems(customerId: string): Promise<InteractionTimelineItem[]> {
  const [emails, events] = await Promise.all([
    prisma.syncedEmail.findMany({
      where: { matchedCustomerId: customerId },
      orderBy: { occurredAt: "desc" },
      include: { connection: { include: { user: { select: { firstName: true, lastName: true } } } } },
    }),
    prisma.syncedCalendarEvent.findMany({
      where: { matchedCustomerId: customerId },
      orderBy: { startAt: "desc" },
      include: { connection: { include: { user: { select: { firstName: true, lastName: true } } } } },
    }),
  ]);

  const fromEmails: InteractionTimelineItem[] = emails.map((e) => ({
    id: e.id,
    type: "EMAIL",
    subject: e.subject,
    notes: e.snippet,
    occurredAt: e.occurredAt,
    by: `${e.connection.user.firstName} ${e.connection.user.lastName}'s inbox (synced)`,
  }));
  const fromEvents: InteractionTimelineItem[] = events.map((e) => ({
    id: e.id,
    type: "MEETING",
    subject: e.title,
    notes: e.description,
    occurredAt: e.startAt,
    by: `${e.connection.user.firstName} ${e.connection.user.lastName}'s calendar (synced)`,
  }));
  return [...fromEmails, ...fromEvents];
}

// Opportunity has no dedicated activity model — reads straight off the generic Interaction
// table. Customer merges Interaction (calls/meetings/notes) with MarketingMessage (simulated
// email/SMS/WhatsApp sends) so a message logged via the shared action bar shows up here too.
// Lead keeps reading LeadActivity (see getLeadDetail) — callers pass its rows in via
// `manualItems` so this function only has to own the synced-items merge, not LeadActivity too.
export async function getInteractionTimeline(
  entityType: "OPPORTUNITY" | "CUSTOMER",
  entityId: string,
  customerId: string
): Promise<InteractionTimelineItem[]> {
  const synced = await getSyncedItems(customerId);

  if (entityType === "OPPORTUNITY") {
    const rows = await prisma.interaction.findMany({
      where: { relatedEntityType: "OPPORTUNITY", relatedEntityId: entityId },
      orderBy: { occurredAt: "desc" },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    const manual: InteractionTimelineItem[] = rows.map((i) => ({
      id: i.id,
      type: i.type,
      subject: i.subject,
      notes: i.notes,
      occurredAt: i.occurredAt,
      by: `${i.user.firstName} ${i.user.lastName}`,
    }));
    return [...manual, ...synced].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  }

  const [interactions, messages] = await Promise.all([
    prisma.interaction.findMany({
      where: { relatedEntityType: "CUSTOMER", relatedEntityId: entityId },
      orderBy: { occurredAt: "desc" },
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
    prisma.marketingMessage.findMany({
      where: { customerId: entityId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const fromInteractions: InteractionTimelineItem[] = interactions.map((i) => ({
    id: i.id,
    type: i.type,
    subject: i.subject,
    notes: i.notes,
    occurredAt: i.occurredAt,
    by: `${i.user.firstName} ${i.user.lastName}`,
  }));
  const fromMessages: InteractionTimelineItem[] = messages.map((m) => ({
    id: m.id,
    type: m.channel,
    subject: m.subject,
    notes: m.body,
    occurredAt: m.sentAt ?? m.createdAt,
    by: "Simulated send",
  }));

  return [...fromInteractions, ...fromMessages, ...synced].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
}

// Lead's own timeline (LeadActivity) merged with the same synced-items pool, for parity with
// Customer/Opportunity. Exported separately since Lead's manual entries come from a different
// table (LeadActivity, not the generic Interaction) — see getLeadDetail for why.
export async function getLeadSyncedItems(customerId: string): Promise<InteractionTimelineItem[]> {
  return getSyncedItems(customerId);
}
