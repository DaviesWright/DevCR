"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { MILESTONE_STEPS, isT1GateMet, type MilestoneChecklist } from "@/lib/commission-milestones";
import { triggerWorkflows } from "@/lib/workflow-engine";

// Maps a milestone checklist step to the Automations Module trigger event it should fire —
// only the steps the Devtraco Document Template Library spec (Aug 2026) ties an email to.
// managementApprovedAt is an internal governance step with no client-facing template.
const MILESTONE_TRIGGER_EVENT: Partial<Record<(typeof MILESTONE_STEPS)[number]["key"], string>> = {
  depositConfirmedAt: "MILESTONE_DEPOSIT_CONFIRMED",
  spaSignedByClientAt: "MILESTONE_SPA_SIGNED_CLIENT",
  spaSignedByDevtracoAt: "MILESTONE_SPA_SIGNED_DEVTRACO",
  unitAllocatedAt: "MILESTONE_UNIT_ALLOCATED",
};

function revalidateCommissions(saleId?: string) {
  revalidatePath("/sales/commissions");
  if (saleId) revalidatePath(`/sales/commissions/${saleId}`);
}

// Approving/paying a tranche is gated on its milestone conditions, not left to the Finance
// user's judgment alone — this is the whole point of the Commission Structure doc's design.
export async function approveCommission(commissionId: string, approverId: string) {
  const commission = await prisma.commission.findUniqueOrThrow({ where: { id: commissionId } });
  if (commission.status !== "AWAITING_APPROVAL") {
    throw new Error("This tranche isn't awaiting approval yet — its milestone gate hasn't been met.");
  }
  await prisma.commission.update({
    where: { id: commissionId },
    data: { status: "APPROVED", approvedAt: new Date() },
  });
  await logAudit(approverId, "APPROVE", "Commission", commissionId, { tranche: commission.tranche });
  revalidateCommissions(commission.saleId);
}

export async function markCommissionPaid(commissionId: string) {
  const commission = await prisma.commission.findUniqueOrThrow({ where: { id: commissionId } });
  if (commission.status !== "APPROVED") {
    throw new Error("Only an approved tranche can be marked paid.");
  }
  await prisma.commission.update({
    where: { id: commissionId },
    data: { status: "PAID", paidAt: new Date() },
  });
  revalidateCommissions(commission.saleId);

  // Paying T1/T2 unlocks the next tranche's gate — recompute it the same way completing a
  // milestone step does (preceding tranche PAID is one of T2/T3's own gate conditions).
  if (commission.tranche !== "T3") {
    const nextTranche = commission.tranche === "T1" ? "T2" : "T3";
    await recomputeInstalmentGatedTranche(commission.saleId, nextTranche);
  }
}

export async function voidCommission(commissionId: string) {
  const commission = await prisma.commission.findUniqueOrThrow({ where: { id: commissionId }, select: { saleId: true } });
  await prisma.commission.update({
    where: { id: commissionId },
    data: { status: "VOID" },
  });
  revalidateCommissions(commission.saleId);
}

// ---- Milestone checklist (T1 gate) ----

export async function getOrCreateMilestoneChecklist(saleId: string) {
  const existing = await prisma.saleMilestoneChecklist.findUnique({ where: { saleId } });
  if (existing) return existing;
  return prisma.saleMilestoneChecklist.create({ data: { saleId } });
}

export async function completeMilestoneStep(
  saleId: string,
  step: (typeof MILESTONE_STEPS)[number]["key"],
  actorId: string
) {
  const checklist = await getOrCreateMilestoneChecklist(saleId);
  const updated = await prisma.saleMilestoneChecklist.update({
    where: { saleId },
    data:
      step === "managementApprovedAt"
        ? { managementApprovedAt: new Date(), managementApprovedById: actorId }
        : { [step]: new Date() },
  });
  await logAudit(actorId, "COMPLETE", "SaleMilestoneChecklist", checklist.id, { step });
  await recomputeT1Status(saleId, updated);
  revalidateCommissions(saleId);

  const triggerEvent = MILESTONE_TRIGGER_EVENT[step];
  if (triggerEvent) {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      select: {
        customerId: true,
        unit: { select: { unitNumber: true, development: { select: { name: true } } } },
        opportunity: { select: { ownerId: true } },
      },
    });
    if (sale) {
      await triggerWorkflows(triggerEvent, "SALE", saleId, sale.opportunity?.ownerId ?? actorId, {
        customerId: sale.customerId,
        consultantId: sale.opportunity?.ownerId,
        UnitNumber: sale.unit.unitNumber,
        PropertyName: sale.unit.development.name,
        DevelopmentName: sale.unit.development.name,
      });
    }
  }
}

export async function uncompleteMilestoneStep(saleId: string, step: (typeof MILESTONE_STEPS)[number]["key"]) {
  const updated = await prisma.saleMilestoneChecklist.update({
    where: { saleId },
    data: step === "managementApprovedAt" ? { managementApprovedAt: null, managementApprovedById: null } : { [step]: null },
  });
  await recomputeT1Status(saleId, updated);
  revalidateCommissions(saleId);
}

async function recomputeT1Status(saleId: string, checklist: MilestoneChecklist) {
  const t1 = await prisma.commission.findUnique({ where: { saleId_tranche: { saleId, tranche: "T1" } } });
  if (!t1 || !["PENDING", "AWAITING_APPROVAL"].includes(t1.status)) return;

  const gateMet = isT1GateMet(checklist);
  await prisma.commission.update({
    where: { id: t1.id },
    data: { status: gateMet ? "AWAITING_APPROVAL" : "PENDING" },
  });
}

// ---- T2/T3 instalment gate ----

export async function confirmInstalmentReceived(commissionId: string, actorId: string) {
  const commission = await prisma.commission.findUniqueOrThrow({ where: { id: commissionId } });
  if (commission.tranche === "T1") throw new Error("T1 is gated by the milestone checklist, not an instalment confirmation.");

  await prisma.commission.update({ where: { id: commissionId }, data: { instalmentConfirmedAt: new Date() } });
  await logAudit(actorId, "CONFIRM_INSTALMENT", "Commission", commissionId, { tranche: commission.tranche });
  await recomputeInstalmentGatedTranche(commission.saleId, commission.tranche);
  revalidateCommissions(commission.saleId);
}

async function recomputeInstalmentGatedTranche(saleId: string, tranche: "T2" | "T3") {
  const commission = await prisma.commission.findUnique({ where: { saleId_tranche: { saleId, tranche } } });
  if (!commission || !["PENDING", "AWAITING_APPROVAL", "HOLD"].includes(commission.status)) return;

  const precedingTranche = tranche === "T2" ? "T1" : "T2";
  const preceding = await prisma.commission.findUnique({ where: { saleId_tranche: { saleId, tranche: precedingTranche } } });
  const precedingPaid = preceding?.status === "PAID";

  // Client Account Status gate (Commission Structure doc §2/§3): any overdue payment schedule
  // on this sale freezes the tranche outright, regardless of the instalment confirmation.
  const hasOverdueSchedule = await prisma.paymentSchedule.findFirst({
    where: { paymentPlan: { saleId }, status: "OVERDUE" },
  });

  let status: "PENDING" | "HOLD" | "AWAITING_APPROVAL" | "FROZEN" = "PENDING";
  if (hasOverdueSchedule) status = "FROZEN";
  else if (commission.instalmentConfirmedAt && precedingPaid) status = "AWAITING_APPROVAL";
  else if (commission.instalmentConfirmedAt && !precedingPaid) status = "HOLD";

  await prisma.commission.update({
    where: { id: commission.id },
    data: {
      status,
      holdReason: status === "HOLD" ? `Waiting on ${precedingTranche} to be paid first.` : status === "FROZEN" ? "Client account has an overdue payment schedule." : null,
    },
  });
}
