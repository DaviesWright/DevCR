// Devtraco Property Sale Payment & Financial Process Flow (v1.0, July 2026), built on the
// existing PaymentPlan/PaymentSchedule/Payment/Receipt models (prisma/schema/06-finance.prisma)
// rather than the spec's own from-scratch schema. Two responsibilities:
//   1. generatePaymentPlan — the 7-stage milestone schedule, created once per Sale (Closed Won),
//      with CONSTRUCTION rows tagged to the unit's real ConstructionStage rows when they exist.
//   2. recordPayment — the one place a Payment/PaymentAllocation/Receipt/BcMirrorTransaction get
//      created, used both by the auto-recorded reservation-deposit payment below and by the
//      user-facing "Record Payment" action in src/lib/actions/payments.ts.
import { prisma } from "@/lib/prisma";
import { isBCConfigured } from "@/lib/integrations/config";
import { postPaymentToBC, syncCustomerToBC } from "@/lib/integrations/business-central";
import { triggerWorkflows } from "@/lib/workflow-engine";

type MilestoneType = "RESERVATION" | "SPA_EXECUTION" | "CONSTRUCTION" | "HANDOVER";

const STANDARD_SCHEDULE: { type: MilestoneType; label: string; percentage: number }[] = [
  { type: "RESERVATION", label: "Reservation Deposit", percentage: 10 },
  { type: "SPA_EXECUTION", label: "SPA Execution Payment", percentage: 15 },
  { type: "CONSTRUCTION", label: "Construction Milestone 1", percentage: 20 },
  { type: "CONSTRUCTION", label: "Construction Milestone 2", percentage: 20 },
  { type: "CONSTRUCTION", label: "Construction Milestone 3", percentage: 15 },
  { type: "CONSTRUCTION", label: "Construction Milestone 4", percentage: 10 },
  { type: "HANDOVER", label: "Handover / Completion", percentage: 10 },
];

const DAY = 86_400_000;

// Idempotent — Sale.paymentPlan is @unique, so calling this twice for the same sale (e.g. a
// Closed Won card dragged back and forth) is a no-op the second time, same guard style as the
// Sale/Commission creation it sits beside in src/lib/actions/sales.ts.
export async function generatePaymentPlan(saleId: string, actorId: string) {
  const existing = await prisma.paymentPlan.findUnique({ where: { saleId } });
  if (existing) return existing;

  const sale = await prisma.sale.findUniqueOrThrow({
    where: { id: saleId },
    select: {
      id: true,
      salePrice: true,
      currency: true,
      customerId: true,
      saleDate: true,
      unit: {
        select: {
          id: true,
          development: {
            select: {
              expectedCompletionDate: true,
              constructionStages: {
                where: { status: { not: "COMPLETED" } },
                orderBy: { sequence: "asc" },
                take: 4,
                select: { id: true, name: true, plannedStart: true, plannedEnd: true },
              },
            },
          },
        },
      },
    },
  });
  const reservation = await prisma.reservation.findFirst({
    where: { unitId: sale.unit.id, customerId: sale.customerId },
    orderBy: { reservedAt: "desc" },
    select: { id: true, reservationFee: true, reservedAt: true },
  });

  const total = Number(sale.salePrice);
  const stages = sale.unit.development.constructionStages;
  const completionDate = sale.unit.development.expectedCompletionDate;
  const spaDueDate = new Date(sale.saleDate.getTime() + 30 * DAY);

  type Row = { type: MilestoneType; label: string; amountDue: number; dueDate: Date; constructionStageId: string | null };

  const reservationRow: Row = {
    type: "RESERVATION",
    label: "Reservation Deposit",
    amountDue: reservation ? Number(reservation.reservationFee) : Math.round(0.1 * total),
    dueDate: reservation?.reservedAt ?? sale.saleDate,
    constructionStageId: null,
  };
  const spaRow: Row = {
    type: "SPA_EXECUTION",
    label: "SPA Execution Payment",
    amountDue: Math.round(0.15 * total),
    dueDate: spaDueDate,
    constructionStageId: null,
  };

  // CONSTRUCTION rows: one per real ConstructionStage (up to 4, taken above), splitting the
  // pooled 65% (20+20+15+10) evenly across however many real stages actually exist — falls back
  // to the 4 generic labeled rows, evenly spaced to the development's expected completion date,
  // when the development has no stages defined yet. Computed before HANDOVER so its due date can
  // be anchored to the last construction milestone (must be built before the handover, always).
  const constructionPoolPct = STANDARD_SCHEDULE.filter((s) => s.type === "CONSTRUCTION").reduce((s, r) => s + r.percentage, 0);
  const constructionRows: Row[] =
    stages.length > 0
      ? stages.map((stage, i) => ({
          type: "CONSTRUCTION" as const,
          label: stage.name,
          amountDue: Math.round(((constructionPoolPct / stages.length) / 100) * total),
          dueDate: stage.plannedEnd ?? stage.plannedStart ?? new Date(spaDueDate.getTime() + (i + 1) * 90 * DAY),
          constructionStageId: stage.id,
        }))
      : STANDARD_SCHEDULE.filter((s) => s.type === "CONSTRUCTION").map((step, i, arr) => {
          const span = completionDate ? (completionDate.getTime() - spaDueDate.getTime()) / (arr.length + 1) : 90 * DAY;
          return {
            type: "CONSTRUCTION" as const,
            label: step.label,
            amountDue: Math.round((step.percentage / 100) * total),
            dueDate: new Date(spaDueDate.getTime() + span * (i + 1)),
            constructionStageId: null,
          };
        });

  const lastConstructionDue = constructionRows.at(-1)?.dueDate ?? spaDueDate;
  const handoverRow: Row = {
    type: "HANDOVER",
    label: "Handover / Completion",
    amountDue: Math.round(0.1 * total),
    dueDate:
      completionDate && completionDate.getTime() > lastConstructionDue.getTime()
        ? completionDate
        : new Date(lastConstructionDue.getTime() + 30 * DAY),
    constructionStageId: null,
  };

  const orderedRows = [reservationRow, spaRow, ...constructionRows, handoverRow];

  const plan = await prisma.paymentPlan.create({
    data: {
      saleId,
      totalAmount: total,
      currency: sale.currency,
      downPayment: orderedRows[0].amountDue,
      status: "ACTIVE",
      schedules: {
        create: orderedRows.map((row, i) => ({
          installmentNo: i + 1,
          dueDate: row.dueDate,
          amountDue: row.amountDue,
          currency: sale.currency,
          milestoneType: row.type,
          milestoneLabel: row.label,
          constructionStageId: row.constructionStageId,
        })),
      },
    },
    include: { schedules: { orderBy: { installmentNo: "asc" } } },
  });

  // The reservation fee was already collected before Closed Won (Reservation Form / Reserve
  // Unit flow) — record it as paid immediately rather than asking the client to pay it twice.
  if (reservation) {
    const reservationSchedule = plan.schedules[0];
    await recordPayment({
      scheduleId: reservationSchedule.id,
      customerId: sale.customerId,
      saleId,
      amount: Number(reservation.reservationFee),
      method: "BANK_TRANSFER",
      reference: `RES-${reservation.id.slice(-8).toUpperCase()}`,
      notes: "Reservation deposit collected prior to Closed Won — recorded automatically.",
      actorId,
    });
  }

  return plan;
}

async function nextReceiptNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);
  const count = await prisma.receipt.count({ where: { issuedAt: { gte: yearStart } } });
  return `REC-${year}-${String(count + 1).padStart(4, "0")}`;
}

// Best-effort — a BC outage or missing config never blocks the CRM-side payment record. The
// mirror row is always created so /payments/reconciliation has something real to show and retry.
async function tryPostToBC(input: {
  paymentId: string;
  customerId: string;
  saleId: string | null;
  amount: number;
  currency: string;
  paidAt: Date;
  reference: string | null;
}) {
  const mirror = await prisma.bcMirrorTransaction.create({
    data: {
      paymentId: input.paymentId,
      customerId: input.customerId,
      saleId: input.saleId,
      transactionType: "customerPayments",
      amount: input.amount,
      currency: input.currency,
      transactionDate: input.paidAt,
      status: "PENDING",
    },
  });

  if (!isBCConfigured()) return mirror;
  await attemptBcSync(mirror.id);
  return mirror;
}

export async function attemptBcSync(mirrorTransactionId: string) {
  const mirror = await prisma.bcMirrorTransaction.findUniqueOrThrow({
    where: { id: mirrorTransactionId },
    include: { customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
  });

  try {
    let bcCustomer = await prisma.bcMirrorCustomer.findUnique({ where: { customerId: mirror.customerId } });
    if (!bcCustomer?.bcCustomerNo) {
      const synced = await syncCustomerToBC({
        displayName: `${mirror.customer.firstName} ${mirror.customer.lastName}`,
        email: mirror.customer.email,
        phone: mirror.customer.phone,
      });
      bcCustomer = await prisma.bcMirrorCustomer.upsert({
        where: { customerId: mirror.customerId },
        update: { bcCustomerNo: synced.bcCustomerNo, status: "SYNCED", lastSyncedAt: new Date(), syncError: null },
        create: { customerId: mirror.customerId, bcCustomerNo: synced.bcCustomerNo, status: "SYNCED", lastSyncedAt: new Date() },
      });
    }

    const posted = await postPaymentToBC({
      bcCustomerNo: bcCustomer.bcCustomerNo!,
      amount: Number(mirror.amount),
      postingDate: mirror.transactionDate,
      description: "DevCRM property sale payment",
      externalDocumentNumber: mirror.paymentId,
    });

    await prisma.bcMirrorTransaction.update({
      where: { id: mirror.id },
      data: { status: "SYNCED", bcJournalId: posted.bcJournalId, bcPostedAt: new Date(), syncError: null },
    });
  } catch (err) {
    await prisma.bcMirrorTransaction.update({
      where: { id: mirror.id },
      data: { status: "FAILED", syncError: err instanceof Error ? err.message : String(err), retryCount: { increment: 1 } },
    });
  }
}

export async function recordPayment(input: {
  scheduleId: string;
  customerId: string;
  saleId: string;
  amount: number;
  method: "CASH" | "BANK_TRANSFER" | "MOBILE_MONEY" | "CARD" | "CHEQUE" | "OTHER";
  reference: string | null;
  notes: string | null;
  actorId: string;
}) {
  const schedule = await prisma.paymentSchedule.findUniqueOrThrow({
    where: { id: input.scheduleId },
    include: { paymentPlan: { select: { currency: true } } },
  });

  const payment = await prisma.payment.create({
    data: {
      customerId: input.customerId,
      amount: input.amount,
      currency: schedule.paymentPlan.currency,
      method: input.method,
      reference: input.reference,
      notes: input.notes,
      recordedById: input.actorId,
      allocations: { create: [{ paymentScheduleId: input.scheduleId, amount: input.amount }] },
      receipt: { create: { receiptNo: await nextReceiptNumber() } },
    },
    include: { receipt: true },
  });

  const allocated = await prisma.paymentAllocation.aggregate({
    where: { paymentScheduleId: input.scheduleId },
    _sum: { amount: true },
  });
  const totalAllocated = Number(allocated._sum.amount ?? 0);
  await prisma.paymentSchedule.update({
    where: { id: input.scheduleId },
    data: { status: totalAllocated >= Number(schedule.amountDue) ? "PAID" : "PARTIAL" },
  });

  await tryPostToBC({
    paymentId: payment.id,
    customerId: input.customerId,
    saleId: input.saleId,
    amount: input.amount,
    currency: schedule.paymentPlan.currency,
    paidAt: payment.paidAt,
    reference: input.reference,
  });

  const sale = await prisma.sale.findUnique({
    where: { id: input.saleId },
    select: { unit: { select: { unitNumber: true, development: { select: { name: true } } } }, opportunity: { select: { ownerId: true } } },
  });
  await triggerWorkflows("PAYMENT_RECORDED", "SALE", input.saleId, sale?.opportunity?.ownerId ?? input.actorId, {
    customerId: input.customerId,
    consultantId: sale?.opportunity?.ownerId,
    UnitNumber: sale?.unit.unitNumber,
    PropertyName: sale?.unit.development.name,
    Amount: `${schedule.paymentPlan.currency} ${input.amount.toLocaleString()}`,
    ReceiptNumber: payment.receipt?.receiptNo,
    Balance: `${schedule.paymentPlan.currency} ${Math.max(Number(schedule.amountDue) - totalAllocated, 0).toLocaleString()}`,
  });

  return payment;
}
