import { prisma } from "@/lib/prisma";
import { tierForLifetimeValue } from "@/lib/customer-tier";
import { getDataScopeWhere, redactFields, type PermissionProfile } from "@/lib/permissions";

export type CustomerListItem = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  segment: string | null;
  kycStatus: string;
  leadCount: number;
  saleCount: number;
  complaintCount: number;
};

export async function getCustomersList(profile: PermissionProfile): Promise<CustomerListItem[]> {
  const scopeWhere = await getDataScopeWhere(profile, "assignedSalesRepId");
  const customers = await prisma.customer.findMany({
    where: { deletedAt: null, ...scopeWhere },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { leads: true, sales: true, complaints: true } } },
  });
  return customers.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    phone: c.phone,
    email: c.email,
    segment: c.segment,
    kycStatus: c.kycStatus,
    leadCount: c._count.leads,
    saleCount: c._count.sales,
    complaintCount: c._count.complaints,
  }));
}

export async function getCustomerDetail(customerId: string, profile: PermissionProfile) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      assignedSalesRep: { select: { firstName: true, lastName: true } },
      leads: {
        select: {
          id: true,
          status: true,
          qualificationStatus: true,
          createdAt: true,
          source: { select: { name: true } },
          pipelineStage: { select: { label: true, badgeVariant: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      opportunities: {
        select: { id: true, stage: true, expectedValue: true, currency: true, unit: { select: { unitNumber: true } } },
        orderBy: { updatedAt: "desc" },
      },
      sales: {
        select: {
          id: true,
          salePrice: true,
          currency: true,
          status: true,
          saleDate: true,
          unit: { select: { unitNumber: true, development: { select: { id: true, name: true } } } },
          paymentPlan: {
            select: {
              totalAmount: true,
              downPayment: true,
              status: true,
              schedules: { select: { amountDue: true, status: true } },
            },
          },
        },
        orderBy: { saleDate: "desc" },
      },
      complaints: {
        select: { id: true, subject: true, status: true, priority: true, openedAt: true },
        orderBy: { openedAt: "desc" },
      },
      handovers: {
        select: { id: true, status: true, scheduledAt: true, completedAt: true, unit: { select: { unitNumber: true } } },
        orderBy: { createdAt: "desc" },
      },
      referralsGiven: {
        select: { id: true, status: true, referralRewardStatus: true, customer: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!customer) return null;

  const sales = customer.sales.map((s) => {
    const paid = s.paymentPlan?.schedules.filter((sch) => sch.status === "PAID").reduce((sum, sch) => sum + Number(sch.amountDue), 0) ?? 0;
    const total = s.paymentPlan ? Number(s.paymentPlan.totalAmount) : Number(s.salePrice);
    const overdueCount = s.paymentPlan?.schedules.filter((sch) => sch.status === "OVERDUE").length ?? 0;
    return {
      id: s.id,
      unitNumber: s.unit.unitNumber,
      developmentName: s.unit.development.name,
      salePrice: Number(s.salePrice),
      currency: s.currency,
      status: s.status,
      saleDate: s.saleDate,
      paymentPlanStatus: s.paymentPlan?.status ?? null,
      totalAmount: total,
      paidAmount: paid,
      balance: total - paid,
      overdueInstallments: overdueCount,
    };
  });

  // Lifetime value banding (Devtraco's own "Customer Purchase Consolidation & Banding" model):
  // confirmed sales only, banded in $200K increments, plus the multi-development cross-sell flag.
  const confirmedSales = customer.sales.filter((s) => s.status === "ACTIVE" || s.status === "COMPLETED");
  const lifetimeValue = confirmedSales.reduce((sum, s) => sum + Number(s.salePrice), 0);
  const bandFloor = Math.floor(lifetimeValue / 200000) * 200000;
  const purchaseBand = lifetimeValue > 0 ? `$${bandFloor.toLocaleString()} – $${(bandFloor + 199999).toLocaleString()}` : null;
  const developmentIds = new Set(confirmedSales.map((s) => s.unit.development.id));
  const developmentNames = [...new Set(confirmedSales.map((s) => s.unit.development.name))];

  const result = {
    id: customer.id,
    name: `${customer.firstName} ${customer.lastName}`,
    phone: customer.phone,
    email: customer.email,
    nationality: customer.nationality,
    segment: customer.segment,
    kycStatus: customer.kycStatus,
    assignedSalesRep: customer.assignedSalesRep
      ? `${customer.assignedSalesRep.firstName} ${customer.assignedSalesRep.lastName}`
      : null,
    createdAt: customer.createdAt,
    lifetimeValue: lifetimeValue as number | null,
    purchaseBand,
    purchaseTier: tierForLifetimeValue(lifetimeValue),
    isMultiProjectBuyer: developmentIds.size >= 2,
    developmentNames,
    leads: customer.leads.map((l) => ({
      id: l.id,
      status: l.status,
      statusLabel: l.pipelineStage?.label ?? l.status,
      statusBadgeVariant: l.pipelineStage?.badgeVariant ?? "outline",
      qualificationStatus: l.qualificationStatus,
      source: l.source.name,
      createdAt: l.createdAt,
    })),
    opportunities: customer.opportunities.map((o) => ({
      id: o.id,
      stage: o.stage,
      expectedValue: Number(o.expectedValue),
      currency: o.currency,
      unitNumber: o.unit?.unitNumber ?? null,
    })),
    sales,
    complaints: customer.complaints.map((c) => ({
      id: c.id,
      subject: c.subject,
      status: c.status,
      priority: c.priority,
      openedAt: c.openedAt,
    })),
    handovers: customer.handovers.map((h) => ({
      id: h.id,
      status: h.status,
      scheduledAt: h.scheduledAt,
      completedAt: h.completedAt,
      unitNumber: h.unit.unitNumber,
    })),
    referralsGiven: customer.referralsGiven.map((r) => ({
      id: r.id,
      status: r.status,
      rewardStatus: r.referralRewardStatus,
      leadName: `${r.customer.firstName} ${r.customer.lastName}`,
    })),
  };

  return redactFields(result, profile, "CUSTOMER");
}

export type CustomerDetail = NonNullable<Awaited<ReturnType<typeof getCustomerDetail>>>;

// Top Purchasers league table — same lifetime-value computation as getCustomerDetail, run
// across every customer with at least one confirmed sale, ranked and classified into the
// named tiers the user specified directly.
export async function getTopPurchasers() {
  const customers = await prisma.customer.findMany({
    where: { deletedAt: null, sales: { some: { status: { in: ["ACTIVE", "COMPLETED"] } } } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      segment: true,
      sales: {
        where: { status: { in: ["ACTIVE", "COMPLETED"] } },
        select: { salePrice: true, unit: { select: { development: { select: { id: true, name: true } } } } },
      },
    },
  });

  return customers
    .map((c) => {
      const lifetimeValue = c.sales.reduce((sum, s) => sum + Number(s.salePrice), 0);
      const developmentIds = new Set(c.sales.map((s) => s.unit.development.id));
      return {
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        segment: c.segment,
        lifetimeValue,
        tier: tierForLifetimeValue(lifetimeValue),
        transactionCount: c.sales.length,
        developmentCount: developmentIds.size,
      };
    })
    .sort((a, b) => b.lifetimeValue - a.lifetimeValue);
}

export type TopPurchaser = Awaited<ReturnType<typeof getTopPurchasers>>[number];
