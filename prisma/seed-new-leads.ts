// 25 new leads with full qualification detail — each lead gets its own new Customer (required by
// the Lead.customerId relation), a BANT score row, a Behavioral score row, 1-2 logged activities,
// and — for the Qualified/Real-Opportunity tier — a linked Opportunity, matching the depth of
// prisma/seed-sample-clients.ts and prisma/seed-additional-30.ts. Two referral-sourced leads are
// linked back to an existing seeded customer via referredByCustomerId to exercise the referral
// tracking feature. Funnel-shaped status distribution across all 8 LeadStatus values except
// CONVERTED (that implies a real Sale — out of scope here; see seed-sample-clients.ts for that).
//
// Run:  npx tsx prisma/seed-new-leads.ts   (after the main seed — needs lead sources / reps / property types)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Resolves PipelineStage.id for a literal OpportunityStage/LeadStatus key, cached per-run to
// avoid N+1 lookups since this script creates 25 Lead records and several Opportunity records.
const oppStageIdCache = new Map<string, string>();
async function oppStageId(key: string): Promise<string> {
  if (!oppStageIdCache.has(key)) {
    const stage = await prisma.pipelineStage.findFirstOrThrow({
      where: { pipeline: { key: "SALES_OPPORTUNITY" }, key },
    });
    oppStageIdCache.set(key, stage.id);
  }
  return oppStageIdCache.get(key)!;
}
const leadStageIdCache = new Map<string, string>();
async function leadStageId(key: string): Promise<string> {
  if (!leadStageIdCache.has(key)) {
    const stage = await prisma.pipelineStage.findFirstOrThrow({
      where: { pipeline: { key: "LEAD_NURTURE" }, key },
    });
    leadStageIdCache.set(key, stage.id);
  }
  return leadStageIdCache.get(key)!;
}

type Segment = "LOCAL_RESIDENTIAL" | "DIASPORA" | "CORPORATE" | "INVESTOR";
type Status = "NEW" | "CONTACTED" | "NURTURING" | "NO_RESPONSE" | "QUALIFIED" | "REAL_OPPORTUNITY" | "UNQUALIFIED";

type NewLead = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  segment: Segment;
  status: Status;
  sourceName: string;
  preferredLocation: string;
  propertyTypeName: string;
  notes: string;
  daysAgo: number;
  lostReason?: "NO_BUDGET" | "WRONG_TIMING" | "NOT_INTERESTED" | "UNRESPONSIVE" | "CHOSE_COMPETITOR" | "WRONG_FIT";
  suspectedPersona?: string;
  isReferral?: boolean;
};

const STAGE_PROBABILITY: Record<string, number> = {
  PROSPECTING: 10, QUALIFIED: 25, SITE_VISIT: 40, RESERVATION: 55, NEGOTIATION: 70,
};

function budgetForBedrooms(bedrooms: number, name: string): [number, number] {
  if (name === "Serviced Plot") return [80000, 200000];
  if (name === "Hotel Suite") return [150000, 300000];
  if (bedrooms >= 4) return [800000, 1500000];
  if (bedrooms === 3) return [500000, 900000];
  if (bedrooms === 2) return [320000, 520000];
  if (bedrooms === 1) return [200000, 350000];
  return [150000, 280000];
}

const NEW_LEADS: NewLead[] = [
  { firstName: "Yaw", lastName: "Antwi-Boasiako", email: "yaw.antwiboasiako@example.com", phone: "+233244220201", nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", status: "NEW", sourceName: "Website", preferredLocation: "Airport Hills, Accra", propertyTypeName: "3-Bedroom Townhouse", notes: "Submitted an enquiry via the website contact form, hasn't been called yet.", daysAgo: 1 },
  { firstName: "Abena", lastName: "Dapaah", email: "abena.dapaah@example.com", phone: "+233201220202", nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", status: "NEW", sourceName: "Google Ads", preferredLocation: "Tema, Greater Accra", propertyTypeName: "2-Bedroom Apartment", notes: "Clicked through from a Google Ads campaign for The Niiyo.", daysAgo: 1 },
  { firstName: "Kwesi", lastName: "Ohene-Djan", email: "kwesi.ohenedjan@example.com", phone: "+233551220203", nationality: "Ghanaian", segment: "INVESTOR", status: "NEW", sourceName: "Agent / Broker", preferredLocation: "Trasacco Valley, Accra", propertyTypeName: "Serviced Plot", notes: "Referred in by an external broker looking at land banking opportunities.", daysAgo: 2 },
  { firstName: "Naa Dedei", lastName: "Lartey", email: "naadedei.lartey@example.com", phone: "+233208220204", nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", status: "NEW", sourceName: "Walk-in", preferredLocation: "East Legon, Accra", propertyTypeName: "1-Bedroom Apartment", notes: "Walked into the Henrietta's Residences show unit over the weekend.", daysAgo: 3 },

  { firstName: "Emmanuella", lastName: "Boakye", email: "emmanuella.boakye@example.com", phone: "+233244220205", nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", status: "CONTACTED", sourceName: "Social Media - Instagram", preferredLocation: "Spintex, Accra", propertyTypeName: "1-Bedroom Apartment", notes: "First call made — interested in Forte, asked for a payment plan breakdown.", daysAgo: 4 },
  { firstName: "Osei", lastName: "Bonsu-Kyeretwie", email: "osei.bonsukyeretwie@example.com", phone: "+233201220206", nationality: "Ghanaian", segment: "CORPORATE", status: "CONTACTED", sourceName: "Direct Enquiry", preferredLocation: "Cantonments, Accra", propertyTypeName: "2-Bedroom Apartment", notes: "Corporate housing enquiry for two relocating staff — spoke with facilities manager.", daysAgo: 5 },
  { firstName: "Gloria", lastName: "Ntim-Addae", email: "gloria.ntimaddae@example.com", phone: "+441614560207", nationality: "British-Ghanaian", segment: "DIASPORA", status: "CONTACTED", sourceName: "Social Media - Facebook", preferredLocation: "Roman Ridge, Accra", propertyTypeName: "Studio Apartment", notes: "Diaspora buyer, planning a Ghana visit in two months to view Nova in person.", daysAgo: 6 },
  { firstName: "Fiifi", lastName: "Van Lare", email: "fiifi.vanlare@example.com", phone: "+233247220208", nationality: "Ghanaian", segment: "INVESTOR", status: "CONTACTED", sourceName: "Event / Exhibition", preferredLocation: "Cantonments, Accra", propertyTypeName: "Penthouse", notes: "Met at the Ghana Property Expo — following up on ARLO Cantonments penthouse pricing.", daysAgo: 7 },

  { firstName: "Rejoice", lastName: "Attipoe", email: "rejoice.attipoe@example.com", phone: "+233551220209", nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", status: "NURTURING", sourceName: "Website", preferredLocation: "Adjiringanor, Accra", propertyTypeName: "1-Bedroom Apartment", notes: "Interested in Lotus but budget is tight — nurturing with payment plan options monthly.", daysAgo: 15 },
  { firstName: "Kelvin", lastName: "Adu-Boahen", email: "kelvin.aduboahen@example.com", phone: "+233208220210", nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", status: "NURTURING", sourceName: "Social Media - Instagram", preferredLocation: "Tema, Greater Accra", propertyTypeName: "2-Bedroom Apartment", notes: "Saving toward a deposit — check back in Q1 next year per his request.", daysAgo: 20 },
  { firstName: "Adjeley", lastName: "Tettey-Fio", email: "adjeley.tetteyfio@example.com", phone: "+233244220211", nationality: "Ghanaian", segment: "DIASPORA", status: "NURTURING", sourceName: "Referral", preferredLocation: "Airport Residential Area, Accra", propertyTypeName: "3-Bedroom Townhouse", notes: "Diaspora referral, still comparing The Address against a competitor development.", daysAgo: 18, isReferral: true },
  { firstName: "Selorm", lastName: "Agbeko", email: "selorm.agbeko@example.com", phone: "+233201220212", nationality: "Ghanaian", segment: "INVESTOR", status: "NURTURING", sourceName: "Website", preferredLocation: "Trasacco Valley, Accra", propertyTypeName: "Serviced Plot", notes: "Watching land prices at Woodlands before committing — quarterly check-in.", daysAgo: 25 },

  { firstName: "Portia", lastName: "Anim-Addo", email: "portia.animaddo@example.com", phone: "+233551220213", nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", status: "NO_RESPONSE", sourceName: "Google Ads", preferredLocation: "Osu, Accra", propertyTypeName: "Hotel Suite", notes: "No response after two calls and an email — one more attempt scheduled.", daysAgo: 30 },
  { firstName: "Bright", lastName: "Kusi-Appouh", email: "bright.kusiappouh@example.com", phone: "+233208220214", nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", status: "NO_RESPONSE", sourceName: "Walk-in", preferredLocation: "Airport Hills, Accra", propertyTypeName: "3-Bedroom Townhouse", notes: "Visited the show unit but hasn't picked up follow-up calls since.", daysAgo: 28 },
  { firstName: "Hannah", lastName: "Okine-Larbi", email: "hannah.okinelarbi@example.com", phone: "+14045550215", nationality: "American-Ghanaian", segment: "DIASPORA", status: "NO_RESPONSE", sourceName: "Social Media - Facebook", preferredLocation: "Roman Ridge, Accra", propertyTypeName: "2-Bedroom Apartment", notes: "Diaspora lead, timezone makes calls hard to land — moved to email-only outreach.", daysAgo: 33 },

  { firstName: "Nathaniel", lastName: "Kwarteng-Siaw", email: "nathaniel.kwartengsiaw@example.com", phone: "+233244220216", nationality: "Ghanaian", segment: "CORPORATE", status: "QUALIFIED", sourceName: "Direct Enquiry", preferredLocation: "Airport Residential Area, Accra", propertyTypeName: "4-Bedroom Detached", notes: "Confirmed budget and board approval in hand for exec staff housing.", daysAgo: 10 },
  { firstName: "Araba", lastName: "Essilfie-Bondzie", email: "araba.essilfiebondzie@example.com", phone: "+233201220217", nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", status: "QUALIFIED", sourceName: "Referral", preferredLocation: "East Legon, Accra", propertyTypeName: "2-Bedroom Apartment", notes: "Pre-approved mortgage in hand, ready for a site visit next week.", daysAgo: 9, isReferral: true },
  { firstName: "Prince", lastName: "Damptey-Amoako", email: "prince.damptyeamoako@example.com", phone: "+233551220218", nationality: "Ghanaian", segment: "INVESTOR", status: "QUALIFIED", sourceName: "Website", preferredLocation: "Cantonments, Accra", propertyTypeName: "Penthouse", notes: "Cash buyer, comparing rental yield across ARLO and The Address penthouses.", daysAgo: 8 },
  { firstName: "Yvonne", lastName: "Sarkodie-Mensah", email: "yvonne.sarkodiemensah@example.com", phone: "+12145550219", nationality: "American-Ghanaian", segment: "DIASPORA", status: "QUALIFIED", sourceName: "Social Media - Instagram", preferredLocation: "Roman Ridge, Accra", propertyTypeName: "2-Bedroom Apartment", notes: "Confirmed proof of funds, targeting a Christmas relocation to Nova.", daysAgo: 11 },

  { firstName: "Justice", lastName: "Owusu-Afriyie", email: "justice.owusuafriyie@example.com", phone: "+233244220220", nationality: "Ghanaian", segment: "INVESTOR", status: "REAL_OPPORTUNITY", sourceName: "Agent / Broker", preferredLocation: "Cantonments, Accra", propertyTypeName: "3-Bedroom Townhouse", notes: "Sustained engagement over three weeks — two site visits, actively negotiating.", daysAgo: 22, suspectedPersona: "Investor — Yield Seeker" },
  { firstName: "Belinda", lastName: "Fosu-Gyeabour", email: "belinda.fosugyeabour@example.com", phone: "+441132220221", nationality: "British-Ghanaian", segment: "DIASPORA", status: "REAL_OPPORTUNITY", sourceName: "Email Campaign", preferredLocation: "Roman Ridge, Accra", propertyTypeName: "2-Bedroom Apartment", notes: "Diaspora buyer near relocation — video tour completed, deposit conversation started.", daysAgo: 26, suspectedPersona: "Diaspora — Nostalgic Retiree" },
  { firstName: "Emmanuel", lastName: "Danso-Abeam", email: "emmanuel.dansoabeam@example.com", phone: "+233208220222", nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", status: "REAL_OPPORTUNITY", sourceName: "Walk-in", preferredLocation: "Adjiringanor, Accra", propertyTypeName: "1-Bedroom Apartment", notes: "First-time buyer, payment plan agreed in principle, awaiting final sign-off.", daysAgo: 24, suspectedPersona: "Local Resident — First-Time Homeowner" },

  { firstName: "Millicent", lastName: "Baiden-Amissah", email: "millicent.baidenamissah@example.com", phone: "+233551220223", nationality: "Ghanaian", segment: "LOCAL_RESIDENTIAL", status: "UNQUALIFIED", sourceName: "Google Ads", preferredLocation: "Spintex, Accra", propertyTypeName: "1-Bedroom Apartment", notes: "Budget fell well short of even the entry-level units on offer.", daysAgo: 35, lostReason: "NO_BUDGET" },
  { firstName: "Ransford", lastName: "Quaye-Foli", email: "ransford.quayefoli@example.com", phone: "+233201220224", nationality: "Ghanaian", segment: "INVESTOR", status: "UNQUALIFIED", sourceName: "Website", preferredLocation: "Trasacco Valley, Accra", propertyTypeName: "Serviced Plot", notes: "Went with a competitor's land offering closer to his existing holdings.", daysAgo: 40, lostReason: "CHOSE_COMPETITOR" },
  { firstName: "Doreen", lastName: "Asamoah-Yeboah", email: "doreen.asamoahyeboah@example.com", phone: "+233244220225", nationality: "Ghanaian", segment: "CORPORATE", status: "UNQUALIFIED", sourceName: "Direct Enquiry", preferredLocation: "Airport Residential Area, Accra", propertyTypeName: "3-Bedroom Townhouse", notes: "Company placed the relocation project on hold indefinitely.", daysAgo: 38, lostReason: "WRONG_TIMING" },
];

async function main() {
  const [sources, reps, propertyTypes, availableUnits, referrer1, referrer2] = await Promise.all([
    prisma.leadSource.findMany({ select: { id: true, name: true } }),
    prisma.user.findMany({ where: { salesAgentProfile: { isNot: null } }, select: { id: true } }),
    prisma.propertyType.findMany({ select: { id: true, name: true, bedrooms: true } }),
    prisma.unit.findMany({ where: { status: "AVAILABLE" }, select: { id: true, currentPrice: true, propertyTypeId: true } }),
    prisma.customer.findFirst({ where: { email: "kwame.mensah@example.com" }, select: { id: true } }),
    prisma.customer.findFirst({ where: { email: "ama.owusu@example.com" }, select: { id: true } }),
  ]);
  if (sources.length === 0 || reps.length === 0 || propertyTypes.length === 0) {
    throw new Error("Reference data (lead sources / sales reps / property types) missing — run the main seed first.");
  }
  const referrers = [referrer1, referrer2].filter(Boolean) as { id: string }[];

  const sourceByName = new Map(sources.map((s) => [s.name, s.id]));
  const propertyTypeByName = new Map(propertyTypes.map((p) => [p.name, p]));

  let leadCount = 0;
  let opportunityCount = 0;

  for (let i = 0; i < NEW_LEADS.length; i++) {
    const l = NEW_LEADS[i];
    const rep = reps[i % reps.length];
    const createdAt = new Date(Date.now() - l.daysAgo * 86400000);

    const customer = await prisma.customer.create({
      data: {
        firstName: l.firstName,
        lastName: l.lastName,
        email: l.email,
        phone: l.phone,
        nationality: l.nationality,
        segment: l.segment,
        kycStatus: "PENDING",
        assignedSalesRepId: rep.id,
        createdAt,
      },
    });

    const propertyType = propertyTypeByName.get(l.propertyTypeName)!;
    const [budgetMin, budgetMax] = budgetForBedrooms(propertyType.bedrooms, propertyType.name);
    // "Email Campaign" doesn't exist as a seeded LeadSource name — falls back to Website, same
    // graceful behavior as importLeadsCsv's default-to-first-source rule for an unrecognized tag.
    const sourceId = sourceByName.get(l.sourceName) ?? sources[0].id;

    const isQualifiedTrack = l.status === "QUALIFIED" || l.status === "REAL_OPPORTUNITY";
    const isUnqualified = l.status === "UNQUALIFIED";
    const qualifiedAt = isQualifiedTrack ? new Date(createdAt.getTime() + 3 * 86400000) : null;
    const realOpportunityAt = l.status === "REAL_OPPORTUNITY" ? new Date(createdAt.getTime() + 9 * 86400000) : null;
    const score = l.status === "REAL_OPPORTUNITY" ? 88 : l.status === "QUALIFIED" ? 72 : l.status === "NURTURING" ? 42 : l.status === "CONTACTED" ? 28 : isUnqualified ? 12 : 18;

    const referredBy = l.isReferral && referrers.length > 0 ? referrers[leadCount % referrers.length] : undefined;

    const lead = await prisma.lead.create({
      data: {
        customerId: customer.id,
        sourceId,
        assignedToId: rep.id,
        budgetMin,
        budgetMax,
        currency: "USD",
        preferredLocation: l.preferredLocation,
        propertyTypeId: propertyType.id,
        score,
        status: l.status,
        bantScore: isQualifiedTrack ? 76 : 30,
        pipelineStageId: await leadStageId(l.status),
        qualificationStatus: isQualifiedTrack ? "QUALIFIED" : "UNQUALIFIED",
        qualifiedAt,
        realOpportunityAt,
        suspectedPersona: l.suspectedPersona,
        notes: l.notes,
        lostReason: isUnqualified ? l.lostReason : null,
        lostReasonNote: isUnqualified ? "Captured during weekly pipeline review." : null,
        disqualifiedAt: isUnqualified ? new Date(createdAt.getTime() + 5 * 86400000) : null,
        referredByCustomerId: referredBy?.id,
        referralRewardStatus: referredBy ? "PENDING" : "NONE",
        createdAt,
      },
    });
    leadCount++;

    // Activities — every lead past NEW gets at least one logged touchpoint.
    if (l.status !== "NEW") {
      await prisma.leadActivity.create({
        data: { leadId: lead.id, type: "CALL", description: "Initial qualification call.", createdById: rep.id, occurredAt: new Date(createdAt.getTime() + 1 * 86400000) },
      });
    }
    if (isQualifiedTrack) {
      await prisma.leadActivity.create({
        data: { leadId: lead.id, type: "EMAIL", description: "Sent pricing sheet and payment plan options.", createdById: rep.id, occurredAt: new Date(createdAt.getTime() + 4 * 86400000) },
      });
    }

    // BANT score for the qualified tier.
    if (isQualifiedTrack) {
      await prisma.bantScore.create({
        data: {
          leadId: lead.id,
          userId: rep.id,
          budgetScore: 85,
          authorityScore: l.segment === "CORPORATE" ? 90 : 75,
          needScore: 78,
          timelineScore: l.status === "REAL_OPPORTUNITY" ? 75 : 60,
          fitScore: 80,
          totalScore: 76,
          status: "QUALIFIED",
          notes: "Verified via documentation and direct conversation.",
        },
      });
    }

    // Behavioral score for everyone — engagement signal independent of BANT.
    const engagementLevel = l.status === "REAL_OPPORTUNITY" ? "HIGH" : isQualifiedTrack ? "MEDIUM" : l.status === "NURTURING" || l.status === "CONTACTED" ? "MEDIUM" : "LOW";
    await prisma.behavioralScore.create({
      data: {
        leadId: lead.id,
        emailOpens: isQualifiedTrack ? 5 : l.status === "NO_RESPONSE" ? 0 : 2,
        emailClicks: isQualifiedTrack ? 3 : 0,
        siteVisits: l.status === "REAL_OPPORTUNITY" ? 2 : isQualifiedTrack ? 1 : 0,
        documentViews: isQualifiedTrack ? 3 : 1,
        meetingsAttended: l.status === "REAL_OPPORTUNITY" ? 1 : 0,
        callsCompleted: l.status === "NEW" ? 0 : 1,
        totalScore: l.status === "REAL_OPPORTUNITY" ? 74 : isQualifiedTrack ? 58 : l.status === "NO_RESPONSE" ? 8 : 22,
        engagementLevel,
        lastActivityAt: createdAt,
      },
    });

    // Opportunity for the qualified tier — mirrors seed-additional-30.ts.
    if (isQualifiedTrack) {
      const matchingUnits = availableUnits.filter((u) => u.propertyTypeId === propertyType.id);
      const unit = (matchingUnits.length > 0 ? matchingUnits : availableUnits)[leadCount % (matchingUnits.length > 0 ? matchingUnits.length : availableUnits.length)];
      const stage = l.status === "REAL_OPPORTUNITY" ? (leadCount % 2 === 0 ? "SITE_VISIT" : "NEGOTIATION") : leadCount % 2 === 0 ? "QUALIFIED" : "SITE_VISIT";

      await prisma.opportunity.create({
        data: {
          leadId: lead.id,
          customerId: customer.id,
          unitId: unit?.id,
          expectedValue: unit ? unit.currentPrice : (budgetMin + budgetMax) / 2,
          currency: "USD",
          stage: stage as never,
          pipelineStageId: await oppStageId(stage),
          probability: STAGE_PROBABILITY[stage],
          expectedCloseDate: new Date(Date.now() + (20 + leadCount * 3) * 86400000),
          ownerId: rep.id,
          createdAt: qualifiedAt ?? createdAt,
        },
      });
      opportunityCount++;
    }
  }

  console.log(`Added ${leadCount} leads (with customers, BANT/behavioral scores, activities) and ${opportunityCount} opportunities.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
