import { prisma } from "@/lib/prisma";
import { getDataScopeWhere, type PermissionProfile } from "@/lib/permissions";

// Sales Team Memorandum unit-hold policy: a unit reservation may never exceed 5 days without
// a signed SPA/contract behind it. Shared by both reservation entry points (the Opportunity
// pipeline's "Generate Reservation Form" and the Projects inventory's "Reserve Unit").
export const MAX_RESERVATION_DAYS = 5;

export async function getPipelineKanban(profile: PermissionProfile) {
  const scopeWhere = await getDataScopeWhere(profile, "ownerId");
  const opportunities = await prisma.opportunity.findMany({
    where: { deletedAt: null, ...scopeWhere },
    include: {
      customer: { select: { firstName: true, lastName: true } },
      unit: { select: { unitNumber: true } },
      owner: { select: { firstName: true, lastName: true } },
      reservations: { where: { status: "ACTIVE" }, orderBy: { expiryDate: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const now = Date.now();

  return opportunities.map((o) => {
    const reservation = o.reservations[0] ?? null;
    return {
      id: o.id,
      stage: o.stage,
      stageId: o.pipelineStageId,
      customerId: o.customerId,
      unitId: o.unitId,
      customerName: `${o.customer.firstName} ${o.customer.lastName}`,
      unitNumber: o.unit?.unitNumber ?? null,
      expectedValue: Number(o.expectedValue),
      currency: o.currency,
      probability: o.probability,
      ownerName: `${o.owner.firstName} ${o.owner.lastName}`,
      updatedAt: o.updatedAt,
      hasReservation: !!reservation,
      reservation: reservation ? { expiryDate: reservation.expiryDate, expired: reservation.expiryDate.getTime() < now } : null,
    };
  });
}

export type PipelineCard = Awaited<ReturnType<typeof getPipelineKanban>>[number];

export async function getOpportunityDetail(id: string) {
  const o = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      lead: { select: { id: true } },
      unit: { select: { unitNumber: true, currentPrice: true, currency: true, development: { select: { name: true } } } },
      owner: { select: { id: true, firstName: true, lastName: true } },
      pipelineStage: { select: { key: true, label: true, badgeVariant: true } },
      reservations: { where: { status: "ACTIVE" }, orderBy: { expiryDate: "desc" }, take: 1 },
    },
  });
  if (!o) return null;

  const reservation = o.reservations[0] ?? null;
  const now = Date.now();

  return {
    id: o.id,
    stage: o.stage,
    stageLabel: o.pipelineStage?.label ?? o.stage,
    stageBadgeVariant: o.pipelineStage?.badgeVariant ?? "default",
    probability: o.probability,
    expectedValue: Number(o.expectedValue),
    currency: o.currency,
    expectedCloseDate: o.expectedCloseDate,
    closedAt: o.closedAt,
    createdAt: o.createdAt,
    leadId: o.lead?.id ?? null,
    customer: { id: o.customer.id, name: `${o.customer.firstName} ${o.customer.lastName}`, email: o.customer.email, phone: o.customer.phone },
    unit: o.unit
      ? { unitNumber: o.unit.unitNumber, currentPrice: Number(o.unit.currentPrice), currency: o.unit.currency, developmentName: o.unit.development.name }
      : null,
    owner: { id: o.owner.id, name: `${o.owner.firstName} ${o.owner.lastName}` },
    reservation: reservation ? { expiryDate: reservation.expiryDate, expired: reservation.expiryDate.getTime() < now } : null,
  };
}

export type OpportunityDetail = NonNullable<Awaited<ReturnType<typeof getOpportunityDetail>>>;

export async function getPipelineKpis(profile: PermissionProfile) {
  const scopeWhere = await getDataScopeWhere(profile, "ownerId");
  const opportunities = await prisma.opportunity.findMany({
    where: { deletedAt: null, ...scopeWhere },
    select: { expectedValue: true, probability: true, pipelineStage: { select: { isWonStage: true, isLostStage: true } } },
  });

  const open = opportunities.filter((o) => !o.pipelineStage?.isWonStage && !o.pipelineStage?.isLostStage);
  const won = opportunities.filter((o) => o.pipelineStage?.isWonStage);
  const lost = opportunities.filter((o) => o.pipelineStage?.isLostStage);
  const closed = won.length + lost.length;

  const pipelineValue = open.reduce((sum, o) => sum + Number(o.expectedValue), 0);
  const weightedPipeline = open.reduce((sum, o) => sum + (Number(o.expectedValue) * o.probability) / 100, 0);
  const winRate = closed ? (won.length / closed) * 100 : 0;
  const avgDealSize = open.length ? pipelineValue / open.length : 0;

  return { pipelineValue, weightedPipeline, winRate, avgDealSize, openCount: open.length };
}

export async function getUnitsInventory() {
  const units = await prisma.unit.findMany({
    where: { deletedAt: null },
    include: {
      development: { select: { id: true, name: true, projectCode: true, totalUnits: true } },
      propertyType: { select: { name: true, bedrooms: true } },
      reservations: {
        where: { status: "ACTIVE" },
        orderBy: { expiryDate: "desc" },
        take: 1,
        include: { customer: { select: { firstName: true, lastName: true } } },
      },
    },
    orderBy: [{ development: { name: "asc" } }, { unitNumber: "asc" }],
  });

  const now = Date.now();

  return units.map((u) => {
    const reservation = u.reservations[0] ?? null;
    const expired = reservation ? reservation.expiryDate.getTime() < now : false;
    return {
      id: u.id,
      unitNumber: u.unitNumber,
      developmentId: u.development.id,
      developmentName: u.development.name,
      projectCode: u.development.projectCode,
      developmentTotalUnits: u.development.totalUnits,
      propertyTypeName: u.propertyType.name,
      bedrooms: u.propertyType.bedrooms,
      currentPrice: Number(u.currentPrice),
      currency: u.currency,
      status: u.status,
      reservation: reservation
        ? {
            id: reservation.id,
            customerName: `${reservation.customer.firstName} ${reservation.customer.lastName}`,
            expiryDate: reservation.expiryDate,
            reservedAt: reservation.reservedAt,
            expired,
          }
        : null,
    };
  });
}

export type UnitInventoryRow = Awaited<ReturnType<typeof getUnitsInventory>>[number];

export async function getUnitsInventoryKpis() {
  const counts = await prisma.unit.groupBy({
    by: ["status"],
    where: { deletedAt: null },
    _count: true,
  });
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count])) as Record<string, number>;
  const total = counts.reduce((sum, c) => sum + c._count, 0);
  return {
    total,
    available: byStatus.AVAILABLE ?? 0,
    reserved: byStatus.RESERVED ?? 0,
    sold: byStatus.SOLD ?? 0,
  };
}

// Reservations are made against "potential / qualified customers" — a Lead that hasn't been
// disqualified or already converted — since that's the population a sales rep is actively
// working, not the full customer base.
export async function getReservableLeads() {
  const leads = await prisma.lead.findMany({
    where: { deletedAt: null, status: { notIn: ["UNQUALIFIED", "CONVERTED"] } },
    select: { id: true, customerId: true, status: true, customer: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
  });
  return leads.map((l) => ({
    leadId: l.id,
    customerId: l.customerId,
    status: l.status,
    label: `${l.customer.firstName} ${l.customer.lastName} — ${l.status.replace(/_/g, " ")}`,
  }));
}
