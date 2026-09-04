import { prisma } from "@/lib/prisma";

// No background scheduler exists in this app (established convention — see
// releaseExpiredReservations in src/lib/actions/sales.ts) so "overdue" is computed lazily for
// display here (dueDate < now on a still-PENDING/PARTIAL schedule), and persisted for real only
// when refreshOverdueSchedules (src/lib/actions/payments.ts) is run.
function isLogicallyOverdue(dueDate: Date, status: string) {
  return (status === "PENDING" || status === "PARTIAL") && dueDate.getTime() < Date.now();
}

export async function getFinanceKpis() {
  const [plans, schedules] = await Promise.all([
    prisma.paymentPlan.findMany({ select: { totalAmount: true, status: true } }),
    prisma.paymentSchedule.findMany({ select: { amountDue: true, dueDate: true, status: true } }),
  ]);

  const totalContracted = plans.reduce((sum, p) => sum + Number(p.totalAmount), 0);
  const allocations = await prisma.paymentAllocation.aggregate({ _sum: { amount: true } });
  const totalCollected = Number(allocations._sum.amount ?? 0);

  const overdue = schedules.filter((s) => s.status === "OVERDUE" || isLogicallyOverdue(s.dueDate, s.status));
  const overdueAmount = overdue.reduce((sum, s) => sum + Number(s.amountDue), 0);

  return {
    totalContracted,
    totalCollected,
    totalOutstanding: Math.max(totalContracted - totalCollected, 0),
    collectionRate: totalContracted > 0 ? Math.round((totalCollected / totalContracted) * 100) : 0,
    activePlanCount: plans.filter((p) => p.status === "ACTIVE").length,
    overdueCount: overdue.length,
    overdueAmount,
  };
}

export async function getCollectionsByProject() {
  const plans = await prisma.paymentPlan.findMany({
    select: {
      totalAmount: true,
      sale: { select: { unit: { select: { development: { select: { id: true, name: true } } } } } },
      schedules: { select: { allocations: { select: { amount: true } } } },
    },
  });

  const byProject = new Map<string, { name: string; contracted: number; collected: number; saleCount: number }>();
  for (const plan of plans) {
    const dev = plan.sale.unit.development;
    const collected = plan.schedules.reduce((s, sch) => s + sch.allocations.reduce((a, al) => a + Number(al.amount), 0), 0);
    const entry = byProject.get(dev.id) ?? { name: dev.name, contracted: 0, collected: 0, saleCount: 0 };
    entry.contracted += Number(plan.totalAmount);
    entry.collected += collected;
    entry.saleCount += 1;
    byProject.set(dev.id, entry);
  }
  return [...byProject.values()].sort((a, b) => b.contracted - a.contracted);
}

export type AgingRow = {
  scheduleId: string;
  saleId: string;
  unitNumber: string;
  customerName: string;
  milestoneLabel: string | null;
  amountDue: number;
  amountPaid: number;
  dueDate: Date;
  daysOverdue: number;
};

export async function getAgingSchedules(): Promise<AgingRow[]> {
  const schedules = await prisma.paymentSchedule.findMany({
    where: { status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
    include: {
      allocations: { select: { amount: true } },
      paymentPlan: {
        select: {
          saleId: true,
          sale: { select: { unit: { select: { unitNumber: true } }, customer: { select: { firstName: true, lastName: true } } } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  const now = Date.now();
  return schedules
    .filter((s) => s.dueDate.getTime() < now)
    .map((s) => ({
      scheduleId: s.id,
      saleId: s.paymentPlan.saleId,
      unitNumber: s.paymentPlan.sale.unit.unitNumber,
      customerName: `${s.paymentPlan.sale.customer.firstName} ${s.paymentPlan.sale.customer.lastName}`,
      milestoneLabel: s.milestoneLabel,
      amountDue: Number(s.amountDue),
      amountPaid: s.allocations.reduce((sum, a) => sum + Number(a.amount), 0),
      dueDate: s.dueDate,
      daysOverdue: Math.floor((now - s.dueDate.getTime()) / 86_400_000),
    }));
}

export function agingBucket(daysOverdue: number): "current" | "d30" | "d60" | "d90" {
  if (daysOverdue <= 30) return "d30";
  if (daysOverdue <= 60) return "d60";
  if (daysOverdue <= 90) return "d90";
  return "d90";
}

export type FinancePipelineRow = {
  saleId: string;
  unitNumber: string;
  customerName: string;
  totalAmount: number;
  currency: string;
  collected: number;
  status: string;
};

export async function getFinancePipeline(): Promise<FinancePipelineRow[]> {
  const plans = await prisma.paymentPlan.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      sale: { select: { id: true, unit: { select: { unitNumber: true } }, customer: { select: { firstName: true, lastName: true } } } },
      schedules: { select: { allocations: { select: { amount: true } } } },
    },
  });
  return plans.map((p) => ({
    saleId: p.sale.id,
    unitNumber: p.sale.unit.unitNumber,
    customerName: `${p.sale.customer.firstName} ${p.sale.customer.lastName}`,
    totalAmount: Number(p.totalAmount),
    currency: p.currency,
    collected: p.schedules.reduce((s, sch) => s + sch.allocations.reduce((a, al) => a + Number(al.amount), 0), 0),
    status: p.status,
  }));
}

export type PaymentScheduleDetail = {
  saleId: string;
  unitNumber: string;
  developmentName: string;
  customerId: string;
  customerName: string;
  agentName: string | null;
  totalAmount: number;
  currency: string;
  planStatus: string;
  schedules: {
    id: string;
    installmentNo: number;
    milestoneType: string | null;
    milestoneLabel: string | null;
    dueDate: Date;
    amountDue: number;
    amountPaid: number;
    status: string;
    payments: { id: string; amount: number; method: string; reference: string | null; paidAt: Date; receiptNo: string | null }[];
  }[];
};

export async function getPaymentScheduleForSale(saleId: string): Promise<PaymentScheduleDetail | null> {
  const plan = await prisma.paymentPlan.findUnique({
    where: { saleId },
    include: {
      sale: {
        select: {
          id: true,
          unit: { select: { unitNumber: true, development: { select: { name: true } } } },
          customer: { select: { id: true, firstName: true, lastName: true } },
          opportunity: { select: { owner: { select: { firstName: true, lastName: true } } } },
        },
      },
      schedules: {
        orderBy: { installmentNo: "asc" },
        include: {
          allocations: {
            include: { payment: { select: { id: true, amount: true, method: true, reference: true, paidAt: true, receipt: { select: { receiptNo: true } } } } },
          },
        },
      },
    },
  });
  if (!plan) return null;

  return {
    saleId: plan.sale.id,
    unitNumber: plan.sale.unit.unitNumber,
    developmentName: plan.sale.unit.development.name,
    customerId: plan.sale.customer.id,
    customerName: `${plan.sale.customer.firstName} ${plan.sale.customer.lastName}`,
    agentName: plan.sale.opportunity?.owner ? `${plan.sale.opportunity.owner.firstName} ${plan.sale.opportunity.owner.lastName}` : null,
    totalAmount: Number(plan.totalAmount),
    currency: plan.currency,
    planStatus: plan.status,
    schedules: plan.schedules.map((s) => ({
      id: s.id,
      installmentNo: s.installmentNo,
      milestoneType: s.milestoneType,
      milestoneLabel: s.milestoneLabel,
      dueDate: s.dueDate,
      amountDue: Number(s.amountDue),
      amountPaid: s.allocations.reduce((sum, a) => sum + Number(a.amount), 0),
      status: s.status,
      payments: s.allocations.map((a) => ({
        id: a.payment.id,
        amount: Number(a.payment.amount),
        method: a.payment.method,
        reference: a.payment.reference,
        paidAt: a.payment.paidAt,
        receiptNo: a.payment.receipt?.receiptNo ?? null,
      })),
    })),
  };
}

// Milestone-type aggregate tiles (Reservation Deposit / SPA Execution / Construction / Handover)
// across every sale, CX-Playbook style — one tile per stage, drilling into the individual
// schedule rows at that stage (src/app/(app)/payments/milestones/[type]/page.tsx).
export const MILESTONE_TYPE_LABEL: Record<string, string> = {
  RESERVATION: "Reservation Deposit",
  SPA_EXECUTION: "SPA Execution",
  CONSTRUCTION: "Construction Milestones",
  HANDOVER: "Handover",
};

export type MilestoneTypeSummary = {
  type: string;
  label: string;
  count: number;
  totalDue: number;
  totalCollected: number;
  paidCount: number;
  overdueCount: number;
};

export async function getMilestoneTypeSummary(): Promise<MilestoneTypeSummary[]> {
  const schedules = await prisma.paymentSchedule.findMany({
    where: { milestoneType: { not: null } },
    select: { milestoneType: true, amountDue: true, status: true, dueDate: true, allocations: { select: { amount: true } } },
  });

  const byType = new Map<string, MilestoneTypeSummary>();
  for (const type of Object.keys(MILESTONE_TYPE_LABEL)) {
    byType.set(type, { type, label: MILESTONE_TYPE_LABEL[type], count: 0, totalDue: 0, totalCollected: 0, paidCount: 0, overdueCount: 0 });
  }
  for (const s of schedules) {
    const type = s.milestoneType as string;
    const entry = byType.get(type);
    if (!entry) continue;
    const collected = s.allocations.reduce((sum, a) => sum + Number(a.amount), 0);
    entry.count += 1;
    entry.totalDue += Number(s.amountDue);
    entry.totalCollected += collected;
    if (s.status === "PAID") entry.paidCount += 1;
    if (s.status === "OVERDUE" || isLogicallyOverdue(s.dueDate, s.status)) entry.overdueCount += 1;
  }
  return Array.from(byType.values());
}

export type MilestoneScheduleRow = {
  scheduleId: string;
  saleId: string;
  unitNumber: string;
  developmentName: string;
  customerName: string;
  agentName: string | null;
  milestoneLabel: string | null;
  dueDate: Date;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: string;
};

export async function getMilestoneTypeSchedules(type: string): Promise<MilestoneScheduleRow[]> {
  const schedules = await prisma.paymentSchedule.findMany({
    where: { milestoneType: type as never },
    orderBy: { dueDate: "asc" },
    include: {
      allocations: { select: { amount: true } },
      paymentPlan: {
        select: {
          saleId: true,
          currency: true,
          sale: {
            select: {
              unit: { select: { unitNumber: true, development: { select: { name: true } } } },
              customer: { select: { firstName: true, lastName: true } },
              opportunity: { select: { owner: { select: { firstName: true, lastName: true } } } },
            },
          },
        },
      },
    },
  });

  return schedules.map((s) => ({
    scheduleId: s.id,
    saleId: s.paymentPlan.saleId,
    unitNumber: s.paymentPlan.sale.unit.unitNumber,
    developmentName: s.paymentPlan.sale.unit.development.name,
    customerName: `${s.paymentPlan.sale.customer.firstName} ${s.paymentPlan.sale.customer.lastName}`,
    agentName: s.paymentPlan.sale.opportunity?.owner
      ? `${s.paymentPlan.sale.opportunity.owner.firstName} ${s.paymentPlan.sale.opportunity.owner.lastName}`
      : null,
    milestoneLabel: s.milestoneLabel,
    dueDate: s.dueDate,
    amountDue: Number(s.amountDue),
    amountPaid: s.allocations.reduce((sum, a) => sum + Number(a.amount), 0),
    currency: s.paymentPlan.currency,
    status: s.status,
  }));
}

export async function getRecentPayments(limit = 15) {
  const payments = await prisma.payment.findMany({
    orderBy: { paidAt: "desc" },
    take: limit,
    include: {
      customer: { select: { firstName: true, lastName: true } },
      receipt: { select: { receiptNo: true } },
      allocations: { select: { paymentSchedule: { select: { milestoneLabel: true, paymentPlan: { select: { saleId: true } } } } } },
    },
  });
  return payments.map((p) => ({
    id: p.id,
    customerName: `${p.customer.firstName} ${p.customer.lastName}`,
    amount: Number(p.amount),
    currency: p.currency,
    method: p.method,
    receiptNo: p.receipt?.receiptNo ?? null,
    milestoneLabel: p.allocations[0]?.paymentSchedule.milestoneLabel ?? null,
    saleId: p.allocations[0]?.paymentSchedule.paymentPlan.saleId ?? null,
    paidAt: p.paidAt,
  }));
}

export async function getBcMirrorTransactions() {
  const rows = await prisma.bcMirrorTransaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { customer: { select: { firstName: true, lastName: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    customerName: `${r.customer.firstName} ${r.customer.lastName}`,
    amount: Number(r.amount),
    currency: r.currency,
    status: r.status,
    bcJournalId: r.bcJournalId,
    syncError: r.syncError,
    retryCount: r.retryCount,
    createdAt: r.createdAt,
  }));
}

export async function getBcReconciliationSummary() {
  const grouped = await prisma.bcMirrorTransaction.groupBy({ by: ["status"], _count: { _all: true } });
  return {
    pending: grouped.find((g) => g.status === "PENDING")?._count._all ?? 0,
    synced: grouped.find((g) => g.status === "SYNCED")?._count._all ?? 0,
    failed: grouped.find((g) => g.status === "FAILED")?._count._all ?? 0,
  };
}
