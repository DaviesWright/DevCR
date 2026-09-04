import { PrismaClient } from "@prisma/client";
import { CX_PLAYBOOK_TEMPLATES } from "./data/cx-playbook-templates";
import { CX_DEPARTMENT_INTERACTIONS } from "./data/cx-department-interactions";
import { seedSampleClients } from "./seed-sample-clients";
import { BADGE_DEFINITIONS, backfillHistoricalPoints } from "../src/lib/gamification";

const prisma = new PrismaClient();

// Resolves PipelineStage.id for a literal OpportunityStage/LeadStatus key, cached per-run to
// avoid N+1 lookups since this script creates/updates many Opportunity and Lead records.
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

async function main() {
  console.log("Seeding...");

  const salesRole = await prisma.role.create({ data: { name: "Sales Agent", isSystem: true } });
  const managerRole = await prisma.role.create({ data: { name: "Sales Manager", isSystem: true } });
  const salesDept = await prisma.department.create({ data: { name: "Sales" } });

  const jane = await prisma.user.create({
    data: {
      firstName: "Jane",
      lastName: "Agent",
      email: "jane.agent@devtraco.com",
      passwordHash: "seed-only-not-a-real-hash",
      roleId: salesRole.id,
      departmentId: salesDept.id,
    },
  });
  const michael = await prisma.user.create({
    data: {
      firstName: "Michael",
      lastName: "Osei",
      email: "michael.osei@devtraco.com",
      passwordHash: "seed-only-not-a-real-hash",
      roleId: managerRole.id,
      departmentId: salesDept.id,
    },
  });

  const janeAgent = await prisma.salesAgent.create({
    data: { userId: jane.id, agentCode: "AG-001", commissionRate: 3 },
  });
  await prisma.salesAgent.create({
    data: { userId: michael.id, agentCode: "AG-002", commissionRate: 2.5 },
  });

  // Exact tag taxonomy from Devtraco_Sales_Playbook_v1.0.docx §1.3/§1.4 — this is
  // the primary data point for measuring marketing ROI and channel performance,
  // so the tags must match what Sales actually selects, not a paraphrase.
  const websiteSource = await prisma.leadSource.create({ data: { name: "Website" } });
  const referralSource = await prisma.leadSource.create({ data: { name: "Referral" } });
  await prisma.leadSource.create({ data: { name: "Social Media - Facebook" } });
  await prisma.leadSource.create({ data: { name: "Social Media - Instagram" } });
  await prisma.leadSource.create({ data: { name: "Walk-in" } });
  await prisma.leadSource.create({ data: { name: "Event / Exhibition" } });
  await prisma.leadSource.create({ data: { name: "Google Ads" } });
  await prisma.leadSource.create({ data: { name: "Agent / Broker" } });
  await prisma.leadSource.create({ data: { name: "Direct Enquiry" } });

  const propType3bed = await prisma.propertyType.create({
    data: { name: "3-Bedroom Townhouse", bedrooms: 3, bathrooms: 3, builtAreaSqm: 165 },
  });
  const propType4bed = await prisma.propertyType.create({
    data: { name: "4-Bedroom Detached", bedrooms: 4, bathrooms: 4, builtAreaSqm: 220 },
  });

  const development = await prisma.development.create({
    data: {
      name: "Airport Hills Residences",
      projectCode: "AHR-001",
      location: "Accra, Ghana",
      region: "Greater Accra",
      status: "SELLING",
      totalUnits: 240,
    },
  });

  const block = await prisma.block.create({ data: { developmentId: development.id, name: "Block A" } });
  const floor = await prisma.floor.create({ data: { blockId: block.id, level: 3 } });

  const unitAvailable = await prisma.unit.create({
    data: {
      developmentId: development.id,
      blockId: block.id,
      floorId: floor.id,
      propertyTypeId: propType3bed.id,
      unitNumber: "A-301",
      currentPrice: 850000,
      status: "AVAILABLE",
    },
  });
  const unitReserved = await prisma.unit.create({
    data: {
      developmentId: development.id,
      blockId: block.id,
      floorId: floor.id,
      propertyTypeId: propType4bed.id,
      unitNumber: "A-302",
      currentPrice: 1200000,
      status: "RESERVED",
    },
  });
  const unitSold = await prisma.unit.create({
    data: {
      developmentId: development.id,
      blockId: block.id,
      floorId: floor.id,
      propertyTypeId: propType3bed.id,
      unitNumber: "A-203",
      currentPrice: 850000,
      status: "SOLD",
    },
  });
  await prisma.unit.createMany({
    data: Array.from({ length: 5 }, (_, i) => ({
      developmentId: development.id,
      blockId: block.id,
      floorId: floor.id,
      propertyTypeId: propType3bed.id,
      unitNumber: `A-40${i + 1}`,
      currentPrice: 875000,
      status: "AVAILABLE" as const,
    })),
  });

  // A second real Devtraco development (Roman Ridge, Accra — "a more affordable inner-city
  // option") so sample data and reports span more than one project, not just Airport Hills.
  const propTypeStudio = await prisma.propertyType.create({
    data: { name: "Studio Apartment", bedrooms: 0, bathrooms: 1, builtAreaSqm: 38 },
  });
  const propType2bed = await prisma.propertyType.create({
    data: { name: "2-Bedroom Apartment", bedrooms: 2, bathrooms: 2, builtAreaSqm: 95 },
  });
  const novaDevelopment = await prisma.development.create({
    data: {
      name: "Nova",
      projectCode: "NOVA-001",
      location: "Roman Ridge, Accra",
      region: "Greater Accra",
      status: "SELLING",
      totalUnits: 180,
    },
  });
  const novaBlock = await prisma.block.create({ data: { developmentId: novaDevelopment.id, name: "Tower 1" } });
  // Unit numbers follow the project-code + floor + room convention used across all
  // Devtraco developments below: NOV101 = Nova, floor 1, room 01.
  const novaFloor1 = await prisma.floor.create({ data: { blockId: novaBlock.id, level: 1 } });
  const novaFloor2 = await prisma.floor.create({ data: { blockId: novaBlock.id, level: 2 } });
  await prisma.unit.createMany({
    data: [
      { developmentId: novaDevelopment.id, blockId: novaBlock.id, floorId: novaFloor1.id, propertyTypeId: propTypeStudio.id, unitNumber: "NOV101", currentPrice: 380000, status: "AVAILABLE" as const },
      { developmentId: novaDevelopment.id, blockId: novaBlock.id, floorId: novaFloor1.id, propertyTypeId: propTypeStudio.id, unitNumber: "NOV102", currentPrice: 380000, status: "AVAILABLE" as const },
      { developmentId: novaDevelopment.id, blockId: novaBlock.id, floorId: novaFloor2.id, propertyTypeId: propType2bed.id, unitNumber: "NOV201", currentPrice: 520000, status: "AVAILABLE" as const },
      { developmentId: novaDevelopment.id, blockId: novaBlock.id, floorId: novaFloor2.id, propertyTypeId: propType2bed.id, unitNumber: "NOV202", currentPrice: 520000, status: "AVAILABLE" as const },
      { developmentId: novaDevelopment.id, blockId: novaBlock.id, floorId: novaFloor2.id, propertyTypeId: propType2bed.id, unitNumber: "NOV203", currentPrice: 550000, status: "AVAILABLE" as const },
    ],
  });

  // The rest of Devtraco Group's real project portfolio (shared directly by the user), each
  // with its own unit-numbering convention: {projectCode}{floor}{room, zero-padded to 2} —
  // e.g. ADD101 = The Address, floor 1, room 01; EDG2210 = The Edge, floor 22, room 10.
  const propType1bed = await prisma.propertyType.create({
    data: { name: "1-Bedroom Apartment", bedrooms: 1, bathrooms: 1, builtAreaSqm: 65 },
  });
  const propTypeHotelSuite = await prisma.propertyType.create({
    data: { name: "Hotel Suite", bedrooms: 1, bathrooms: 1, builtAreaSqm: 45 },
  });
  const propTypePenthouse = await prisma.propertyType.create({
    data: { name: "Penthouse", bedrooms: 4, bathrooms: 5, builtAreaSqm: 320 },
  });
  // Woodlands sells serviced land plots, not built units — bedrooms/bathrooms are 0 and
  // builtAreaSqm holds the plot's land size rather than a built-up area.
  const propTypeServicedPlot = await prisma.propertyType.create({
    data: { name: "Serviced Plot", bedrooms: 0, bathrooms: 0, builtAreaSqm: 600 },
  });

  type UnitSpec = { floor: number; room: number; propertyTypeId: string; price: number; status?: "AVAILABLE" | "RESERVED" | "SOLD" };
  type DevelopmentSpec = { name: string; code: string; location: string; totalUnits: number; blockName: string; units: UnitSpec[] };

  const REAL_DEVELOPMENTS: DevelopmentSpec[] = [
    {
      name: "The Edge",
      code: "EDG",
      location: "Cantonments, Accra",
      totalUnits: 150,
      blockName: "Tower 1",
      units: [
        { floor: 22, room: 10, propertyTypeId: propType2bed.id, price: 320000 },
        { floor: 22, room: 11, propertyTypeId: propType2bed.id, price: 320000, status: "RESERVED" },
        { floor: 10, room: 5, propertyTypeId: propType3bed.id, price: 410000 },
        { floor: 10, room: 6, propertyTypeId: propType3bed.id, price: 410000 },
      ],
    },
    {
      name: "Henrietta's Residences",
      code: "HEN",
      location: "East Legon, Accra",
      totalUnits: 60,
      blockName: "Block A",
      units: [
        { floor: 1, room: 1, propertyTypeId: propType1bed.id, price: 145000 },
        { floor: 1, room: 2, propertyTypeId: propType1bed.id, price: 145000 },
        { floor: 2, room: 3, propertyTypeId: propType2bed.id, price: 210000, status: "SOLD" },
      ],
    },
    {
      name: "The Address",
      code: "ADD",
      location: "Airport Residential Area, Accra",
      totalUnits: 200,
      blockName: "Tower 1",
      units: [
        { floor: 1, room: 1, propertyTypeId: propType3bed.id, price: 480000 },
        { floor: 1, room: 2, propertyTypeId: propType3bed.id, price: 480000 },
        { floor: 5, room: 28, propertyTypeId: propTypePenthouse.id, price: 950000 },
        { floor: 5, room: 29, propertyTypeId: propType4bed.id, price: 720000, status: "RESERVED" },
      ],
    },
    {
      name: "The Pelican Hotel",
      code: "PEL",
      location: "Osu, Accra",
      totalUnits: 80,
      blockName: "Main Wing",
      units: [
        { floor: 3, room: 1, propertyTypeId: propTypeHotelSuite.id, price: 165000 },
        { floor: 3, room: 2, propertyTypeId: propTypeHotelSuite.id, price: 165000 },
        { floor: 6, room: 4, propertyTypeId: propTypeHotelSuite.id, price: 185000, status: "SOLD" },
      ],
    },
    {
      name: "ARLO Cantonments",
      code: "ARL",
      location: "Cantonments, Accra",
      totalUnits: 200,
      blockName: "Tower A",
      units: [
        { floor: 4, room: 1, propertyTypeId: propType3bed.id, price: 520000 },
        { floor: 4, room: 2, propertyTypeId: propType4bed.id, price: 680000 },
        { floor: 9, room: 3, propertyTypeId: propTypePenthouse.id, price: 1100000 },
      ],
    },
    {
      name: "Forte",
      code: "FRT",
      location: "Spintex, Accra",
      totalUnits: 120,
      blockName: "Block A",
      units: [
        { floor: 1, room: 1, propertyTypeId: propType1bed.id, price: 130000 },
        { floor: 1, room: 2, propertyTypeId: propType2bed.id, price: 190000 },
        { floor: 3, room: 3, propertyTypeId: propType2bed.id, price: 195000, status: "RESERVED" },
      ],
    },
    {
      name: "The Niiyo",
      code: "NII",
      location: "Tema, Greater Accra",
      totalUnits: 100,
      blockName: "Block A",
      units: [
        { floor: 1, room: 1, propertyTypeId: propTypeStudio.id, price: 78000 },
        { floor: 2, room: 2, propertyTypeId: propType1bed.id, price: 135000 },
        { floor: 2, room: 3, propertyTypeId: propType2bed.id, price: 205000 },
      ],
    },
    {
      name: "Avant Garde",
      code: "AVG",
      location: "Airport Hills, Accra",
      totalUnits: 65,
      blockName: "Block A",
      units: [
        { floor: 1, room: 1, propertyTypeId: propType3bed.id, price: 460000 },
        { floor: 2, room: 2, propertyTypeId: propType4bed.id, price: 640000, status: "SOLD" },
      ],
    },
    {
      name: "Woodlands",
      code: "WDL",
      location: "Trasacco Valley, Accra",
      totalUnits: 400,
      blockName: "Plots A",
      units: [
        { floor: 1, room: 1, propertyTypeId: propTypeServicedPlot.id, price: 225000 },
        { floor: 1, room: 2, propertyTypeId: propTypeServicedPlot.id, price: 305000 },
      ],
    },
    {
      name: "Lotus",
      code: "LOT",
      location: "Adjiringanor, Accra",
      totalUnits: 200,
      blockName: "Block A",
      units: [
        { floor: 1, room: 1, propertyTypeId: propType1bed.id, price: 140000 },
        { floor: 2, room: 2, propertyTypeId: propType2bed.id, price: 215000 },
        { floor: 2, room: 3, propertyTypeId: propType2bed.id, price: 215000, status: "RESERVED" },
      ],
    },
  ];

  for (const dev of REAL_DEVELOPMENTS) {
    const development = await prisma.development.create({
      data: {
        name: dev.name,
        projectCode: `${dev.code}-001`,
        location: dev.location,
        region: "Greater Accra",
        status: "SELLING",
        totalUnits: dev.totalUnits,
      },
    });
    const block = await prisma.block.create({ data: { developmentId: development.id, name: dev.blockName } });

    const floorIdByLevel = new Map<number, string>();
    for (const level of [...new Set(dev.units.map((u) => u.floor))]) {
      const floor = await prisma.floor.create({ data: { blockId: block.id, level } });
      floorIdByLevel.set(level, floor.id);
    }

    await prisma.unit.createMany({
      data: dev.units.map((u) => ({
        developmentId: development.id,
        blockId: block.id,
        floorId: floorIdByLevel.get(u.floor)!,
        propertyTypeId: u.propertyTypeId,
        unitNumber: `${dev.code}${u.floor}${String(u.room).padStart(2, "0")}`,
        currentPrice: u.price,
        status: (u.status ?? "AVAILABLE") as never,
      })),
    });
  }

  const customerKwame = await prisma.customer.create({
    data: {
      firstName: "Kwame",
      lastName: "Mensah",
      email: "kwame.mensah@example.com",
      phone: "+233241234567",
      nationality: "Ghanaian",
      segment: "LOCAL_RESIDENTIAL",
      kycStatus: "VERIFIED",
      assignedSalesRepId: jane.id,
    },
  });
  const customerAma = await prisma.customer.create({
    data: {
      firstName: "Ama",
      lastName: "Owusu",
      email: "ama.owusu@example.com",
      phone: "+233201234568",
      nationality: "Ghanaian",
      segment: "INVESTOR",
      kycStatus: "PENDING",
      assignedSalesRepId: jane.id,
    },
  });
  const customerJohn = await prisma.customer.create({
    data: {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "+233551234569",
      nationality: "British",
      segment: "DIASPORA",
      kycStatus: "PENDING",
      assignedSalesRepId: michael.id,
    },
  });

  const leadJohn = await prisma.lead.create({
    data: {
      customerId: customerJohn.id,
      sourceId: websiteSource.id,
      assignedToId: jane.id,
      budgetMin: 700000,
      budgetMax: 900000,
      preferredLocation: "Airport Hills",
      propertyTypeId: propType3bed.id,
      score: 85,
      status: "QUALIFIED",
      pipelineStageId: await leadStageId("QUALIFIED"),
      bantScore: 78,
      qualificationStatus: "QUALIFIED",
      qualifiedAt: new Date(),
      notes: "Interested in a 3-bedroom unit, cash buyer, diaspora client visiting next month.",
      createdAt: new Date(Date.now() - 4 * 86400000),
    },
  });
  const leadAma = await prisma.lead.create({
    data: {
      customerId: customerAma.id,
      sourceId: referralSource.id,
      assignedToId: jane.id,
      budgetMin: 1000000,
      budgetMax: 1300000,
      preferredLocation: "Airport Hills",
      propertyTypeId: propType4bed.id,
      score: 45,
      status: "CONTACTED",
      pipelineStageId: await leadStageId("CONTACTED"),
      bantScore: 42,
      qualificationStatus: "REVIEW",
      notes: null,
      createdAt: new Date(Date.now() - 1 * 86400000 - 6 * 3600000),
    },
  });
  await prisma.lead.create({
    data: {
      customerId: customerKwame.id,
      sourceId: websiteSource.id,
      score: 20,
      status: "NEW",
      pipelineStageId: await leadStageId("NEW"),
      bantScore: 15,
      qualificationStatus: "UNQUALIFIED",
    },
  });

  await prisma.leadActivity.createMany({
    data: [
      { leadId: leadJohn.id, type: "SITE_VISIT", description: "Toured Block A show unit", createdById: jane.id, occurredAt: new Date(Date.now() - 2 * 86400000) },
      { leadId: leadJohn.id, type: "CALL", description: "Discussed payment plan options", createdById: jane.id, occurredAt: new Date(Date.now() - 1 * 86400000) },
      { leadId: leadAma.id, type: "EMAIL", description: "Sent brochure and pricing sheet", createdById: jane.id, occurredAt: new Date(Date.now() - 3 * 3600000) },
    ],
  });

  await prisma.bantScore.create({
    data: {
      leadId: leadJohn.id,
      userId: jane.id,
      budgetScore: 90,
      authorityScore: 80,
      needScore: 75,
      timelineScore: 65,
      fitScore: 82,
      totalScore: 78,
      status: "QUALIFIED",
      notes: "Confirmed budget with proof of funds.",
    },
  });
  await prisma.behavioralScore.create({
    data: {
      leadId: leadJohn.id,
      emailOpens: 6,
      emailClicks: 3,
      siteVisits: 2,
      documentViews: 4,
      meetingsAttended: 1,
      callsCompleted: 2,
      totalScore: 71,
      engagementLevel: "HIGH",
      lastActivityAt: new Date(Date.now() - 1 * 86400000),
    },
  });
  await prisma.behavioralScore.create({
    data: {
      leadId: leadAma.id,
      emailOpens: 1,
      siteVisits: 0,
      totalScore: 18,
      engagementLevel: "LOW",
    },
  });

  await prisma.opportunity.create({
    data: {
      leadId: leadJohn.id,
      customerId: customerJohn.id,
      unitId: unitAvailable.id,
      expectedValue: 850000,
      stage: "NEGOTIATION",
      pipelineStageId: await oppStageId("NEGOTIATION"),
      probability: 70,
      ownerId: jane.id,
    },
  });
  await prisma.opportunity.create({
    data: {
      leadId: leadAma.id,
      customerId: customerAma.id,
      unitId: unitReserved.id,
      expectedValue: 1200000,
      stage: "RESERVATION",
      pipelineStageId: await oppStageId("RESERVATION"),
      probability: 50,
      ownerId: jane.id,
    },
  });
  await prisma.opportunity.create({
    data: {
      customerId: customerKwame.id,
      expectedValue: 650000,
      stage: "PROSPECTING",
      pipelineStageId: await oppStageId("PROSPECTING"),
      probability: 20,
      ownerId: michael.id,
    },
  });

  // Reservation expiring soon — feeds the header/dashboard alerts.
  await prisma.reservation.create({
    data: {
      unitId: unitReserved.id,
      customerId: customerAma.id,
      reservationFee: 20000,
      expiryDate: new Date(Date.now() + 3 * 86400000),
      status: "ACTIVE",
    },
  });

  const sale = await prisma.sale.create({
    data: {
      unitId: unitSold.id,
      customerId: customerKwame.id,
      salePrice: 850000,
      status: "ACTIVE",
    },
  });
  const kwameTotalCommission = 850000 * 0.03;
  await prisma.commission.createMany({
    data: [
      { saleId: sale.id, agentId: janeAgent.id, tranche: "T1", percentage: 80, amount: kwameTotalCommission * 0.8, status: "PENDING", createdAt: new Date(Date.now() - 9 * 86400000) },
      { saleId: sale.id, agentId: janeAgent.id, tranche: "T2", percentage: 10, amount: kwameTotalCommission * 0.1, status: "PENDING", createdAt: new Date(Date.now() - 9 * 86400000) },
      { saleId: sale.id, agentId: janeAgent.id, tranche: "T3", percentage: 10, amount: kwameTotalCommission * 0.1, status: "PENDING", createdAt: new Date(Date.now() - 9 * 86400000) },
    ],
  });
  // Deposit confirmed 35 days ago, SPA still not signed — past the 30-day grace period, so this
  // exercises the SPA Delay Protocol's escalated state with real seed data.
  await prisma.saleMilestoneChecklist.create({
    data: { saleId: sale.id, depositConfirmedAt: new Date(Date.now() - 35 * 86400000) },
  });
  await prisma.clientHandover.create({
    data: {
      saleId: sale.id,
      customerId: customerKwame.id,
      consultantId: jane.id,
      // Backdated past the Sales Playbook's 24h CX-acknowledgement SLA —
      // exercises the "Ack overdue" badge with real seed data.
      notifiedAt: new Date(Date.now() - 30 * 3600000),
    },
  });

  const paymentPlan = await prisma.paymentPlan.create({
    data: {
      saleId: sale.id,
      totalAmount: 850000,
      downPayment: 170000,
      status: "ACTIVE",
    },
  });
  await prisma.paymentSchedule.create({
    data: {
      paymentPlanId: paymentPlan.id,
      installmentNo: 1,
      dueDate: new Date(Date.now() - 5 * 86400000),
      amountDue: 113333,
      status: "OVERDUE",
    },
  });
  await prisma.paymentSchedule.create({
    data: {
      paymentPlanId: paymentPlan.id,
      installmentNo: 2,
      dueDate: new Date(Date.now() + 25 * 86400000),
      amountDue: 113333,
      status: "PENDING",
    },
  });

  const plumbingCategory = await prisma.complaintCategory.create({
    data: { name: "Plumbing", defaultPriority: "HIGH", responseSlaHours: 4, resolutionSlaHours: 24 },
  });
  const billingCategory = await prisma.complaintCategory.create({
    data: { name: "Billing", defaultPriority: "MEDIUM", responseSlaHours: 24, resolutionSlaHours: 72 },
  });

  const plumbingComplaint = await prisma.complaint.create({
    data: {
      customerId: customerKwame.id,
      unitId: unitSold.id,
      categoryId: plumbingCategory.id,
      subject: "Leaking kitchen tap",
      description: "Tap has been leaking since move-in.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      assignedToId: michael.id,
      openedAt: new Date(Date.now() - 3 * 86400000),
    },
  });
  await prisma.complaintSLA.create({
    data: {
      complaintId: plumbingComplaint.id,
      // Overdue on purpose — exercises the SLA-breach KPI and badge with real seed data.
      responseDueAt: new Date(Date.now() - 3 * 86400000 + 4 * 3600000),
      resolutionDueAt: new Date(Date.now() - 2 * 86400000),
      respondedAt: new Date(Date.now() - 3 * 86400000 + 3 * 3600000),
    },
  });
  await prisma.complaintUpdate.create({
    data: {
      complaintId: plumbingComplaint.id,
      note: "Plumber dispatched, awaiting parts for the mixer valve.",
      updatedById: michael.id,
    },
  });
  await prisma.escalation.create({
    data: {
      complaintId: plumbingComplaint.id,
      reason: "Resolution SLA breached — parts delay from supplier.",
      escalatedFromId: michael.id,
      escalatedToId: jane.id,
    },
  });

  const billingComplaint = await prisma.complaint.create({
    data: {
      customerId: customerKwame.id,
      unitId: unitSold.id,
      categoryId: billingCategory.id,
      subject: "Service charge query",
      description: "Question about Q1 service charge breakdown.",
      priority: "LOW",
      status: "OPEN",
    },
  });
  await prisma.complaintSLA.create({
    data: {
      complaintId: billingComplaint.id,
      responseDueAt: new Date(Date.now() + 22 * 3600000),
      resolutionDueAt: new Date(Date.now() + 68 * 3600000),
    },
  });

  await prisma.handover.create({
    data: {
      unitId: unitSold.id,
      customerId: customerKwame.id,
      status: "COMPLETED",
      scheduledAt: new Date(Date.now() - 30 * 86400000),
      completedAt: new Date(Date.now() - 29 * 86400000),
      conductedById: jane.id,
    },
  });

  // CX Workflow: State 2 Operational Playbook — 11 templates, each with its own grouped
  // Process Execution + Quality & Control steps, transcribed verbatim in cx-playbook-templates.ts.
  for (const tpl of CX_PLAYBOOK_TEMPLATES) {
    const template = await prisma.checklistTemplate.create({
      data: {
        stageNumber: tpl.stageNumber,
        title: tpl.title,
        goal: tpl.goal,
        trigger: tpl.trigger,
        owner: tpl.owner,
        sla: tpl.sla,
        isOpenDesignItem: tpl.isOpenDesignItem ?? false,
      },
    });
    let order = 0;
    for (const group of tpl.steps) {
      for (const item of group.items) {
        order += 1;
        await prisma.checklistStep.create({
          data: {
            templateId: template.id,
            groupLabel: group.groupLabel,
            order,
            kind: item.kind,
            label: item.label,
            notificationRecipient: item.notificationRecipient,
            notificationAction: item.notificationAction,
            crossDepartmental: group.crossDepartmental,
          },
        });
      }
    }
  }

  for (const dept of CX_DEPARTMENT_INTERACTIONS) {
    let order = 0;
    for (const row of dept.rows) {
      order += 1;
      await prisma.departmentInteraction.create({
        data: {
          department: dept.department,
          keyContact: dept.keyContact,
          interactionType: row.interactionType,
          frequency: row.frequency,
          keyActivities: row.keyActivities,
          order,
        },
      });
    }
  }

  const templates = await prisma.checklistTemplate.findMany();
  const templateByStage = new Map(templates.map((t) => [t.stageNumber, t]));

  // Demo run: Stage 08 (Complaints) in progress against the seeded plumbing complaint —
  // some steps ticked, some quality checks still open, to exercise the progress/flag UI.
  const complaintsTemplate = templateByStage.get(8)!;
  const complaintsSteps = await prisma.checklistStep.findMany({ where: { templateId: complaintsTemplate.id }, orderBy: { order: "asc" } });
  const complaintsRun = await prisma.checklistRun.create({
    data: {
      templateId: complaintsTemplate.id,
      customerId: customerKwame.id,
      relatedEntityType: "COMPLAINT",
      relatedEntityId: plumbingComplaint.id,
      startedById: michael.id,
      startedAt: new Date(Date.now() - 2 * 86400000),
    },
  });
  for (const step of complaintsSteps.slice(0, 3)) {
    await prisma.checklistStepCompletion.create({
      data: { runId: complaintsRun.id, stepId: step.id, completed: true, completedAt: new Date(), completedById: michael.id },
    });
  }

  // Demo run: Stage 04 (Handover) fully completed against the seeded (already-completed)
  // property handover.
  const handoverTemplate = templateByStage.get(4)!;
  const handoverSteps = await prisma.checklistStep.findMany({ where: { templateId: handoverTemplate.id }, orderBy: { order: "asc" } });
  const handoverRun = await prisma.checklistRun.create({
    data: {
      templateId: handoverTemplate.id,
      customerId: customerKwame.id,
      relatedEntityType: "HANDOVER",
      startedById: jane.id,
      startedAt: new Date(Date.now() - 30 * 86400000),
      completedAt: new Date(Date.now() - 29 * 86400000),
    },
  });
  for (const step of handoverSteps) {
    await prisma.checklistStepCompletion.create({
      data: { runId: handoverRun.id, stepId: step.id, completed: true, completedAt: new Date(Date.now() - 29 * 86400000), completedById: jane.id },
    });
  }

  // Sample data roster — ~17 more customers spanning every Lead/Opportunity stage and buyer
  // persona (prisma/data/sample-clients.ts), so reports and Marketing segments have real volume
  // to review beyond the four original demo customers.
  const sampleClients = await seedSampleClients({
    prisma, jane, michael, janeAgent, websiteSource, referralSource, propType3bed, propType4bed, propTypeStudio, propType2bed, plumbingCategory, billingCategory,
  });
  const sampleClientIdsBySegment = (segment: "DIASPORA" | "INVESTOR" | "CORPORATE") =>
    sampleClients.filter((c) => c.segment === segment).map((c) => c.id);

  // Marketing module demo data (docs/marketing-spec.md) — personas, a segment, a template, a
  // sent campaign, and a journey partway through, closing the loop with the Real Opportunities
  // capture from the worked example in docs/real-opportunities-spec.md §6.
  const diasporaPersona = await prisma.marketingPersona.create({
    data: {
      name: "Diaspora — Returning Homeowner",
      description: "UK/US-based Ghanaians relocating home within 1-2 years, cash-ready.",
      suggestedChannels: "WhatsApp, email newsletter",
    },
  });
  await prisma.marketingPersona.create({
    data: {
      name: "Local — Young Professional First-Time Buyer",
      description: "Accra-based professionals buying their first home, mortgage-financed.",
    },
  });

  await prisma.lead.update({
    where: { id: leadJohn.id },
    data: {
      status: "REAL_OPPORTUNITY",
      pipelineStageId: await leadStageId("REAL_OPPORTUNITY"),
      realOpportunityAt: new Date(Date.now() - 1 * 86400000),
      suspectedPersona: "Diaspora — Returning Homeowner",
      suspectedPersonaNote: "Mentioned relocating back in 18 months, cash-ready.",
    },
  });
  await prisma.leadPersonaSignal.create({
    data: {
      leadId: leadJohn.id,
      personaId: diasporaPersona.id,
      suspectedPersona: "Diaspora — Returning Homeowner",
      note: "Mentioned relocating back in 18 months, cash-ready.",
      capturedAt: new Date(Date.now() - 1 * 86400000),
    },
  });

  await prisma.customer.update({
    where: { id: customerJohn.id },
    data: { engagementScore: 71, sentiment: "POSITIVE" },
  });
  await prisma.customer.update({
    where: { id: customerAma.id },
    data: { engagementScore: 18, sentiment: "NEUTRAL" },
  });

  const diasporaSegment = await prisma.marketingSegment.create({
    data: {
      name: "Diaspora Prospects",
      description: "All Diaspora-segment customers.",
      criteria: { buyerSegment: "DIASPORA" },
      createdById: michael.id,
    },
  });
  const diasporaMemberIds = [customerJohn.id, ...sampleClientIdsBySegment("DIASPORA")];
  await prisma.marketingSegmentMember.createMany({
    data: diasporaMemberIds.map((customerId) => ({ segmentId: diasporaSegment.id, customerId })),
  });
  await prisma.marketingSegment.update({
    where: { id: diasporaSegment.id },
    data: { memberCount: diasporaMemberIds.length, lastComputedAt: new Date() },
  });

  const engagedSegment = await prisma.marketingSegment.create({
    data: {
      name: "Recently Engaged",
      description: "Engagement score 50+.",
      criteria: { minEngagementScore: 50 },
      createdById: michael.id,
    },
  });
  await prisma.marketingSegmentMember.create({ data: { segmentId: engagedSegment.id, customerId: customerJohn.id } });
  await prisma.marketingSegment.update({
    where: { id: engagedSegment.id },
    data: { memberCount: 1, lastComputedAt: new Date() },
  });

  const welcomeTemplate = await prisma.messageTemplate.create({
    data: {
      name: "Diaspora Welcome Email",
      channel: "EMAIL",
      subject: "Welcome home — let's plan your move",
      bodyText: "Hi there, thanks for your interest in Airport Hills Residences. Let's schedule a virtual tour.",
    },
  });

  const welcomeCampaign = await prisma.marketingCampaign.create({
    data: {
      name: "Diaspora Welcome Blast",
      channel: "EMAIL",
      segmentId: diasporaSegment.id,
      personaId: diasporaPersona.id,
      templateId: welcomeTemplate.id,
      objective: "Welcome diaspora prospects and offer a virtual tour.",
      status: "ACTIVE",
      startDate: new Date(Date.now() - 2 * 86400000),
      createdById: michael.id,
    },
  });
  await prisma.marketingMessage.create({
    data: {
      customerId: customerJohn.id,
      campaignId: welcomeCampaign.id,
      channel: "EMAIL",
      templateId: welcomeTemplate.id,
      subject: welcomeTemplate.subject!,
      body: `${welcomeTemplate.bodyText} (simulated — no email provider configured).`,
      status: "OPENED",
      sentAt: new Date(Date.now() - 2 * 86400000),
      deliveredAt: new Date(Date.now() - 2 * 86400000 + 60000),
      openedAt: new Date(Date.now() - 1 * 86400000),
    },
  });
  await prisma.engagementEvent.create({
    data: { customerId: customerJohn.id, eventType: "CAMPAIGN_SENT", channel: "EMAIL", source: welcomeCampaign.name, occurredAt: new Date(Date.now() - 2 * 86400000) },
  });
  await prisma.engagementEvent.create({
    data: { customerId: customerJohn.id, eventType: "EMAIL_OPEN", channel: "EMAIL", source: welcomeCampaign.name, occurredAt: new Date(Date.now() - 1 * 86400000) },
  });
  await prisma.customer.update({
    where: { id: customerJohn.id },
    data: { lastMarketingContactAt: new Date(Date.now() - 2 * 86400000) },
  });

  const nurtureJourney = await prisma.marketingJourney.create({
    data: {
      name: "Diaspora Nurture Series",
      description: "Welcome email, then a WhatsApp follow-up.",
      status: "ACTIVE",
      segmentId: diasporaSegment.id,
      createdById: michael.id,
      steps: {
        create: [
          {
            stepOrder: 1,
            name: "Welcome email",
            actionType: "SEND_EMAIL",
            actionConfig: { subject: "Welcome home", body: "Thanks for your interest — let's plan your visit." },
          },
          {
            stepOrder: 2,
            name: "WhatsApp follow-up",
            actionType: "SEND_WHATSAPP",
            actionConfig: { body: "Just checking in — happy to answer any questions about financing or the move-in timeline." },
            waitHours: 48,
          },
        ],
      },
    },
  });
  const nurtureSteps = await prisma.marketingJourneyStep.findMany({ where: { journeyId: nurtureJourney.id }, orderBy: { stepOrder: "asc" } });
  await prisma.customerJourney.create({
    data: {
      customerId: customerJohn.id,
      journeyId: nurtureJourney.id,
      currentStepId: nurtureSteps[0].id,
      enteredAt: new Date(Date.now() - 2 * 86400000),
      lastActivityAt: new Date(Date.now() - 2 * 86400000),
    },
  });

  // Omnichannel demo data — a preferred channel plus a couple of Phone/In-Person touchpoints
  // (logged via the existing generic Interaction model) so the channel diagram isn't empty.
  await prisma.customerPreference.create({
    data: { customerId: customerJohn.id, preferredContact: "EMAIL", marketingOptIn: true },
  });
  await prisma.interaction.create({
    data: {
      type: "CALL",
      subject: "Financing pre-qualification call",
      notes: "Walked through mortgage pre-qualification options for the diaspora buyer program.",
      userId: jane.id,
      relatedEntityType: "CUSTOMER",
      relatedEntityId: customerJohn.id,
      occurredAt: new Date(Date.now() - 6 * 3600000),
    },
  });
  await prisma.interaction.create({
    data: {
      type: "MEETING",
      subject: "Airport Hills show unit tour",
      notes: "Toured Block A show unit and discussed the 3-bedroom floor plan in person.",
      userId: jane.id,
      relatedEntityType: "CUSTOMER",
      relatedEntityId: customerJohn.id,
      occurredAt: new Date(Date.now() - 26 * 3600000),
    },
  });

  // ================================================================================
  // Sample automation library — personas, segments (including two dynamically-computed
  // triggers: lapsed reservations, real estate's equivalent of an abandoned cart, and
  // birthdays via Customer.dateOfBirth), multi-channel message templates, multi-channel
  // campaigns, and end-to-end journeys covering welcome / recovery / birthday / nurture.
  // ================================================================================

  const investorPersona = await prisma.marketingPersona.create({
    data: {
      name: "Investor — Yield Seeker",
      description: "Buys for rental yield and capital appreciation, not to live in. Price-per-sqm and rental comps matter more than finishes.",
      suggestedChannels: "Email, phone",
    },
  });
  const corporatePersona = await prisma.marketingPersona.create({
    data: {
      name: "Corporate — Staff Housing Buyer",
      description: "Purchasing on behalf of a company for staff housing. Procurement-driven; needs formal documentation and invoicing.",
      suggestedChannels: "Email",
    },
  });

  // A second corporate-segment customer so the "Corporate Buyers" segment below isn't empty.
  const customerCorporate = await prisma.customer.create({
    data: {
      firstName: "Ghana Business",
      lastName: "Solutions Ltd (c/o Kofi Mensah)",
      email: "procurement@ghanabusinesssolutions.example.com",
      phone: "+233209876543",
      nationality: "Ghanaian",
      segment: "CORPORATE",
      kycStatus: "VERIFIED",
      assignedSalesRepId: michael.id,
    },
  });

  // Birthday demo data — Kwame's birthday falls within the next 14 days of seed time.
  const upcomingBirthday = new Date(Date.now() + 8 * 86400000);
  await prisma.customer.update({
    where: { id: customerKwame.id },
    data: { dateOfBirth: new Date(1988, upcomingBirthday.getMonth(), upcomingBirthday.getDate()) },
  });

  const investorSegment = await prisma.marketingSegment.create({
    data: { name: "Investors", description: "All Investor-segment customers.", criteria: { buyerSegment: "INVESTOR" }, createdById: michael.id },
  });
  const investorMemberIds = [customerAma.id, ...sampleClientIdsBySegment("INVESTOR")];
  await prisma.marketingSegmentMember.createMany({
    data: investorMemberIds.map((customerId) => ({ segmentId: investorSegment.id, customerId })),
  });
  await prisma.marketingSegment.update({ where: { id: investorSegment.id }, data: { memberCount: investorMemberIds.length, lastComputedAt: new Date() } });

  const corporateSegment = await prisma.marketingSegment.create({
    data: { name: "Corporate Buyers", description: "All Corporate-segment customers.", criteria: { buyerSegment: "CORPORATE" }, createdById: michael.id },
  });
  const corporateMemberIds = [customerCorporate.id, ...sampleClientIdsBySegment("CORPORATE")];
  await prisma.marketingSegmentMember.createMany({
    data: corporateMemberIds.map((customerId) => ({ segmentId: corporateSegment.id, customerId })),
  });
  await prisma.marketingSegment.update({ where: { id: corporateSegment.id }, data: { memberCount: corporateMemberIds.length, lastComputedAt: new Date() } });

  // Real estate's equivalent of "abandoned cart" — a unit reservation made but not converted
  // to a Sale, about to lapse. Ama's seeded reservation expires in 3 days, inside this window.
  const reservationExpiringSegment = await prisma.marketingSegment.create({
    data: {
      name: "Reservations Expiring Soon",
      description: "Active reservations lapsing within 7 days — hasn't completed the purchase.",
      criteria: { reservationExpiringWithinDays: 7 },
      createdById: jane.id,
    },
  });
  await prisma.marketingSegmentMember.create({ data: { segmentId: reservationExpiringSegment.id, customerId: customerAma.id } });
  await prisma.marketingSegment.update({ where: { id: reservationExpiringSegment.id }, data: { memberCount: 1, lastComputedAt: new Date() } });

  const birthdaySegment = await prisma.marketingSegment.create({
    data: {
      name: "Birthdays This Month",
      description: "Customers with a birthday in the next 14 days.",
      criteria: { birthdayWithinDays: 14 },
      createdById: jane.id,
    },
  });
  await prisma.marketingSegmentMember.create({ data: { segmentId: birthdaySegment.id, customerId: customerKwame.id } });
  await prisma.marketingSegment.update({ where: { id: birthdaySegment.id }, data: { memberCount: 1, lastComputedAt: new Date() } });

  const allCustomersSegment = await prisma.marketingSegment.create({
    data: { name: "All Active Customers", description: "Every customer — the default welcome-journey audience.", criteria: {}, createdById: jane.id },
  });
  const everyCustomerId = [customerKwame.id, customerAma.id, customerJohn.id, customerCorporate.id, ...sampleClients.map((c) => c.id)];
  await prisma.marketingSegmentMember.createMany({ data: everyCustomerId.map((customerId) => ({ segmentId: allCustomersSegment.id, customerId })) });
  await prisma.marketingSegment.update({ where: { id: allCustomersSegment.id }, data: { memberCount: everyCustomerId.length, lastComputedAt: new Date() } });

  // ---- Multi-channel message templates covering different stages of the customer journey ----
  // Most are library content for staff to build their own campaigns/journeys with ("create your
  // own automation sequences") — only the three actually wired into a seeded campaign below
  // need their IDs captured.
  await prisma.messageTemplate.createMany({
    data: [
      {
        name: "New Client Welcome Email",
        channel: "EMAIL",
        subject: "Welcome to Devtraco — let's find your home",
        bodyText: "Hi there, welcome to Devtraco! Your Sales Consultant will be in touch shortly. In the meantime, browse our current developments and reach out with any questions.",
      },
      {
        name: "Welcome WhatsApp Check-in",
        channel: "WHATSAPP",
        bodyText: "Hi! Just checking in after your welcome email — happy to answer any questions or set up a site visit whenever suits you.",
      },
      {
        name: "Reservation Expiring Email",
        channel: "EMAIL",
        subject: "Your reservation is about to expire",
        bodyText: "Your unit reservation lapses soon. We'd hate for you to lose your spot — let us know if you need more time or have questions about next steps.",
      },
      {
        name: "Birthday Wishes Email",
        channel: "EMAIL",
        subject: "Happy Birthday from Devtraco! 🎉",
        bodyText: "Wishing you a wonderful birthday! As a small thank-you for being a valued customer, get in touch this month for a complimentary property portfolio review.",
      },
      {
        name: "Payment Reminder SMS",
        channel: "SMS",
        bodyText: "Reminder: an installment on your payment plan is due soon. Contact Finance if you have questions about your schedule.",
      },
      {
        name: "Post-Handover Check-in Email",
        channel: "EMAIL",
        subject: "How's life in your new home?",
        bodyText: "It's been a little while since your handover — we'd love to hear how everything is going and address anything outstanding.",
      },
      {
        name: "Win-back Email",
        channel: "EMAIL",
        subject: "We miss you — here's what's new",
        bodyText: "It's been a while since we last connected. Here's what's new across our developments — reply if you'd like an updated tour or pricing.",
      },
    ],
  });

  const [reservationReminderSmsTemplate, birthdayWhatsAppTemplate, investorUpdateEmailTemplate] = await Promise.all([
    prisma.messageTemplate.create({
      data: {
        name: "Reservation Reminder SMS",
        channel: "SMS",
        bodyText: "Reminder: your unit reservation is still open. Complete your purchase before it expires to keep your spot — reply or call your consultant.",
      },
    }),
    prisma.messageTemplate.create({
      data: {
        name: "Birthday Wishes WhatsApp",
        channel: "WHATSAPP",
        bodyText: "Happy Birthday! 🎂 Hope you have a wonderful day. Let us know if there's anything we can help with this month.",
      },
    }),
    prisma.messageTemplate.create({
      data: {
        name: "Investor Quarterly Update Email",
        channel: "EMAIL",
        subject: "Your quarterly investor update",
        bodyText: "Here's your quarterly update: occupancy rates, rental yield trends, and new investment-grade units now available across our developments.",
      },
    }),
  ]);

  // ---- Multi-channel campaigns ----
  await prisma.marketingCampaign.create({
    data: {
      name: "Investor Quarterly Update",
      channel: "EMAIL",
      segmentId: investorSegment.id,
      personaId: investorPersona.id,
      templateId: investorUpdateEmailTemplate.id,
      objective: "Keep investor-segment customers informed on yield trends and new inventory.",
      status: "DRAFT",
      createdById: michael.id,
    },
  });
  await prisma.marketingCampaign.create({
    data: {
      name: "Reservation Reminder Blast",
      channel: "SMS",
      segmentId: reservationExpiringSegment.id,
      templateId: reservationReminderSmsTemplate.id,
      objective: "Recover reservations that haven't converted to a sale before they lapse.",
      status: "DRAFT",
      createdById: jane.id,
    },
  });
  await prisma.marketingCampaign.create({
    data: {
      name: "Birthday Wishes",
      channel: "WHATSAPP",
      segmentId: birthdaySegment.id,
      templateId: birthdayWhatsAppTemplate.id,
      objective: "Send a personal birthday touch to customers this month.",
      status: "DRAFT",
      createdById: jane.id,
    },
  });

  // ---- End-to-end journeys (automation sequences) ----

  // "Cart abandonment" recovery, translated to real estate: a reservation made but not yet
  // converted to a sale. SMS nudge, then an email with more urgency, then a sales task to close.
  const reservationRecoveryJourney = await prisma.marketingJourney.create({
    data: {
      name: "Reservation Recovery",
      description: "Recovers lapsing reservations before they expire unconverted — real estate's abandoned-cart flow.",
      status: "ACTIVE",
      segmentId: reservationExpiringSegment.id,
      createdById: jane.id,
      steps: {
        create: [
          { stepOrder: 1, name: "Reminder SMS", actionType: "SEND_SMS", actionConfig: { body: "Your unit reservation is still open — complete your purchase to keep your spot." } },
          { stepOrder: 2, name: "Wait a day", actionType: "WAIT", actionConfig: {}, waitHours: 24 },
          { stepOrder: 3, name: "Urgency email", actionType: "SEND_EMAIL", actionConfig: { subject: "Your reservation is about to expire", body: "We'd hate for you to lose your spot — let us know if you need more time." } },
          { stepOrder: 4, name: "Sales follow-up call", actionType: "CREATE_TASK", actionConfig: { title: "Call to close reservation before it lapses" } },
        ],
      },
    },
  });
  const recoverySteps = await prisma.marketingJourneyStep.findMany({ where: { journeyId: reservationRecoveryJourney.id }, orderBy: { stepOrder: "asc" } });
  await prisma.customerJourney.create({
    data: {
      customerId: customerAma.id,
      journeyId: reservationRecoveryJourney.id,
      currentStepId: recoverySteps[0].id,
      enteredAt: new Date(Date.now() - 12 * 3600000),
      lastActivityAt: new Date(Date.now() - 12 * 3600000),
    },
  });

  // New-client welcome, run against the whole active customer base.
  const welcomeJourney = await prisma.marketingJourney.create({
    data: {
      name: "New Client Welcome Journey",
      description: "Welcome email, a WhatsApp check-in the next day, then a sales follow-up task.",
      status: "ACTIVE",
      segmentId: allCustomersSegment.id,
      createdById: jane.id,
      steps: {
        create: [
          { stepOrder: 1, name: "Welcome email", actionType: "SEND_EMAIL", actionConfig: { subject: "Welcome to Devtraco", body: "Welcome! Your Sales Consultant will be in touch shortly." } },
          { stepOrder: 2, name: "Wait a day", actionType: "WAIT", actionConfig: {}, waitHours: 24 },
          { stepOrder: 3, name: "WhatsApp check-in", actionType: "SEND_WHATSAPP", actionConfig: { body: "Just checking in — happy to answer any questions or set up a site visit." } },
          { stepOrder: 4, name: "Sales follow-up task", actionType: "CREATE_TASK", actionConfig: { title: "Follow up with new customer" } },
        ],
      },
    },
  });
  const welcomeSteps = await prisma.marketingJourneyStep.findMany({ where: { journeyId: welcomeJourney.id }, orderBy: { stepOrder: "asc" } });
  await prisma.customerJourney.createMany({
    data: [
      {
        customerId: customerKwame.id,
        journeyId: welcomeJourney.id,
        currentStepId: welcomeSteps[3].id,
        status: "COMPLETED",
        enteredAt: new Date(Date.now() - 20 * 86400000),
        lastActivityAt: new Date(Date.now() - 18 * 86400000),
      },
      {
        customerId: customerCorporate.id,
        journeyId: welcomeJourney.id,
        currentStepId: welcomeSteps[1].id,
        enteredAt: new Date(Date.now() - 6 * 3600000),
        lastActivityAt: new Date(Date.now() - 6 * 3600000),
      },
    ],
  });

  // Birthday greetings — two-channel same-day touch, no wait step.
  const birthdayJourney = await prisma.marketingJourney.create({
    data: {
      name: "Birthday Greetings",
      description: "Same-day birthday touch across email and WhatsApp.",
      status: "ACTIVE",
      segmentId: birthdaySegment.id,
      createdById: jane.id,
      steps: {
        create: [
          { stepOrder: 1, name: "Birthday email", actionType: "SEND_EMAIL", actionConfig: { subject: "Happy Birthday from Devtraco! 🎉", body: "Wishing you a wonderful birthday!" } },
          { stepOrder: 2, name: "Birthday WhatsApp", actionType: "SEND_WHATSAPP", actionConfig: { body: "Happy Birthday! 🎂 Hope you have a wonderful day." } },
        ],
      },
    },
  });
  const birthdaySteps = await prisma.marketingJourneyStep.findMany({ where: { journeyId: birthdayJourney.id }, orderBy: { stepOrder: "asc" } });
  await prisma.customerJourney.create({
    data: {
      customerId: customerKwame.id,
      journeyId: birthdayJourney.id,
      currentStepId: birthdaySteps[0].id,
      enteredAt: new Date(Date.now() - 3 * 3600000),
      lastActivityAt: new Date(Date.now() - 3 * 3600000),
    },
  });

  // Sales Enhancement gamification (sales Enhancement.md §2) — badge definitions, sample
  // targets for the two seeded reps, then a one-time backfill so the leaderboard/badges
  // aren't empty on first load (seed data is created directly, not through the point-
  // awarding actions).
  await prisma.salesBadge.createMany({
    data: BADGE_DEFINITIONS.map((b) => ({ code: b.code, name: b.name, category: b.category, description: b.description })),
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0, 23, 59, 59);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

  for (const rep of [
    { userId: jane.id, monthly: 5, quarterly: 15, yearly: 50 },
    { userId: michael.id, monthly: 4, quarterly: 12, yearly: 40 },
  ]) {
    await prisma.salesTarget.createMany({
      data: [
        { userId: rep.userId, periodType: "MONTHLY", periodStart: monthStart, periodEnd: monthEnd, targetDeals: rep.monthly, targetValue: rep.monthly * 400000 },
        { userId: rep.userId, periodType: "QUARTERLY", periodStart: quarterStart, periodEnd: quarterEnd, targetDeals: rep.quarterly, targetValue: rep.quarterly * 400000 },
        { userId: rep.userId, periodType: "YEARLY", periodStart: yearStart, periodEnd: yearEnd, targetDeals: rep.yearly, targetValue: rep.yearly * 400000 },
      ],
    });
  }

  await backfillHistoricalPoints();

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
