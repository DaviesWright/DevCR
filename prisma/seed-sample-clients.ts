// Builder for the sample-data roster (prisma/data/sample-clients.ts) — called from
// prisma/seed.ts. Kept in its own file so seed.ts doesn't balloon further; the data/logic split
// mirrors the existing cx-playbook-templates.ts pattern.

import type { PrismaClient } from "@prisma/client";
import { SAMPLE_CLIENTS, type SampleClient } from "./data/sample-clients";

// Resolves PipelineStage.id for a literal OpportunityStage/LeadStatus key, cached per-run to
// avoid N+1 lookups since this script creates one Lead (and often one Opportunity) per
// SAMPLE_CLIENTS entry. Takes a prisma client since seedSampleClients receives it via SeedContext
// rather than instantiating its own.
function makeStageResolvers(prisma: PrismaClient) {
  const oppStageIdCache = new Map<string, string>();
  const leadStageIdCache = new Map<string, string>();
  return {
    async oppStageId(key: string): Promise<string> {
      if (!oppStageIdCache.has(key)) {
        const stage = await prisma.pipelineStage.findFirstOrThrow({
          where: { pipeline: { key: "SALES_OPPORTUNITY" }, key },
        });
        oppStageIdCache.set(key, stage.id);
      }
      return oppStageIdCache.get(key)!;
    },
    async leadStageId(key: string): Promise<string> {
      if (!leadStageIdCache.has(key)) {
        const stage = await prisma.pipelineStage.findFirstOrThrow({
          where: { pipeline: { key: "LEAD_NURTURE" }, key },
        });
        leadStageIdCache.set(key, stage.id);
      }
      return leadStageIdCache.get(key)!;
    },
  };
}

type SeedContext = {
  prisma: PrismaClient;
  jane: { id: string };
  michael: { id: string };
  janeAgent: { id: string };
  websiteSource: { id: string };
  referralSource: { id: string };
  propType3bed: { id: string };
  propType4bed: { id: string };
  propTypeStudio: { id: string };
  propType2bed: { id: string };
  plumbingCategory: { id: string };
  billingCategory: { id: string };
};

const OPPORTUNITY_STAGE_FOR: Partial<Record<SampleClient["stage"], string>> = {
  OPP_PROSPECTING: "PROSPECTING",
  OPP_QUALIFIED: "QUALIFIED",
  OPP_SITE_VISIT: "SITE_VISIT",
  OPP_NEGOTIATION: "NEGOTIATION",
  OPP_CONTRACT: "CONTRACT",
  OPP_CLOSED_LOST: "CLOSED_LOST",
  SALE_ACTIVE_COMPLAINT: "CLOSED_WON",
  SALE_COMPLETED_HANDOVER: "CLOSED_WON",
};

const PROBABILITY_FOR: Partial<Record<SampleClient["stage"], number>> = {
  OPP_PROSPECTING: 20,
  OPP_QUALIFIED: 35,
  OPP_SITE_VISIT: 50,
  OPP_NEGOTIATION: 75,
  OPP_CONTRACT: 90,
  OPP_CLOSED_LOST: 0,
  SALE_ACTIVE_COMPLAINT: 100,
  SALE_COMPLETED_HANDOVER: 100,
};

const HAS_OPPORTUNITY = new Set<SampleClient["stage"]>([
  "OPP_PROSPECTING", "OPP_QUALIFIED", "OPP_SITE_VISIT", "OPP_NEGOTIATION", "OPP_CONTRACT",
  "OPP_CLOSED_LOST", "SALE_ACTIVE_COMPLAINT", "SALE_COMPLETED_HANDOVER",
]);

function bantTotal(bant: NonNullable<SampleClient["bant"]>) {
  return Math.round((bant.budget + bant.authority + bant.need + bant.timeline + bant.fit) / 5);
}

export async function seedSampleClients(ctx: SeedContext) {
  const { prisma, jane, michael, janeAgent, websiteSource, referralSource, propType3bed, propType4bed, propTypeStudio, propType2bed, plumbingCategory, billingCategory } = ctx;
  const users = { jane, michael };
  const sources = { website: websiteSource, referral: referralSource };
  const propertyTypes = [propType3bed, propType4bed, propTypeStudio, propType2bed];
  const { oppStageId, leadStageId } = makeStageResolvers(prisma);

  const createdCustomerIds: { id: string; segment: SampleClient["segment"] }[] = [];

  for (const client of SAMPLE_CLIENTS) {
    const rep = users[client.assignedRep];
    const createdAt = new Date(Date.now() - client.daysAgo * 86400000);

    const customer = await prisma.customer.create({
      data: {
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        nationality: client.nationality,
        segment: client.segment,
        kycStatus: client.kycStatus,
        assignedSalesRepId: rep.id,
        createdAt,
      },
    });
    createdCustomerIds.push({ id: customer.id, segment: client.segment });

    const isQualifiedTrack = client.stage !== "NEW" && client.stage !== "CONTACTED" && client.stage !== "NURTURING" && client.stage !== "NO_RESPONSE" && client.stage !== "UNQUALIFIED";
    const bantScore = client.bant ? bantTotal(client.bant) : 0;
    const leadStatus = client.stage === "UNQUALIFIED" ? "UNQUALIFIED" : client.stage === "REAL_OPPORTUNITY" ? "REAL_OPPORTUNITY" : HAS_OPPORTUNITY.has(client.stage) ? "CONVERTED" : client.stage;

    const lead = await prisma.lead.create({
      data: {
        customerId: customer.id,
        sourceId: sources[client.source].id,
        assignedToId: rep.id,
        budgetMin: client.budgetMin,
        budgetMax: client.budgetMax,
        propertyTypeId: propertyTypes[client.propertyType].id,
        currency: "USD",
        score: bantScore,
        bantScore,
        status: leadStatus as never,
        pipelineStageId: await leadStageId(leadStatus),
        qualificationStatus: isQualifiedTrack ? "QUALIFIED" : "UNQUALIFIED",
        qualifiedAt: isQualifiedTrack ? new Date(createdAt.getTime() + 2 * 86400000) : null,
        realOpportunityAt: client.stage === "REAL_OPPORTUNITY" ? new Date(createdAt.getTime() + 5 * 86400000) : null,
        suspectedPersona: client.suspectedPersona ?? null,
        suspectedPersonaNote: client.suspectedPersona ? "Signals gathered during nurturing calls and a site visit." : null,
        lostReason: client.lostReason ?? null,
        lostReasonNote: client.lostReason ? "Captured at disqualification." : null,
        disqualifiedAt: client.stage === "UNQUALIFIED" ? new Date(createdAt.getTime() + 3 * 86400000) : null,
        createdAt,
      },
    });

    // Activities, scaled by stage — enough for the Real Opportunities gate (2+ CALL/MEETING/
    // SITE_VISIT) and to give Leads Analytics/engagement reporting real volume.
    const activityTypes: { type: "EMAIL" | "CALL" | "MEETING" | "SITE_VISIT"; description: string }[] =
      client.stage === "NEW"
        ? []
        : client.stage === "CONTACTED"
          ? [{ type: "EMAIL", description: "Sent brochure and pricing sheet." }]
          : client.stage === "NURTURING"
            ? [
                { type: "EMAIL", description: "Sent brochure and pricing sheet." },
                { type: "CALL", description: "Discussed budget and preferred location." },
              ]
            : client.stage === "NO_RESPONSE"
              ? [{ type: "EMAIL", description: "Initial outreach — no reply since." }]
              : client.stage === "UNQUALIFIED"
                ? [{ type: "CALL", description: "Discovery call — did not meet qualification criteria." }]
                : client.stage === "REAL_OPPORTUNITY"
                  ? [
                      { type: "SITE_VISIT", description: "Toured Block A show unit." },
                      { type: "CALL", description: "Financing pre-qualification discussion." },
                      { type: "MEETING", description: "Confirmed decision-maker and timeline." },
                    ]
                  : [
                      { type: "CALL", description: "Discovery call — budget and requirements confirmed." },
                      { type: "MEETING", description: "In-person consultation at the sales office." },
                    ];

    for (const [i, a] of activityTypes.entries()) {
      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          type: a.type,
          description: a.description,
          createdById: rep.id,
          occurredAt: new Date(createdAt.getTime() + (i + 1) * 4 * 3600000),
        },
      });
    }

    if (client.bant) {
      await prisma.bantScore.create({
        data: {
          leadId: lead.id,
          userId: rep.id,
          budgetScore: client.bant.budget,
          authorityScore: client.bant.authority,
          needScore: client.bant.need,
          timelineScore: client.bant.timeline,
          fitScore: client.bant.fit,
          totalScore: bantScore,
          status: bantScore >= 70 ? "QUALIFIED" : bantScore >= 40 ? "REVIEW" : "UNQUALIFIED",
          createdAt: new Date(createdAt.getTime() + 2 * 86400000),
        },
      });
    }

    if (client.suspectedPersona) {
      await prisma.leadPersonaSignal.create({
        data: {
          leadId: lead.id,
          suspectedPersona: client.suspectedPersona,
          note: "Signals gathered during nurturing calls and a site visit.",
          capturedAt: new Date(createdAt.getTime() + 5 * 86400000),
        },
      });
    }

    if (!HAS_OPPORTUNITY.has(client.stage)) continue;

    let unit: { id: string; currentPrice: unknown } | null = null;
    if (client.unitNumber) {
      unit = await prisma.unit.findFirstOrThrow({ where: { unitNumber: client.unitNumber } });
    }
    const expectedValue = unit ? Number(unit.currentPrice) : Math.round((client.budgetMin + client.budgetMax) / 2);
    const oppStage = OPPORTUNITY_STAGE_FOR[client.stage]!;

    const opportunity = await prisma.opportunity.create({
      data: {
        leadId: lead.id,
        customerId: customer.id,
        unitId: unit?.id ?? null,
        expectedValue,
        currency: "USD",
        stage: oppStage as never,
        pipelineStageId: await oppStageId(oppStage),
        probability: PROBABILITY_FOR[client.stage] ?? 20,
        ownerId: rep.id,
        closedAt: client.stage === "OPP_CLOSED_LOST" || client.stage === "SALE_ACTIVE_COMPLAINT" || client.stage === "SALE_COMPLETED_HANDOVER" ? new Date(createdAt.getTime() + 20 * 86400000) : null,
        createdAt: new Date(createdAt.getTime() + 3 * 86400000),
      },
    });

    if (unit && (client.stage === "OPP_SITE_VISIT" || client.stage === "OPP_NEGOTIATION" || client.stage === "OPP_CONTRACT")) {
      await prisma.unit.update({ where: { id: unit.id }, data: { status: "RESERVED" } });
    }

    if (client.stage !== "SALE_ACTIVE_COMPLAINT" && client.stage !== "SALE_COMPLETED_HANDOVER") continue;
    if (!unit) continue;

    await prisma.unit.update({ where: { id: unit.id }, data: { status: "SOLD" } });

    const sale = await prisma.sale.create({
      data: {
        opportunityId: opportunity.id,
        unitId: unit.id,
        customerId: customer.id,
        salePrice: Number(unit.currentPrice),
        currency: "USD",
        status: client.stage === "SALE_COMPLETED_HANDOVER" ? "COMPLETED" : "ACTIVE",
        saleDate: new Date(createdAt.getTime() + 21 * 86400000),
      },
    });

    const isFullyHandedOver = client.stage === "SALE_COMPLETED_HANDOVER";
    const totalCommission = Math.round(Number(unit.currentPrice) * 0.03);
    const trancheStatus = isFullyHandedOver ? "PAID" : "PENDING";
    await prisma.commission.createMany({
      data: [
        { saleId: sale.id, agentId: janeAgent.id, tranche: "T1", percentage: 80, amount: totalCommission * 0.8, currency: "USD", status: trancheStatus, approvedAt: isFullyHandedOver ? sale.saleDate : null, paidAt: isFullyHandedOver ? sale.saleDate : null },
        { saleId: sale.id, agentId: janeAgent.id, tranche: "T2", percentage: 10, amount: totalCommission * 0.1, currency: "USD", status: trancheStatus, approvedAt: isFullyHandedOver ? sale.saleDate : null, paidAt: isFullyHandedOver ? sale.saleDate : null, instalmentConfirmedAt: isFullyHandedOver ? sale.saleDate : null },
        { saleId: sale.id, agentId: janeAgent.id, tranche: "T3", percentage: 10, amount: totalCommission * 0.1, currency: "USD", status: trancheStatus, approvedAt: isFullyHandedOver ? sale.saleDate : null, paidAt: isFullyHandedOver ? sale.saleDate : null, instalmentConfirmedAt: isFullyHandedOver ? sale.saleDate : null },
      ],
    });
    // Fully handed-over sales get a complete milestone checklist; an active sale with an open
    // complaint gets a partial one (deposit + client SPA signed, awaiting Devtraco countersign).
    await prisma.saleMilestoneChecklist.create({
      data: {
        saleId: sale.id,
        depositConfirmedAt: sale.saleDate,
        spaSignedByClientAt: sale.saleDate,
        spaSignedByDevtracoAt: isFullyHandedOver ? sale.saleDate : null,
        unitAllocatedAt: isFullyHandedOver ? sale.saleDate : null,
        managementApprovedAt: isFullyHandedOver ? sale.saleDate : null,
        managementApprovedById: isFullyHandedOver ? michael.id : null,
      },
    });

    const totalAmount = Number(unit.currentPrice);
    const downPayment = Math.round(totalAmount * 0.2);
    const paymentPlan = await prisma.paymentPlan.create({
      data: {
        saleId: sale.id,
        totalAmount,
        downPayment,
        status: client.stage === "SALE_COMPLETED_HANDOVER" ? "COMPLETED" : "ACTIVE",
      },
    });
    const installment = Math.round((totalAmount - downPayment) / 3);
    if (client.stage === "SALE_COMPLETED_HANDOVER") {
      for (let i = 1; i <= 3; i++) {
        await prisma.paymentSchedule.create({
          data: { paymentPlanId: paymentPlan.id, installmentNo: i, dueDate: new Date(createdAt.getTime() + (25 + i * 20) * 86400000), amountDue: installment, status: "PAID" },
        });
      }
    } else {
      await prisma.paymentSchedule.create({
        data: { paymentPlanId: paymentPlan.id, installmentNo: 1, dueDate: new Date(Date.now() - 4 * 86400000), amountDue: installment, status: "OVERDUE" },
      });
      await prisma.paymentSchedule.create({
        data: { paymentPlanId: paymentPlan.id, installmentNo: 2, dueDate: new Date(Date.now() + 26 * 86400000), amountDue: installment, status: "PENDING" },
      });
    }

    await prisma.clientHandover.create({
      data: {
        saleId: sale.id,
        customerId: customer.id,
        consultantId: rep.id,
        cxLeadId: client.stage === "SALE_COMPLETED_HANDOVER" ? michael.id : undefined,
        status: client.stage === "SALE_COMPLETED_HANDOVER" ? "COMPLETE" : "ACKNOWLEDGED",
        dossierComplete: client.stage === "SALE_COMPLETED_HANDOVER",
        notifiedAt: new Date(createdAt.getTime() + 21 * 86400000),
        acknowledgedAt: new Date(createdAt.getTime() + 22 * 86400000),
        introductionLoggedAt: client.stage === "SALE_COMPLETED_HANDOVER" ? new Date(createdAt.getTime() + 23 * 86400000) : null,
        welcomeSentAt: client.stage === "SALE_COMPLETED_HANDOVER" ? new Date(createdAt.getTime() + 23 * 86400000) : null,
        qualityScore: client.stage === "SALE_COMPLETED_HANDOVER" ? 9 : null,
      },
    });

    if (client.stage === "SALE_ACTIVE_COMPLAINT") {
      const complaint = await prisma.complaint.create({
        data: {
          customerId: customer.id,
          unitId: unit.id,
          categoryId: plumbingCategory.id,
          subject: "Air conditioning not cooling",
          description: "AC unit in the master bedroom isn't cooling properly since move-in.",
          priority: "HIGH",
          status: "OPEN",
          openedAt: new Date(Date.now() - 1 * 86400000),
        },
      });
      await prisma.complaintSLA.create({
        data: {
          complaintId: complaint.id,
          responseDueAt: new Date(Date.now() + 3 * 3600000),
          resolutionDueAt: new Date(Date.now() + 20 * 3600000),
        },
      });
    }

    if (client.stage === "SALE_COMPLETED_HANDOVER") {
      await prisma.handover.create({
        data: {
          unitId: unit.id,
          customerId: customer.id,
          status: "COMPLETED",
          scheduledAt: new Date(createdAt.getTime() + 55 * 86400000),
          completedAt: new Date(createdAt.getTime() + 56 * 86400000),
          conductedById: rep.id,
        },
      });
      const resolvedComplaint = await prisma.complaint.create({
        data: {
          customerId: customer.id,
          unitId: unit.id,
          categoryId: billingCategory.id,
          subject: "Service charge breakdown request",
          description: "Requested a breakdown of the first service charge invoice.",
          priority: "LOW",
          status: "RESOLVED",
          openedAt: new Date(createdAt.getTime() + 58 * 86400000),
          resolvedAt: new Date(createdAt.getTime() + 60 * 86400000),
          closedAt: new Date(createdAt.getTime() + 60 * 86400000),
        },
      });
      await prisma.complaintSLA.create({
        data: {
          complaintId: resolvedComplaint.id,
          responseDueAt: new Date(createdAt.getTime() + 59 * 86400000),
          resolutionDueAt: new Date(createdAt.getTime() + 61 * 86400000),
          respondedAt: new Date(createdAt.getTime() + 58.5 * 86400000),
          resolvedAt: new Date(createdAt.getTime() + 60 * 86400000),
        },
      });
    }
  }

  return createdCustomerIds;
}
