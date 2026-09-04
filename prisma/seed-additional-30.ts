// One-off data-volume top-up (2026-09-03) — the demo dataset only had 24 customers / 23 leads /
// 14 opportunities, too thin to meaningfully exercise the new marketing-lists feature or general
// pipeline reporting. Adds 30 more customers (each with one Lead), and Opportunities for the
// subset of leads that reach QUALIFIED/REAL_OPPORTUNITY — a funnel naturally narrows, so this is
// not "30 opportunities" too. Deliberately stops short of CONVERTED/CLOSED_WON: those imply a
// real Sale + commission tranches created via the actual moveOpportunityStage() action, which
// this script doesn't replicate.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Resolves PipelineStage.id for a literal OpportunityStage/LeadStatus key, cached per-run to
// avoid N+1 lookups since this script creates 30 Lead records and several Opportunity records.
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

const STAGE_PROBABILITY: Record<string, number> = {
  PROSPECTING: 10,
  QUALIFIED: 25,
  SITE_VISIT: 40,
  RESERVATION: 55,
  NEGOTIATION: 70,
};

type SegmentKey = "LOCAL_RESIDENTIAL" | "DIASPORA" | "CORPORATE" | "INVESTOR";

const NEW_PEOPLE: { firstName: string; lastName: string; segment: SegmentKey; nationality: string; countryCode: "GH" | "UK" | "US" | "CA" | "DE" }[] = [
  { firstName: "Yaa", lastName: "Asantewaa", segment: "LOCAL_RESIDENTIAL", nationality: "Ghanaian", countryCode: "GH" },
  { firstName: "Kwaku", lastName: "Sarfo", segment: "LOCAL_RESIDENTIAL", nationality: "Ghanaian", countryCode: "GH" },
  { firstName: "Abigail", lastName: "Nkrumah", segment: "LOCAL_RESIDENTIAL", nationality: "Ghanaian", countryCode: "GH" },
  { firstName: "Emmanuel", lastName: "Ashong", segment: "LOCAL_RESIDENTIAL", nationality: "Ghanaian", countryCode: "GH" },
  { firstName: "Gifty", lastName: "Amponsah", segment: "LOCAL_RESIDENTIAL", nationality: "Ghanaian", countryCode: "GH" },
  { firstName: "Nii", lastName: "Armah", segment: "LOCAL_RESIDENTIAL", nationality: "Ghanaian", countryCode: "GH" },
  { firstName: "Adjoa", lastName: "Gyamfi", segment: "LOCAL_RESIDENTIAL", nationality: "Ghanaian", countryCode: "GH" },
  { firstName: "Kwadwo", lastName: "Baffour", segment: "LOCAL_RESIDENTIAL", nationality: "Ghanaian", countryCode: "GH" },
  { firstName: "Dede", lastName: "Laryea", segment: "LOCAL_RESIDENTIAL", nationality: "Ghanaian", countryCode: "GH" },
  { firstName: "Solomon", lastName: "Quaye", segment: "LOCAL_RESIDENTIAL", nationality: "Ghanaian", countryCode: "GH" },
  { firstName: "Vivian", lastName: "Mensah", segment: "LOCAL_RESIDENTIAL", nationality: "Ghanaian", countryCode: "GH" },
  { firstName: "Isaac", lastName: "Opoku", segment: "LOCAL_RESIDENTIAL", nationality: "Ghanaian", countryCode: "GH" },
  { firstName: "Rebecca", lastName: "Amoah", segment: "LOCAL_RESIDENTIAL", nationality: "Ghanaian", countryCode: "GH" },
  { firstName: "Kwabena", lastName: "Tuffour", segment: "LOCAL_RESIDENTIAL", nationality: "Ghanaian", countryCode: "GH" },
  { firstName: "Elizabeth", lastName: "Ampofo", segment: "DIASPORA", nationality: "British-Ghanaian", countryCode: "UK" },
  { firstName: "Michael", lastName: "Owusu", segment: "DIASPORA", nationality: "American-Ghanaian", countryCode: "US" },
  { firstName: "Priscilla", lastName: "Danquah", segment: "DIASPORA", nationality: "Canadian-Ghanaian", countryCode: "CA" },
  { firstName: "Frank", lastName: "Yeboah", segment: "DIASPORA", nationality: "German-Ghanaian", countryCode: "DE" },
  { firstName: "Charlotte", lastName: "Asare", segment: "DIASPORA", nationality: "British-Ghanaian", countryCode: "UK" },
  { firstName: "Daniel", lastName: "Acheampong", segment: "DIASPORA", nationality: "American-Ghanaian", countryCode: "US" },
  { firstName: "Josephine", lastName: "Bediako", segment: "DIASPORA", nationality: "Canadian-Ghanaian", countryCode: "CA" },
  { firstName: "Theresa", lastName: "Agyeman", segment: "CORPORATE", nationality: "Ghanaian", countryCode: "GH" },
  { firstName: "Richmond", lastName: "Odame", segment: "CORPORATE", nationality: "Ghanaian", countryCode: "GH" },
  { firstName: "Cynthia", lastName: "Aidoo", segment: "CORPORATE", nationality: "Ghanaian", countryCode: "GH" },
  { firstName: "Ebenezer", lastName: "Kusi", segment: "CORPORATE", nationality: "Ghanaian", countryCode: "GH" },
  { firstName: "Bernard", lastName: "Ansah", segment: "INVESTOR", nationality: "Ghanaian", countryCode: "GH" },
  { firstName: "Alberta", lastName: "Dwamena", segment: "INVESTOR", nationality: "Ghanaian", countryCode: "GH" },
  { firstName: "Justice", lastName: "Amankwah", segment: "INVESTOR", nationality: "Ghanaian", countryCode: "GH" },
  { firstName: "Rita", lastName: "Nyarko", segment: "INVESTOR", nationality: "Nigerian-Ghanaian", countryCode: "GH" },
  { firstName: "Eric", lastName: "Twumasi", segment: "INVESTOR", nationality: "Ghanaian", countryCode: "GH" },
];

function phoneFor(countryCode: string, i: number): string {
  const suffix = String(9000000 + i);
  switch (countryCode) {
    case "UK":
      return `+4420${suffix}`;
    case "US":
      return `+1212${suffix}`;
    case "CA":
      return `+1416${suffix}`;
    case "DE":
      return `+4930${suffix}`;
    default: {
      const prefixes = ["24", "20", "55", "26", "27"];
      return `+233${prefixes[i % prefixes.length]}${suffix}`;
    }
  }
}

// Budget band (USD) by property type bedroom count — mirrors the actual unit price spread
// across developments (Studio ~150-280k, Penthouse/4-bed ~800k-1.5M, Serviced Plot ~80-200k).
function budgetForBedrooms(bedrooms: number, name: string): [number, number] {
  if (name === "Serviced Plot") return [80000, 200000];
  if (name === "Hotel Suite") return [150000, 300000];
  if (bedrooms >= 4) return [800000, 1500000];
  if (bedrooms === 3) return [500000, 900000];
  if (bedrooms === 2) return [320000, 520000];
  if (bedrooms === 1) return [200000, 350000];
  return [150000, 280000];
}

const LEAD_LOST_REASONS = ["NO_BUDGET", "WRONG_TIMING", "NOT_INTERESTED", "UNRESPONSIVE", "CHOSE_COMPETITOR"];

async function main() {
  const [sources, reps, propertyTypes, availableUnits] = await Promise.all([
    prisma.leadSource.findMany({ select: { id: true } }),
    prisma.user.findMany({ where: { salesAgentProfile: { isNot: null } }, select: { id: true } }),
    prisma.propertyType.findMany({ select: { id: true, name: true, bedrooms: true } }),
    prisma.unit.findMany({ where: { status: "AVAILABLE" }, select: { id: true, currentPrice: true, propertyTypeId: true } }),
  ]);
  if (sources.length === 0 || reps.length === 0 || propertyTypes.length === 0) {
    throw new Error("Reference data (lead sources / sales reps / property types) missing — run the main seed first.");
  }

  // Funnel-shaped status distribution across the 30 new leads (indices 0-29).
  const STATUS_PLAN: string[] = [
    ...Array(7).fill("NEW"),
    ...Array(6).fill("CONTACTED"),
    ...Array(5).fill("NURTURING"),
    ...Array(2).fill("NO_RESPONSE"),
    ...Array(4).fill("QUALIFIED"),
    ...Array(3).fill("REAL_OPPORTUNITY"),
    ...Array(3).fill("UNQUALIFIED"),
  ];

  let customerCount = 0;
  let leadCount = 0;
  let opportunityCount = 0;

  for (let i = 0; i < NEW_PEOPLE.length; i++) {
    const person = NEW_PEOPLE[i];
    const rep = reps[i % reps.length];
    const daysAgo = Math.floor(Math.random() * 90) + 1;
    const createdAt = new Date(Date.now() - daysAgo * 86400000);
    const email = `${person.firstName.toLowerCase().replace(/\s+/g, "")}.${person.lastName.toLowerCase().replace(/\s+/g, "")}@example.com`;

    const customer = await prisma.customer.create({
      data: {
        firstName: person.firstName,
        lastName: person.lastName,
        email,
        phone: phoneFor(person.countryCode, i),
        nationality: person.nationality,
        segment: person.segment,
        kycStatus: i % 10 === 0 ? "REJECTED" : i % 3 === 0 ? "PENDING" : "VERIFIED",
        assignedSalesRepId: rep.id,
        createdAt,
      },
    });
    customerCount++;

    const propertyType = propertyTypes[i % propertyTypes.length];
    const [budgetMin, budgetMax] = budgetForBedrooms(propertyType.bedrooms, propertyType.name);
    const status = STATUS_PLAN[i];
    const isQualifiedTrack = status === "QUALIFIED" || status === "REAL_OPPORTUNITY";
    const qualifiedAt = isQualifiedTrack ? new Date(createdAt.getTime() + 2 * 86400000) : null;
    const realOpportunityAt = status === "REAL_OPPORTUNITY" ? new Date(createdAt.getTime() + 6 * 86400000) : null;
    const isUnqualified = status === "UNQUALIFIED";

    const lead = await prisma.lead.create({
      data: {
        customerId: customer.id,
        sourceId: sources[i % sources.length].id,
        assignedToId: rep.id,
        budgetMin,
        budgetMax,
        currency: "USD",
        propertyTypeId: propertyType.id,
        preferredLocation: null,
        score: status === "REAL_OPPORTUNITY" ? 85 : status === "QUALIFIED" ? 70 : status === "NURTURING" ? 40 : status === "CONTACTED" ? 25 : isUnqualified ? 10 : 15,
        bantScore: isQualifiedTrack ? 75 : 30,
        status: status as never,
        pipelineStageId: await leadStageId(status),
        qualificationStatus: isQualifiedTrack ? "QUALIFIED" : "UNQUALIFIED",
        qualifiedAt,
        realOpportunityAt,
        lostReason: isUnqualified ? (LEAD_LOST_REASONS[i % LEAD_LOST_REASONS.length] as never) : null,
        lostReasonNote: isUnqualified ? "Captured during pipeline review." : null,
        disqualifiedAt: isUnqualified ? new Date(createdAt.getTime() + 3 * 86400000) : null,
        createdAt,
      },
    });
    leadCount++;

    if (isQualifiedTrack) {
      const matchingUnits = availableUnits.filter((u) => u.propertyTypeId === propertyType.id);
      const unit = (matchingUnits.length > 0 ? matchingUnits : availableUnits)[i % (matchingUnits.length > 0 ? matchingUnits.length : availableUnits.length)];
      const stage = status === "REAL_OPPORTUNITY" ? (i % 2 === 0 ? "SITE_VISIT" : "NEGOTIATION") : i % 2 === 0 ? "QUALIFIED" : "SITE_VISIT";

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
          expectedCloseDate: new Date(Date.now() + (30 + i) * 86400000),
          ownerId: rep.id,
          createdAt: qualifiedAt ?? createdAt,
        },
      });
      opportunityCount++;
    }
  }

  console.log(`Added ${customerCount} customers, ${leadCount} leads, ${opportunityCount} opportunities.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
