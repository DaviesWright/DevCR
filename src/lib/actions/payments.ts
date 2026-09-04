"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { recordPayment as recordPaymentCore, attemptBcSync } from "@/lib/payments/schedule";
import { triggerWorkflows } from "@/lib/workflow-engine";
import { getPermissionProfile, assertCanWrite } from "@/lib/permissions";

export async function recordPayment(input: {
  scheduleId: string;
  amount: number;
  method: "CASH" | "BANK_TRANSFER" | "MOBILE_MONEY" | "CARD" | "CHEQUE" | "OTHER";
  reference: string;
  notes: string;
  actorId: string;
}) {
  if (input.amount <= 0) throw new Error("Payment amount must be greater than zero.");

  const schedule = await prisma.paymentSchedule.findUniqueOrThrow({
    where: { id: input.scheduleId },
    select: { paymentPlan: { select: { saleId: true, sale: { select: { customerId: true } } } } },
  });

  const payment = await recordPaymentCore({
    scheduleId: input.scheduleId,
    customerId: schedule.paymentPlan.sale.customerId,
    saleId: schedule.paymentPlan.saleId,
    amount: input.amount,
    method: input.method,
    reference: input.reference || null,
    notes: input.notes || null,
    actorId: input.actorId,
  });

  await logAudit(input.actorId, "RECORD_PAYMENT", "Payment", payment.id, {
    scheduleId: input.scheduleId,
    amount: input.amount,
  });

  revalidatePath("/payments");
  revalidatePath(`/payments/${schedule.paymentPlan.saleId}`);
  revalidatePath("/sales/commissions");
  return payment;
}

// No-code flexible payment plans: lets staff amend an unpaid instalment's amount/due date to
// match a specific buyer's cash flow (e.g. a smaller deposit with the balance pushed onto later
// construction milestones) without touching STANDARD_SCHEDULE in src/lib/payments/schedule.ts.
// PaymentPlan.totalAmount is kept as the live sum of its schedules so it never drifts.
export async function updatePaymentScheduleAmount(input: {
  scheduleId: string;
  amountDue: number;
  dueDate: string;
  actorId: string;
}) {
  const profile = await getPermissionProfile(input.actorId);
  assertCanWrite(profile);

  if (!Number.isFinite(input.amountDue) || input.amountDue <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  const schedule = await prisma.paymentSchedule.findUniqueOrThrow({
    where: { id: input.scheduleId },
    include: {
      allocations: { select: { amount: true } },
      paymentPlan: { select: { id: true, saleId: true } },
    },
  });

  if (schedule.status === "PAID" || schedule.status === "WAIVED") {
    throw new Error(`Cannot edit an instalment that is already ${schedule.status.toLowerCase()}.`);
  }
  const alreadyPaid = schedule.allocations.reduce((sum, a) => sum + Number(a.amount), 0);
  if (input.amountDue < alreadyPaid) {
    throw new Error(`Amount cannot be less than the ${alreadyPaid.toLocaleString()} already collected on this instalment.`);
  }

  const dueDate = new Date(input.dueDate);
  if (Number.isNaN(dueDate.getTime())) throw new Error("Invalid due date.");

  await prisma.$transaction(async (tx) => {
    await tx.paymentSchedule.update({
      where: { id: input.scheduleId },
      data: {
        amountDue: input.amountDue,
        dueDate,
        status: alreadyPaid > 0 ? "PARTIAL" : dueDate.getTime() < Date.now() ? "OVERDUE" : "PENDING",
      },
    });
    const agg = await tx.paymentSchedule.aggregate({
      where: { paymentPlanId: schedule.paymentPlan.id },
      _sum: { amountDue: true },
    });
    await tx.paymentPlan.update({
      where: { id: schedule.paymentPlan.id },
      data: { totalAmount: agg._sum.amountDue ?? input.amountDue },
    });
  });

  await logAudit(input.actorId, "UPDATE_PAYMENT_SCHEDULE", "PaymentSchedule", input.scheduleId, {
    amountDue: input.amountDue,
    dueDate: input.dueDate,
  });

  revalidatePath("/payments");
  revalidatePath(`/payments/${schedule.paymentPlan.saleId}`);
}

export async function retryBcSync(mirrorTransactionId: string, actorId: string) {
  await attemptBcSync(mirrorTransactionId);
  await logAudit(actorId, "RETRY_SYNC", "BcMirrorTransaction", mirrorTransactionId, {});
  revalidatePath("/payments/reconciliation");
}

export async function retryAllFailedBcSyncs(actorId: string) {
  const failed = await prisma.bcMirrorTransaction.findMany({
    where: { status: { in: ["PENDING", "FAILED"] } },
    select: { id: true },
  });
  for (const row of failed) {
    await attemptBcSync(row.id);
  }
  await logAudit(actorId, "RETRY_ALL_SYNCS", "BcMirrorTransaction", "bulk", { count: failed.length });
  revalidatePath("/payments/reconciliation");
  return { retried: failed.length };
}

// Lazy sweep, same pattern as releaseExpiredReservations (src/lib/actions/sales.ts) — no
// background scheduler exists in this app, so overdue status is persisted on demand rather than
// on a timer. Also freezes/holds any T2/T3 commission tranche gated on that sale's account
// status (recomputeInstalmentGatedTranche in src/lib/actions/commissions.ts already reads
// PaymentSchedule.status === "OVERDUE" for its Client Account Status gate).
export async function refreshOverdueSchedules(actorId: string) {
  const due = await prisma.paymentSchedule.findMany({
    where: { status: { in: ["PENDING", "PARTIAL"] }, dueDate: { lt: new Date() } },
    select: {
      id: true,
      amountDue: true,
      dueDate: true,
      paymentPlan: {
        select: {
          saleId: true,
          currency: true,
          sale: {
            select: {
              customerId: true,
              unit: { select: { unitNumber: true, development: { select: { name: true } } } },
              opportunity: { select: { ownerId: true } },
            },
          },
        },
      },
    },
  });
  for (const row of due) {
    await prisma.paymentSchedule.update({ where: { id: row.id }, data: { status: "OVERDUE" } });
    const daysOverdue = Math.floor((Date.now() - row.dueDate.getTime()) / 86_400_000);
    // Each newly-flagged row is a fresh PENDING/PARTIAL -> OVERDUE transition, so this only ever
    // fires once per schedule (re-running the sweep skips rows already OVERDUE).
    await triggerWorkflows("PAYMENT_OVERDUE", "SALE", row.paymentPlan.saleId, row.paymentPlan.sale.opportunity?.ownerId ?? actorId, {
      customerId: row.paymentPlan.sale.customerId,
      consultantId: row.paymentPlan.sale.opportunity?.ownerId,
      UnitNumber: row.paymentPlan.sale.unit.unitNumber,
      PropertyName: row.paymentPlan.sale.unit.development.name,
      Amount: `${row.paymentPlan.currency} ${Number(row.amountDue).toLocaleString()}`,
      DaysOverdue: daysOverdue,
    });
  }
  await logAudit(actorId, "REFRESH_OVERDUE", "PaymentSchedule", "bulk", { count: due.length });
  revalidatePath("/payments");
  return { flaggedCount: due.length };
}
