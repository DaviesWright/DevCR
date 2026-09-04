"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { MAX_RESERVATION_DAYS } from "@/lib/queries/sales";
import { awardPoints, SALES_POINTS, evaluateAndAwardBadges } from "@/lib/gamification";
import { triggerWorkflows } from "@/lib/workflow-engine";
import { generatePaymentPlan } from "@/lib/payments/schedule";
import { getPermissionProfile, assertCanAccessRecord, assertCanWrite } from "@/lib/permissions";

export async function moveOpportunityStage(opportunityId: string, targetStageId: string, actorId: string) {
  const existing = await prisma.opportunity.findUniqueOrThrow({
    where: { id: opportunityId },
    select: { ownerId: true, pipelineStageId: true },
  });
  const profile = await getPermissionProfile(actorId);
  assertCanWrite(profile);
  await assertCanAccessRecord(profile, existing.ownerId);

  const targetStage = await prisma.pipelineStage.findUniqueOrThrow({ where: { id: targetStageId } });

  const opportunity = await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      // Write-both: `stage` (legacy enum) stays authoritative for any call site not yet
      // migrated off it; `pipelineStageId` is the new source of truth for migrated ones.
      stage: targetStage.key as never,
      pipelineStageId: targetStage.id,
      probability: targetStage.probability,
      closedAt: targetStage.isWonStage || targetStage.isLostStage ? new Date() : null,
    },
  });

  await prisma.opportunityStageHistory.create({
    data: { opportunityId, fromStageId: existing.pipelineStageId, toStageId: targetStage.id, changedById: actorId },
  });

  await triggerWorkflows("OPPORTUNITY_STAGE_CHANGED", "OPPORTUNITY", opportunityId, opportunity.ownerId, {
    toStage: targetStage.key,
    expectedValue: Number(opportunity.expectedValue),
  });

  if (targetStage.key === "CONTRACT") {
    await awardPoints(opportunity.ownerId, SALES_POINTS.CONTRACT_STAGE, "Deal reached Contract stage", "CONTRACT");
  }

  // Closing won creates the Sale + a PENDING commission for the owning agent,
  // exactly once per opportunity (Sale.opportunityId is unique) — a card
  // dragged back and forth across CLOSED_WON never duplicates either record.
  if (targetStage.isWonStage && opportunity.unitId) {
    const existingSale = await prisma.sale.findUnique({ where: { opportunityId } });
    if (!existingSale) {
      const sale = await prisma.sale.create({
        data: {
          opportunityId,
          unitId: opportunity.unitId,
          customerId: opportunity.customerId,
          salePrice: opportunity.expectedValue,
          currency: opportunity.currency,
          status: "ACTIVE",
        },
      });
      await prisma.unit.update({ where: { id: opportunity.unitId }, data: { status: "SOLD" } });
      await triggerWorkflows("SALE_CREATED", "SALE", sale.id, opportunity.ownerId, {
        salePrice: Number(opportunity.expectedValue),
      });

      // Devtraco Payment & Financial Process Flow: the 7-stage milestone schedule (Reservation
      // Deposit / SPA Execution / 4 Construction Milestones / Handover). Auto-marks the
      // reservation deposit as paid if one was already collected — see src/lib/payments/schedule.ts.
      await generatePaymentPlan(sale.id, opportunity.ownerId);

      const agent = await prisma.salesAgent.findUnique({ where: { userId: opportunity.ownerId } });
      if (agent) {
        const totalCommission = (Number(opportunity.expectedValue) * Number(agent.commissionRate)) / 100;
        // T1 80% / T2 10% / T3 10% — Commission Structure doc. Each tranche starts PENDING and
        // only moves once its milestone gate is met (see src/lib/commission-milestones.ts).
        await prisma.commission.createMany({
          data: [
            { saleId: sale.id, agentId: agent.id, tranche: "T1", percentage: 80, amount: totalCommission * 0.8, currency: opportunity.currency, status: "PENDING" },
            { saleId: sale.id, agentId: agent.id, tranche: "T2", percentage: 10, amount: totalCommission * 0.1, currency: opportunity.currency, status: "PENDING" },
            { saleId: sale.id, agentId: agent.id, tranche: "T3", percentage: 10, amount: totalCommission * 0.1, currency: opportunity.currency, status: "PENDING" },
          ],
        });
        await prisma.saleMilestoneChecklist.create({ data: { saleId: sale.id } });

        // "Notification on sales and potential commission earnings" — simulated (no push/email
        // provider), same pattern as every other notification in this app: a real, visible
        // activity record rather than silently doing nothing.
        await prisma.interaction.create({
          data: {
            type: "NOTE",
            subject: "Commission earnings potential",
            notes: `Deal closed won. Potential commission: ${totalCommission.toLocaleString()} ${opportunity.currency}, released in 3 milestone-gated tranches (80/10/10). Complete the milestone checklist to move T1 to Finance approval.`,
            userId: opportunity.ownerId,
            relatedEntityType: "SALE",
            relatedEntityId: sale.id,
          },
        });
      }

      // Sales Playbook §6.2: the internal handover notification to CX fires the
      // moment the deal is Won, addressed to whoever picks it up as CX lead.
      await prisma.clientHandover.create({
        data: {
          saleId: sale.id,
          customerId: opportunity.customerId,
          consultantId: opportunity.ownerId,
        },
      });

      await awardPoints(opportunity.ownerId, SALES_POINTS.CLOSED_WON, "Deal closed won", "CLOSED_WON");
      await evaluateAndAwardBadges(opportunity.ownerId);
    }
  }

  revalidatePath("/sales");
  revalidatePath("/sales/commissions");
  revalidatePath("/cx/handoffs");
  revalidatePath("/payments");
}

// Simulated document generation (Sales Team Memorandum issue #7) — no DocuSign/PandaDoc
// integration exists, so this creates the real Reservation record (fee + expiry) that a
// document would otherwise be generated from, and logs it as an Interaction against the
// Opportunity, rather than silently doing nothing.
export async function generateReservationForm(opportunityId: string, actorId: string) {
  const opportunity = await prisma.opportunity.findUniqueOrThrow({
    where: { id: opportunityId },
    select: {
      unitId: true,
      customerId: true,
      expectedValue: true,
      currency: true,
      ownerId: true,
      unit: { select: { unitNumber: true, development: { select: { name: true } } } },
    },
  });
  const profile = await getPermissionProfile(actorId);
  assertCanWrite(profile);
  await assertCanAccessRecord(profile, opportunity.ownerId);

  if (!opportunity.unitId) throw new Error("Select a unit before generating a Reservation Form.");

  const existing = await prisma.reservation.findFirst({ where: { opportunityId } });
  if (existing) return { reservationId: existing.id };

  const reservationFee = Math.round(Number(opportunity.expectedValue) * 0.1);
  const expiryDate = new Date(Date.now() + MAX_RESERVATION_DAYS * 86400000);

  const reservation = await prisma.reservation.create({
    data: {
      opportunityId,
      unitId: opportunity.unitId,
      customerId: opportunity.customerId,
      reservationFee,
      currency: opportunity.currency,
      expiryDate,
      status: "ACTIVE",
    },
  });
  await prisma.unit.update({ where: { id: opportunity.unitId }, data: { status: "RESERVED" } });
  await prisma.unitStatusHistory.create({
    data: { unitId: opportunity.unitId, fromStatus: "AVAILABLE", toStatus: "RESERVED", changedById: actorId, notes: "Reservation Form generated from the Opportunity pipeline." },
  });

  await prisma.interaction.create({
    data: {
      type: "NOTE",
      subject: "Reservation Form generated",
      notes: `Reservation Form generated (simulated — no document-generation provider configured). Fee: ${reservationFee} ${opportunity.currency}. Expires in ${MAX_RESERVATION_DAYS} days (${expiryDate.toDateString()}).`,
      userId: actorId,
      relatedEntityType: "OPPORTUNITY",
      relatedEntityId: opportunityId,
    },
  });
  await logAudit(actorId, "CREATE", "Reservation", reservation.id, { unitId: opportunity.unitId, expiryDate: expiryDate.toISOString() });
  await awardPoints(actorId, SALES_POINTS.RESERVATION_MADE, "Reservation Form generated", "RESERVATION");

  // Automations Module — "Receipt of New Reservation Form" (TMP-RES-001) etc. wire up here via
  // any Workflow rule configured for this trigger (Admin builds/edits these, not hardcoded).
  await triggerWorkflows("RESERVATION_CREATED", "OPPORTUNITY", opportunityId, actorId, {
    customerId: opportunity.customerId,
    consultantId: opportunity.ownerId,
    UnitNumber: opportunity.unit!.unitNumber,
    PropertyName: opportunity.unit!.development.name,
    DevelopmentName: opportunity.unit!.development.name,
  });

  revalidatePath("/sales");
  revalidatePath("/projects");
  return { reservationId: reservation.id };
}

// Direct unit-hold entry point (Projects inventory) — for a potential/qualified customer who
// doesn't have an Opportunity yet. Same 5-day cap and unit-status transition as the pipeline's
// Reservation Form; both funnel through the same Reservation/UnitStatusHistory records so a
// unit's hold history reads the same regardless of where it was created.
export async function reserveUnit(input: { unitId: string; leadId: string; days: number; actorId: string }) {
  const unit = await prisma.unit.findUniqueOrThrow({
    where: { id: input.unitId },
    select: { id: true, status: true, currentPrice: true, currency: true, unitNumber: true, development: { select: { name: true } } },
  });
  if (unit.status !== "AVAILABLE") throw new Error("Only an available unit can be reserved.");

  const lead = await prisma.lead.findUniqueOrThrow({
    where: { id: input.leadId },
    select: { customerId: true, assignedToId: true, customer: { select: { firstName: true, lastName: true } } },
  });
  const profile = await getPermissionProfile(input.actorId);
  assertCanWrite(profile);
  await assertCanAccessRecord(profile, lead.assignedToId);

  const days = Math.min(Math.max(Math.round(input.days), 1), MAX_RESERVATION_DAYS);
  const reservationFee = Math.round(Number(unit.currentPrice) * 0.1);
  const expiryDate = new Date(Date.now() + days * 86400000);

  const reservation = await prisma.reservation.create({
    data: {
      unitId: unit.id,
      customerId: lead.customerId,
      reservationFee,
      currency: unit.currency,
      expiryDate,
      status: "ACTIVE",
    },
  });
  await prisma.unit.update({ where: { id: unit.id }, data: { status: "RESERVED" } });
  await prisma.unitStatusHistory.create({
    data: {
      unitId: unit.id,
      fromStatus: "AVAILABLE",
      toStatus: "RESERVED",
      changedById: input.actorId,
      notes: `Reserved for ${lead.customer.firstName} ${lead.customer.lastName} — ${days}-day hold, expires ${expiryDate.toDateString()}.`,
    },
  });
  await prisma.interaction.create({
    data: {
      type: "NOTE",
      subject: "Unit reserved",
      notes: `Held for ${days} day${days === 1 ? "" : "s"} (max ${MAX_RESERVATION_DAYS}). Fee: ${reservationFee} ${unit.currency}. Expires ${expiryDate.toDateString()}.`,
      userId: input.actorId,
      relatedEntityType: "UNIT",
      relatedEntityId: unit.id,
    },
  });
  await logAudit(input.actorId, "CREATE", "Reservation", reservation.id, { unitId: unit.id, days, expiryDate: expiryDate.toISOString() });
  await awardPoints(input.actorId, SALES_POINTS.RESERVATION_MADE, "Unit reserved", "RESERVATION");

  await triggerWorkflows("RESERVATION_CREATED", "UNIT", unit.id, input.actorId, {
    customerId: lead.customerId,
    consultantId: lead.assignedToId ?? input.actorId,
    UnitNumber: unit.unitNumber,
    PropertyName: unit.development.name,
    DevelopmentName: unit.development.name,
  });

  revalidatePath("/projects");
  revalidatePath("/sales");
  return { reservationId: reservation.id };
}

export async function cancelReservation(reservationId: string, actorId: string) {
  const reservation = await prisma.reservation.findUniqueOrThrow({
    where: { id: reservationId },
    select: { unitId: true, status: true, opportunity: { select: { ownerId: true } } },
  });
  const profile = await getPermissionProfile(actorId);
  assertCanWrite(profile);
  // A reservation made directly against a Lead (no Opportunity yet) has no single owner to
  // check — write access is enough there, matching how reserveUnit created it in the first place.
  if (reservation.opportunity) {
    await assertCanAccessRecord(profile, reservation.opportunity.ownerId);
  }

  if (reservation.status !== "ACTIVE") return;

  await prisma.reservation.update({ where: { id: reservationId }, data: { status: "CANCELLED" } });
  await prisma.unit.update({ where: { id: reservation.unitId }, data: { status: "AVAILABLE" } });
  await prisma.unitStatusHistory.create({
    data: { unitId: reservation.unitId, fromStatus: "RESERVED", toStatus: "AVAILABLE", changedById: actorId, notes: "Reservation cancelled." },
  });
  await logAudit(actorId, "CANCEL", "Reservation", reservationId, { unitId: reservation.unitId });

  revalidatePath("/projects");
  revalidatePath("/sales");
}

// No background scheduler exists in this app (established convention — see docs/backlog.md
// §4), so an expired-but-still-ACTIVE hold is released lazily: computed for display in
// getUnitsInventory, and swept for real here when a rep clicks "Release Expired Holds".
export async function releaseExpiredReservations(actorId: string) {
  assertCanWrite(await getPermissionProfile(actorId));

  const expired = await prisma.reservation.findMany({
    where: { status: "ACTIVE", expiryDate: { lt: new Date() } },
    select: { id: true, unitId: true },
  });

  for (const r of expired) {
    await prisma.reservation.update({ where: { id: r.id }, data: { status: "EXPIRED" } });
    await prisma.unit.updateMany({ where: { id: r.unitId, status: "RESERVED" }, data: { status: "AVAILABLE" } });
    await prisma.unitStatusHistory.create({
      data: { unitId: r.unitId, fromStatus: "RESERVED", toStatus: "AVAILABLE", changedById: actorId, notes: `Reservation expired — ${MAX_RESERVATION_DAYS}-day hold not converted.` },
    });
    await logAudit(actorId, "EXPIRE", "Reservation", r.id, { unitId: r.unitId });
  }

  revalidatePath("/projects");
  revalidatePath("/sales");
  return { releasedCount: expired.length };
}
