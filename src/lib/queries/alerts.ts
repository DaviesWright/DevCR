import { prisma } from "@/lib/prisma";
import type { HeaderAlert } from "@/components/layout/header";

/** Powers both the header notification dropdown and the dashboard alerts panel. */
export async function getHeaderAlerts(): Promise<HeaderAlert[]> {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const in48Hours = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const in30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [expiringReservations, overduePayments, staleLeads, staleNurturing] = await Promise.all([
    prisma.reservation.findMany({
      where: { status: "ACTIVE", expiryDate: { lte: in7Days, gte: now } },
      include: { unit: { select: { unitNumber: true } }, customer: { select: { firstName: true, lastName: true } } },
      orderBy: { expiryDate: "asc" },
      take: 5,
    }),
    prisma.paymentSchedule.findMany({
      where: { status: "OVERDUE" },
      include: { paymentPlan: { include: { sale: { include: { customer: true, unit: true } } } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    // "Every lead must have a task or note within 48 hours" — Sales Playbook &
    // Workflow Optimisation doc both flag this as a hard SLA, not a nice-to-have.
    prisma.lead.findMany({
      where: { status: "NEW", deletedAt: null, createdAt: { lt: in48Hours }, activities: { none: {} } },
      include: { customer: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    // The real six-month pipeline diagnostic's headline finding: leads sit in Nurturing
    // untouched for 30+ days and are effectively forgotten, not actively nurtured.
    prisma.lead.findMany({
      where: {
        status: "NURTURING",
        deletedAt: null,
        createdAt: { lt: in30Days },
        activities: { none: { occurredAt: { gte: in30Days } } },
      },
      include: { customer: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
  ]);

  const alerts: HeaderAlert[] = [];

  for (const r of expiringReservations) {
    alerts.push({
      id: `reservation-${r.id}`,
      title: "Reservation expiring soon",
      description: `Unit ${r.unit.unitNumber} — ${r.customer.firstName} ${r.customer.lastName}`,
      href: "/sales",
    });
  }

  for (const p of overduePayments) {
    const customer = p.paymentPlan.sale.customer;
    alerts.push({
      id: `payment-${p.id}`,
      title: "Payment overdue",
      description: `${customer.firstName} ${customer.lastName} — Unit ${p.paymentPlan.sale.unit.unitNumber}`,
      href: "/payments",
    });
  }

  for (const lead of staleLeads) {
    alerts.push({
      id: `stale-lead-${lead.id}`,
      title: "Lead not contacted within 48h",
      description: `${lead.customer.firstName} ${lead.customer.lastName}`,
      href: `/leads/${lead.id}`,
    });
  }

  for (const lead of staleNurturing) {
    alerts.push({
      id: `stale-nurturing-${lead.id}`,
      title: "Nurturing lead stale 30+ days",
      description: `${lead.customer.firstName} ${lead.customer.lastName}`,
      href: `/leads/${lead.id}`,
    });
  }

  return alerts;
}
