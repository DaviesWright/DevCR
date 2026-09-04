import { prisma } from "@/lib/prisma";
import { computeEscalationLevel } from "@/lib/cx-sla";

export async function getCxKpis() {
  const now = new Date();
  const [openComplaints, breachedComplaints, openEscalations, handoversThisWeek] = await Promise.all([
    prisma.complaint.count({ where: { status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS", "REOPENED"] } } }),
    prisma.complaint.count({
      where: {
        status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS", "REOPENED"] },
        sla: { resolutionDueAt: { lt: now } },
      },
    }),
    prisma.escalation.count({ where: { status: { not: "RESOLVED" } } }),
    prisma.handover.count({
      where: { status: "SCHEDULED", scheduledAt: { gte: now, lte: new Date(now.getTime() + 7 * 86400000) } },
    }),
  ]);
  return { openComplaints, breachedComplaints, openEscalations, handoversThisWeek };
}

export type ComplaintListItem = {
  id: string;
  subject: string;
  customer: string;
  unit: string | null;
  category: string;
  priority: string;
  status: string;
  assignedTo: string | null;
  openedAt: Date;
  resolutionDueAt: Date | null;
  slaBreached: boolean;
  escalationLevel: number;
  isPaused: boolean;
};

export async function getComplaintsList(): Promise<ComplaintListItem[]> {
  const now = new Date();
  const complaints = await prisma.complaint.findMany({
    orderBy: { openedAt: "desc" },
    include: {
      customer: { select: { firstName: true, lastName: true } },
      unit: { select: { unitNumber: true } },
      category: { select: { name: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
      sla: { select: { responseDueAt: true, resolutionDueAt: true, respondedAt: true, resolvedAt: true } },
    },
  });
  return complaints.map((c) => ({
    id: c.id,
    subject: c.subject,
    customer: `${c.customer.firstName} ${c.customer.lastName}`,
    unit: c.unit?.unitNumber ?? null,
    category: c.category.name,
    priority: c.priority,
    status: c.status,
    assignedTo: c.assignedTo ? `${c.assignedTo.firstName} ${c.assignedTo.lastName}` : null,
    openedAt: c.openedAt,
    resolutionDueAt: c.sla?.resolutionDueAt ?? null,
    slaBreached: Boolean(
      c.sla && !c.sla.resolvedAt && c.sla.resolutionDueAt < now && !["RESOLVED", "CLOSED"].includes(c.status)
    ),
    escalationLevel: computeEscalationLevel({
      priority: c.priority,
      status: c.status,
      openedAt: c.openedAt,
      pausedAt: c.pausedAt,
      responseDueAt: c.sla?.responseDueAt ?? null,
      resolutionDueAt: c.sla?.resolutionDueAt ?? null,
      respondedAt: c.sla?.respondedAt ?? null,
      resolvedAt: c.sla?.resolvedAt ?? null,
    }),
    isPaused: !!c.pausedAt,
  }));
}

export async function getComplaintDetail(id: string) {
  const c = await prisma.complaint.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
      unit: { select: { id: true, unitNumber: true } },
      category: { select: { name: true, responseSlaHours: true, resolutionSlaHours: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
      sla: true,
      updates: {
        orderBy: { createdAt: "desc" },
        include: { updatedBy: { select: { firstName: true, lastName: true } } },
      },
      escalations: {
        orderBy: { createdAt: "desc" },
        include: {
          escalatedFrom: { select: { firstName: true, lastName: true } },
          escalatedTo: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });
  if (!c) return null;

  const now = new Date();
  return {
    id: c.id,
    subject: c.subject,
    description: c.description,
    priority: c.priority,
    status: c.status,
    openedAt: c.openedAt,
    resolvedAt: c.resolvedAt,
    closedAt: c.closedAt,
    pausedAt: c.pausedAt,
    pauseReason: c.pauseReason,
    escalationLevel: computeEscalationLevel({
      priority: c.priority,
      status: c.status,
      openedAt: c.openedAt,
      pausedAt: c.pausedAt,
      responseDueAt: c.sla?.responseDueAt ?? null,
      resolutionDueAt: c.sla?.resolutionDueAt ?? null,
      respondedAt: c.sla?.respondedAt ?? null,
      resolvedAt: c.sla?.resolvedAt ?? null,
    }),
    category: c.category.name,
    customer: {
      id: c.customer.id,
      name: `${c.customer.firstName} ${c.customer.lastName}`,
      phone: c.customer.phone,
      email: c.customer.email,
    },
    unit: c.unit ? { id: c.unit.id, number: c.unit.unitNumber } : null,
    assignedTo: c.assignedTo ? { id: c.assignedTo.id, name: `${c.assignedTo.firstName} ${c.assignedTo.lastName}` } : null,
    sla: c.sla
      ? {
          responseDueAt: c.sla.responseDueAt,
          resolutionDueAt: c.sla.resolutionDueAt,
          respondedAt: c.sla.respondedAt,
          resolvedAt: c.sla.resolvedAt,
          responseBreached: !c.sla.respondedAt && c.sla.responseDueAt < now,
          resolutionBreached:
            !c.sla.resolvedAt && c.sla.resolutionDueAt < now && !["RESOLVED", "CLOSED"].includes(c.status),
        }
      : null,
    updates: c.updates.map((u) => ({
      id: u.id,
      note: u.note,
      by: `${u.updatedBy.firstName} ${u.updatedBy.lastName}`,
      createdAt: u.createdAt,
    })),
    escalations: c.escalations.map((e) => ({
      id: e.id,
      reason: e.reason,
      status: e.status,
      from: `${e.escalatedFrom.firstName} ${e.escalatedFrom.lastName}`,
      to: `${e.escalatedTo.firstName} ${e.escalatedTo.lastName}`,
      createdAt: e.createdAt,
      resolvedAt: e.resolvedAt,
    })),
  };
}

export type ComplaintDetail = NonNullable<Awaited<ReturnType<typeof getComplaintDetail>>>;

export type HandoverRow = {
  id: string;
  customer: string;
  unit: string;
  status: string;
  scheduledAt: Date | null;
  conductedBy: string | null;
  completedAt: Date | null;
};

export async function getHandoversList(): Promise<HandoverRow[]> {
  const handovers = await prisma.handover.findMany({
    orderBy: { scheduledAt: "desc" },
    include: {
      customer: { select: { firstName: true, lastName: true } },
      unit: { select: { unitNumber: true } },
      conductedBy: { select: { firstName: true, lastName: true } },
    },
  });
  return handovers.map((h) => ({
    id: h.id,
    customer: `${h.customer.firstName} ${h.customer.lastName}`,
    unit: h.unit.unitNumber,
    status: h.status,
    scheduledAt: h.scheduledAt,
    conductedBy: h.conductedBy ? `${h.conductedBy.firstName} ${h.conductedBy.lastName}` : null,
    completedAt: h.completedAt,
  }));
}

export async function getComplaintCategories() {
  const categories = await prisma.complaintCategory.findMany({ orderBy: { name: "asc" } });
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    defaultPriority: c.defaultPriority as string,
    responseSlaHours: c.responseSlaHours,
    resolutionSlaHours: c.resolutionSlaHours,
  }));
}

/** One row per active/completed sale — the customer+unit pairs eligible for a complaint or handover. */
export async function getCustomerUnitOptions() {
  const sales = await prisma.sale.findMany({
    where: { status: { in: ["ACTIVE", "COMPLETED"] }, deletedAt: null },
    select: {
      customerId: true,
      unitId: true,
      customer: { select: { firstName: true, lastName: true } },
      unit: { select: { unitNumber: true } },
    },
    orderBy: { saleDate: "desc" },
  });
  return sales.map((s) => ({
    customerId: s.customerId,
    unitId: s.unitId,
    label: `${s.customer.firstName} ${s.customer.lastName} — Unit ${s.unit.unitNumber}`,
  }));
}
