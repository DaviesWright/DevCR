import { prisma } from "@/lib/prisma";
import { MILESTONE_STEPS, completedStepCount, isSpaEscalated, type MilestoneChecklist } from "@/lib/commission-milestones";
import { getFieldAccess, type PermissionProfile } from "@/lib/permissions";

// SLA tiers from the Sales Workflow Optimisation doc: process by day 5,
// escalate to Sales Manager on day 6, escalate to Finance Director on day 8.
export type SlaTier = "ON_TRACK" | "DUE_SOON" | "ESCALATE_MANAGER" | "ESCALATE_FINANCE";

function slaTier(daysPending: number): SlaTier {
  if (daysPending >= 8) return "ESCALATE_FINANCE";
  if (daysPending >= 6) return "ESCALATE_MANAGER";
  if (daysPending >= 5) return "DUE_SOON";
  return "ON_TRACK";
}

export type CommissionListItem = {
  id: string;
  saleId: string;
  unitNumber: string;
  customerName: string;
  agentName: string;
  agentCode: string;
  tranche: string;
  percentage: number;
  amount: number | null;
  currency: string;
  status: string;
  holdReason: string | null;
  createdAt: Date;
  approvedAt: Date | null;
  paidAt: Date | null;
  daysPending: number;
  slaTier: SlaTier | null;
  milestoneStepsCompleted: number | null;
  milestoneStepsTotal: number | null;
  spaEscalated: boolean;
};

// Commission's owner isn't a direct column (it's agent.userId, two hops away), so this filters
// manually rather than forcing it through getDataScopeWhere's flat-field design — same
// OWN/TEAM-DEPARTMENT/ALL-SYSTEM ladder, applied to the agent's user instead of a plain field.
export async function getCommissionsList(profile: PermissionProfile): Promise<CommissionListItem[]> {
  const now = new Date();

  let agentUserWhere: Record<string, unknown> = {};
  if (profile.dataScope === "OWN") {
    agentUserWhere = { userId: profile.userId };
  } else if (profile.dataScope === "TEAM" || profile.dataScope === "DEPARTMENT") {
    agentUserWhere = profile.departmentId
      ? { user: { departmentId: profile.departmentId } }
      : { userId: profile.userId };
  }

  const amountAccess = await getFieldAccess(profile, "SALE", "amount");

  const commissions = await prisma.commission.findMany({
    where: Object.keys(agentUserWhere).length > 0 ? { agent: agentUserWhere } : undefined,
    orderBy: [{ saleId: "asc" }, { tranche: "asc" }],
    include: {
      sale: {
        select: {
          unit: { select: { unitNumber: true } },
          customer: { select: { firstName: true, lastName: true } },
          milestoneChecklist: true,
        },
      },
      agent: { select: { agentCode: true, user: { select: { firstName: true, lastName: true } } } },
    },
  });
  return commissions.map((c) => {
    const daysPending = Math.floor((now.getTime() - c.createdAt.getTime()) / 86400000);
    const isSettled = c.status === "PAID" || c.status === "VOID";
    const checklist = c.sale.milestoneChecklist as MilestoneChecklist | null;
    return {
      id: c.id,
      saleId: c.saleId,
      unitNumber: c.sale.unit.unitNumber,
      customerName: `${c.sale.customer.firstName} ${c.sale.customer.lastName}`,
      agentName: `${c.agent.user.firstName} ${c.agent.user.lastName}`,
      agentCode: c.agent.agentCode,
      tranche: c.tranche,
      percentage: c.percentage,
      amount: amountAccess === "HIDDEN" ? null : Number(c.amount),
      currency: c.currency,
      status: c.status,
      holdReason: c.holdReason,
      createdAt: c.createdAt,
      approvedAt: c.approvedAt,
      paidAt: c.paidAt,
      daysPending,
      slaTier: isSettled || c.status === "PENDING" || c.status === "HOLD" || c.status === "FROZEN" ? null : slaTier(daysPending),
      milestoneStepsCompleted: c.tranche === "T1" && checklist ? completedStepCount(checklist) : null,
      milestoneStepsTotal: c.tranche === "T1" ? MILESTONE_STEPS.length : null,
      spaEscalated: c.tranche === "T1" && checklist ? isSpaEscalated(checklist) : false,
    };
  });
}

export async function getCommissionKpis(profile: PermissionProfile) {
  let agentUserWhere: Record<string, unknown> = {};
  if (profile.dataScope === "OWN") {
    agentUserWhere = { userId: profile.userId };
  } else if (profile.dataScope === "TEAM" || profile.dataScope === "DEPARTMENT") {
    agentUserWhere = profile.departmentId ? { user: { departmentId: profile.departmentId } } : { userId: profile.userId };
  }

  const commissions = await prisma.commission.findMany({
    where: Object.keys(agentUserWhere).length > 0 ? { agent: agentUserWhere } : undefined,
    select: { amount: true, status: true, createdAt: true, paidAt: true },
  });
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const pending = commissions.filter((c) => c.status === "AWAITING_APPROVAL");
  const approved = commissions.filter((c) => c.status === "APPROVED");
  const paidThisMonth = commissions.filter((c) => c.status === "PAID" && c.paidAt && c.paidAt >= monthStart);
  const frozenOrHeld = commissions.filter((c) => c.status === "FROZEN" || c.status === "HOLD");
  const overdue = commissions.filter((c) => {
    if (c.status !== "AWAITING_APPROVAL" && c.status !== "APPROVED") return false;
    const daysPending = Math.floor((now.getTime() - c.createdAt.getTime()) / 86400000);
    return daysPending >= 6;
  });

  // $ figures are aggregates, not the raw field FieldPermission gates — gated here instead so a
  // role with SALE.amount HIDDEN can't reconstruct individual amounts by reading KPI deltas.
  const amountAccess = await getFieldAccess(profile, "SALE", "amount");
  const amountsHidden = amountAccess === "HIDDEN";

  return {
    amountsHidden,
    pendingAmount: amountsHidden ? null : pending.reduce((sum, c) => sum + Number(c.amount), 0),
    approvedAmount: amountsHidden ? null : approved.reduce((sum, c) => sum + Number(c.amount), 0),
    paidThisMonthAmount: amountsHidden ? null : paidThisMonth.reduce((sum, c) => sum + Number(c.amount), 0),
    overdueCount: overdue.length,
    frozenOrHeldCount: frozenOrHeld.length,
  };
}

export async function getSaleMilestoneDetail(saleId: string, profile: PermissionProfile) {
  const amountAccess = await getFieldAccess(profile, "SALE", "amount");
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      unit: { select: { unitNumber: true } },
      customer: { select: { firstName: true, lastName: true } },
      milestoneChecklist: { include: { managementApprovedBy: { select: { firstName: true, lastName: true } } } },
      commissions: {
        orderBy: { tranche: "asc" },
        include: { agent: { select: { agentCode: true, user: { select: { firstName: true, lastName: true } } } } },
      },
    },
  });
  if (!sale) return null;

  return {
    id: sale.id,
    unitNumber: sale.unit.unitNumber,
    customerName: `${sale.customer.firstName} ${sale.customer.lastName}`,
    salePrice: Number(sale.salePrice),
    currency: sale.currency,
    checklist: sale.milestoneChecklist
      ? {
          depositConfirmedAt: sale.milestoneChecklist.depositConfirmedAt,
          spaSignedByClientAt: sale.milestoneChecklist.spaSignedByClientAt,
          spaSignedByDevtracoAt: sale.milestoneChecklist.spaSignedByDevtracoAt,
          unitAllocatedAt: sale.milestoneChecklist.unitAllocatedAt,
          managementApprovedAt: sale.milestoneChecklist.managementApprovedAt,
          managementApprovedByName: sale.milestoneChecklist.managementApprovedBy
            ? `${sale.milestoneChecklist.managementApprovedBy.firstName} ${sale.milestoneChecklist.managementApprovedBy.lastName}`
            : null,
        }
      : null,
    tranches: sale.commissions.map((c) => ({
      id: c.id,
      tranche: c.tranche,
      percentage: c.percentage,
      amount: amountAccess === "HIDDEN" ? null : Number(c.amount),
      currency: c.currency,
      status: c.status,
      holdReason: c.holdReason,
      instalmentConfirmedAt: c.instalmentConfirmedAt,
      approvedAt: c.approvedAt,
      paidAt: c.paidAt,
      agentName: `${c.agent.user.firstName} ${c.agent.user.lastName}`,
      agentCode: c.agent.agentCode,
    })),
  };
}

export type SaleMilestoneDetail = NonNullable<Awaited<ReturnType<typeof getSaleMilestoneDetail>>>;

export type AgentSummary = {
  agentId: string;
  agentCode: string;
  name: string;
  pendingAmount: number | null;
  approvedAmount: number | null;
  paidAmount: number | null;
  commissionCount: number;
};

export async function getAgentCommissionSummary(profile: PermissionProfile): Promise<AgentSummary[]> {
  const amountAccess = await getFieldAccess(profile, "SALE", "amount");
  const amountsHidden = amountAccess === "HIDDEN";

  const agents = await prisma.salesAgent.findMany({
    where: { isActive: true },
    include: {
      user: { select: { firstName: true, lastName: true } },
      commissions: { select: { amount: true, status: true } },
    },
    orderBy: { agentCode: "asc" },
  });
  return agents.map((a) => ({
    agentId: a.id,
    agentCode: a.agentCode,
    name: `${a.user.firstName} ${a.user.lastName}`,
    pendingAmount: amountsHidden ? null : a.commissions.filter((c) => c.status === "AWAITING_APPROVAL").reduce((sum, c) => sum + Number(c.amount), 0),
    approvedAmount: amountsHidden ? null : a.commissions.filter((c) => c.status === "APPROVED").reduce((sum, c) => sum + Number(c.amount), 0),
    paidAmount: amountsHidden ? null : a.commissions.filter((c) => c.status === "PAID").reduce((sum, c) => sum + Number(c.amount), 0),
    commissionCount: a.commissions.length,
  }));
}
