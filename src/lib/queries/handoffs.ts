import { prisma } from "@/lib/prisma";

export type HandoffListItem = {
  id: string;
  customerName: string;
  unitNumber: string;
  consultantName: string;
  cxLeadName: string | null;
  status: string;
  dossierComplete: boolean;
  notifiedAt: Date;
  acknowledgedAt: Date | null;
  introductionLoggedAt: Date | null;
  welcomeSentAt: Date | null;
  qualityScore: number | null;
  ackOverdue: boolean;
  welcomeOverdue: boolean;
};

export async function getHandoffsList(): Promise<HandoffListItem[]> {
  const now = new Date();
  const handoffs = await prisma.clientHandover.findMany({
    orderBy: { notifiedAt: "desc" },
    include: {
      customer: { select: { firstName: true, lastName: true } },
      sale: { select: { unit: { select: { unitNumber: true } } } },
      consultant: { select: { firstName: true, lastName: true } },
      cxLead: { select: { firstName: true, lastName: true } },
    },
  });
  return handoffs.map((h) => {
    const hoursSinceNotified = (now.getTime() - h.notifiedAt.getTime()) / 3600000;
    return {
      id: h.id,
      customerName: `${h.customer.firstName} ${h.customer.lastName}`,
      unitNumber: h.sale.unit.unitNumber,
      consultantName: `${h.consultant.firstName} ${h.consultant.lastName}`,
      cxLeadName: h.cxLead ? `${h.cxLead.firstName} ${h.cxLead.lastName}` : null,
      status: h.status,
      dossierComplete: h.dossierComplete,
      notifiedAt: h.notifiedAt,
      acknowledgedAt: h.acknowledgedAt,
      introductionLoggedAt: h.introductionLoggedAt,
      welcomeSentAt: h.welcomeSentAt,
      qualityScore: h.qualityScore,
      // Sales Playbook §6.2/§6.3 SLAs: CX Lead acknowledges within 24h,
      // first client contact (welcome communication) within 48h.
      ackOverdue: !h.acknowledgedAt && hoursSinceNotified > 24,
      welcomeOverdue: !h.welcomeSentAt && hoursSinceNotified > 48,
    };
  });
}

export async function getHandoffKpis() {
  const handoffs = await prisma.clientHandover.findMany({
    select: { status: true, notifiedAt: true, acknowledgedAt: true, welcomeSentAt: true, qualityScore: true },
  });
  const now = new Date();

  const pendingAck = handoffs.filter((h) => !h.acknowledgedAt).length;
  const welcomeOverdue = handoffs.filter(
    (h) => !h.welcomeSentAt && (now.getTime() - h.notifiedAt.getTime()) / 3600000 > 48
  ).length;
  const scored = handoffs.filter((h) => h.qualityScore !== null);
  const avgQualityScore = scored.length ? scored.reduce((sum, h) => sum + (h.qualityScore ?? 0), 0) / scored.length : null;
  const completeCount = handoffs.filter((h) => h.status === "COMPLETE").length;

  return { pendingAck, welcomeOverdue, avgQualityScore, completeCount, totalCount: handoffs.length };
}
