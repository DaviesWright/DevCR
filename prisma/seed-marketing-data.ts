// Marketing module expansion — additive to the automation library prisma/seed.ts already builds
// (Investor / Corporate personas, 5 segments, 10 templates, 3 campaigns, 3 journeys — see
// docs/marketing-spec.md). This file fills out the remaining two buyer personas from the Buyer
// Persona report (Local Resident, Diaspora — Investor and Corporate already exist), adds 5 more
// segments, 6 more channel templates, 4 more campaigns, and 3 more journeys, without renaming or
// touching anything the main seed already created.
//
// Run:  npx tsx prisma/seed-marketing-data.ts   (after the main seed)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [jane, michael, localCustomers, diasporaCustomers, kycPendingCustomers] = await Promise.all([
    prisma.user.findUnique({ where: { email: "jane.agent@devtraco.com" }, select: { id: true } }),
    prisma.user.findUnique({ where: { email: "michael.osei@devtraco.com" }, select: { id: true } }),
    prisma.customer.findMany({ where: { segment: "LOCAL_RESIDENTIAL" }, select: { id: true } }),
    prisma.customer.findMany({ where: { segment: "DIASPORA" }, select: { id: true } }),
    prisma.customer.findMany({ where: { kycStatus: "PENDING" }, select: { id: true } }),
  ]);
  if (!jane || !michael) {
    throw new Error("Seeded users jane.agent@devtraco.com / michael.osei@devtraco.com not found — run the main seed first.");
  }

  // ---- Personas — completes the four-persona buyer set (Investor and Corporate already exist) ----
  const localResidentPersona = await prisma.marketingPersona.create({
    data: {
      name: "Local Resident — First-Time Homeowner",
      description: "Ghana-based buyer purchasing a primary residence. Price-sensitive; values proximity to work/schools, transparent fees, and a manageable payment plan over finishes.",
      suggestedChannels: "SMS, WhatsApp, phone",
    },
  });
  const diasporaPersona = await prisma.marketingPersona.create({
    data: {
      name: "Diaspora — Nostalgic Retiree",
      description: "Ghanaian diaspora nearing retirement, buying a home to relocate back to Ghana. Trust-building, video tours, and clear KYC/remittance guidance matter more than price negotiation.",
      suggestedChannels: "Email, WhatsApp",
    },
  });

  // ---- Segments ----
  const localResidentSegment = await prisma.marketingSegment.create({
    data: { name: "Local Resident Buyers", description: "All Local Resident-segment customers.", criteria: { buyerSegment: "LOCAL_RESIDENTIAL" }, createdById: jane.id },
  });
  if (localCustomers.length > 0) {
    await prisma.marketingSegmentMember.createMany({ data: localCustomers.map((c) => ({ segmentId: localResidentSegment.id, customerId: c.id })) });
  }
  await prisma.marketingSegment.update({ where: { id: localResidentSegment.id }, data: { memberCount: localCustomers.length, lastComputedAt: new Date() } });

  const diasporaSegment = await prisma.marketingSegment.create({
    data: { name: "Diaspora Buyers", description: "All Diaspora-segment customers.", criteria: { buyerSegment: "DIASPORA" }, createdById: jane.id },
  });
  if (diasporaCustomers.length > 0) {
    await prisma.marketingSegmentMember.createMany({ data: diasporaCustomers.map((c) => ({ segmentId: diasporaSegment.id, customerId: c.id })) });
  }
  await prisma.marketingSegment.update({ where: { id: diasporaSegment.id }, data: { memberCount: diasporaCustomers.length, lastComputedAt: new Date() } });

  const kycPendingSegment = await prisma.marketingSegment.create({
    data: { name: "KYC Pending Follow-up", description: "Customers whose KYC verification is still pending — needs a nudge before they can proceed to a reservation.", criteria: { kycStatus: "PENDING" }, createdById: michael.id },
  });
  if (kycPendingCustomers.length > 0) {
    await prisma.marketingSegmentMember.createMany({ data: kycPendingCustomers.map((c) => ({ segmentId: kycPendingSegment.id, customerId: c.id })) });
  }
  await prisma.marketingSegment.update({ where: { id: kycPendingSegment.id }, data: { memberCount: kycPendingCustomers.length, lastComputedAt: new Date() } });

  const highEngagementSegment = await prisma.marketingSegment.create({
    data: { name: "High Engagement (Hot Leads)", description: "Customers with an engagement score of 60 or above — the priority call list for Sales.", criteria: { minEngagementScore: 60 }, createdById: jane.id },
  });
  await prisma.marketingSegment.update({ where: { id: highEngagementSegment.id }, data: { memberCount: 0, lastComputedAt: new Date() } });

  const smsOptInSegment = await prisma.marketingSegment.create({
    data: { name: "SMS Opt-in — Ghana Residents", description: "Manually curated SMS call list for Ghana-based residents who've opted in.", criteria: {}, isDynamic: false, channel: "SMS", createdById: michael.id },
  });
  const smsMembers = localCustomers.slice(0, Math.min(10, localCustomers.length));
  if (smsMembers.length > 0) {
    await prisma.marketingSegmentMember.createMany({ data: smsMembers.map((c) => ({ segmentId: smsOptInSegment.id, customerId: c.id, manuallyAdded: true })) });
  }
  await prisma.marketingSegment.update({ where: { id: smsOptInSegment.id }, data: { memberCount: smsMembers.length, lastComputedAt: new Date() } });

  // ---- Templates ----
  const [localResidentSmsTemplate, diasporaTourEmailTemplate, diasporaWhatsAppTemplate, kycReminderEmailTemplate] = await Promise.all([
    prisma.messageTemplate.create({
      data: { name: "Local Resident SMS — Payment Plan Offer", channel: "SMS", bodyText: "New flexible payment plans now open across our Accra developments. Reply YES for a callback from your consultant." },
    }),
    prisma.messageTemplate.create({
      data: { name: "Diaspora Virtual Tour Invite", channel: "EMAIL", subject: "See your future home from anywhere — book a virtual tour", bodyText: "Can't visit in person yet? Book a live video walkthrough of your shortlisted unit with your Devtraco consultant, wherever you are." },
    }),
    prisma.messageTemplate.create({
      data: { name: "Diaspora WhatsApp Relocation Guide", channel: "WHATSAPP", bodyText: "Planning your move back to Ghana? Here's our short relocation guide covering KYC documents, remittance options, and what to expect at handover." },
    }),
    prisma.messageTemplate.create({
      data: { name: "KYC Reminder Email", channel: "EMAIL", subject: "Action needed: complete your KYC verification", bodyText: "Your KYC verification is still pending — completing it is the last step before we can process a reservation. Reply to this email or send your documents via the customer portal." },
    }),
  ]);
  await prisma.messageTemplate.createMany({
    data: [
      { name: "First-Time Buyer Guide Email", channel: "EMAIL", subject: "Your first home, step by step", bodyText: "A short guide to buying your first home with Devtraco: reservation, KYC, payment plans, and what happens at handover." },
      { name: "Site Visit Follow-up SMS", channel: "SMS", bodyText: "Thanks for visiting today! Let us know if you have questions, or if you'd like to move ahead with a reservation." },
    ],
  });

  // ---- Campaigns ----
  await prisma.marketingCampaign.create({
    data: {
      name: "Diaspora Homecoming Campaign",
      channel: "EMAIL",
      segmentId: diasporaSegment.id,
      personaId: diasporaPersona.id,
      templateId: diasporaTourEmailTemplate.id,
      objective: "Convert diaspora prospects into a booked virtual tour ahead of their next Ghana visit.",
      status: "ACTIVE",
      createdById: jane.id,
    },
  });
  await prisma.marketingCampaign.create({
    data: {
      name: "First-Time Buyer Payment Plan Push",
      channel: "SMS",
      segmentId: localResidentSegment.id,
      personaId: localResidentPersona.id,
      templateId: localResidentSmsTemplate.id,
      objective: "Drive callback requests from local-resident prospects on the new flexible payment plans.",
      status: "ACTIVE",
      createdById: jane.id,
    },
  });
  await prisma.marketingCampaign.create({
    data: {
      name: "KYC Completion Drive",
      channel: "EMAIL",
      segmentId: kycPendingSegment.id,
      templateId: kycReminderEmailTemplate.id,
      objective: "Clear the KYC-pending backlog so reservations aren't blocked on paperwork.",
      status: "SCHEDULED",
      startDate: new Date(Date.now() + 3 * 86400000),
      createdById: michael.id,
    },
  });
  await prisma.marketingCampaign.create({
    data: {
      name: "New Launch Announcement — Lotus Phase 2",
      channel: "WHATSAPP",
      segmentId: smsOptInSegment.id,
      templateId: diasporaWhatsAppTemplate.id,
      objective: "Announce Lotus Phase 2 availability to the priority outreach list ahead of the public launch.",
      status: "DRAFT",
      createdById: michael.id,
    },
  });

  // ---- Journeys ----
  const diasporaJourney = await prisma.marketingJourney.create({
    data: {
      name: "Diaspora Relocation Journey",
      description: "Virtual tour invite, then a WhatsApp relocation guide, then a scheduled video call.",
      status: "ACTIVE",
      segmentId: diasporaSegment.id,
      createdById: jane.id,
      steps: {
        create: [
          { stepOrder: 1, name: "Virtual tour invite", actionType: "SEND_EMAIL", actionConfig: { subject: "See your future home from anywhere — book a virtual tour", body: "Book a live video walkthrough of your shortlisted unit with your consultant." } },
          { stepOrder: 2, name: "Wait two days", actionType: "WAIT", actionConfig: {}, waitHours: 48 },
          { stepOrder: 3, name: "Relocation guide WhatsApp", actionType: "SEND_WHATSAPP", actionConfig: { body: "Here's our short relocation guide covering KYC documents, remittance options, and handover." } },
          { stepOrder: 4, name: "Schedule diaspora video call", actionType: "CREATE_TASK", actionConfig: { title: "Schedule diaspora video call" } },
        ],
      },
    },
  });

  const kycJourney = await prisma.marketingJourney.create({
    data: {
      name: "KYC Completion Nurture",
      description: "Reminder email, an SMS nudge, then a direct call task if still unresolved.",
      status: "ACTIVE",
      segmentId: kycPendingSegment.id,
      createdById: michael.id,
      steps: {
        create: [
          { stepOrder: 1, name: "KYC reminder email", actionType: "SEND_EMAIL", actionConfig: { subject: "Action needed: complete your KYC verification", body: "Completing your KYC is the last step before we can process a reservation." } },
          { stepOrder: 2, name: "Wait three days", actionType: "WAIT", actionConfig: {}, waitHours: 72 },
          { stepOrder: 3, name: "KYC SMS nudge", actionType: "SEND_SMS", actionConfig: { body: "Reminder: your KYC verification is still pending. Reply for help completing it." } },
          { stepOrder: 4, name: "Call re: KYC documents", actionType: "CREATE_TASK", actionConfig: { title: "Call customer re: outstanding KYC documents" } },
        ],
      },
    },
  });

  const firstTimeBuyerJourney = await prisma.marketingJourney.create({
    data: {
      name: "First-Time Buyer Nurture",
      description: "Payment plan SMS, then a first-time buyer guide email, then a sales follow-up.",
      status: "ACTIVE",
      segmentId: localResidentSegment.id,
      createdById: jane.id,
      steps: {
        create: [
          { stepOrder: 1, name: "Payment plan SMS", actionType: "SEND_SMS", actionConfig: { body: "New flexible payment plans now open across our Accra developments." } },
          { stepOrder: 2, name: "Wait a day", actionType: "WAIT", actionConfig: {}, waitHours: 24 },
          { stepOrder: 3, name: "First-time buyer guide email", actionType: "SEND_EMAIL", actionConfig: { subject: "Your first home, step by step", body: "A short guide to buying your first home with Devtraco." } },
          { stepOrder: 4, name: "Sales follow-up on payment plan interest", actionType: "CREATE_TASK", actionConfig: { title: "Follow up on payment plan interest" } },
        ],
      },
    },
  });

  // Enroll a few sample customers into each new journey so it isn't empty on first load.
  for (const [journey, members] of [
    [diasporaJourney, diasporaCustomers],
    [kycJourney, kycPendingCustomers],
    [firstTimeBuyerJourney, localCustomers],
  ] as const) {
    if (members.length === 0) continue;
    const steps = await prisma.marketingJourneyStep.findMany({ where: { journeyId: journey.id }, orderBy: { stepOrder: "asc" } });
    await prisma.customerJourney.createMany({
      data: members.slice(0, Math.min(3, members.length)).map((c) => ({
        customerId: c.id,
        journeyId: journey.id,
        currentStepId: steps[0].id,
        enteredAt: new Date(),
        lastActivityAt: new Date(),
      })),
    });
  }

  console.log("Added 2 personas, 5 segments, 6 templates, 4 campaigns, 3 journeys (with sample enrollments).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
