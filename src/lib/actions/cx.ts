"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { slaMultiplierForSegment } from "@/lib/cx-sla";
import { triggerWorkflows } from "@/lib/workflow-engine";

function revalidateCx(complaintId?: string) {
  revalidatePath("/cx");
  if (complaintId) revalidatePath(`/cx/complaints/${complaintId}`);
}

export async function createComplaint(input: {
  customerId: string;
  unitId?: string;
  categoryId: string;
  subject: string;
  description: string;
  priority?: string;
  assignedToId?: string;
}): Promise<{ complaintId: string }> {
  const [category, customer] = await Promise.all([
    prisma.complaintCategory.findUniqueOrThrow({ where: { id: input.categoryId } }),
    prisma.customer.findUniqueOrThrow({ where: { id: input.customerId }, select: { segment: true } }),
  ]);
  const now = new Date();
  // Entitlement tiering (2026 source-docs gap analysis §4): Diaspora/Investor/Corporate get
  // faster targets than the Standard baseline, without a separate entitlement table.
  const multiplier = slaMultiplierForSegment(customer.segment);
  const complaint = await prisma.complaint.create({
    data: {
      customerId: input.customerId,
      unitId: input.unitId || undefined,
      categoryId: input.categoryId,
      subject: input.subject,
      description: input.description,
      priority: (input.priority as never) || category.defaultPriority,
      assignedToId: input.assignedToId || undefined,
      status: input.assignedToId ? "ASSIGNED" : "OPEN",
      sla: {
        create: {
          responseDueAt: new Date(now.getTime() + category.responseSlaHours * multiplier * 3600000),
          resolutionDueAt: new Date(now.getTime() + category.resolutionSlaHours * multiplier * 3600000),
        },
      },
    },
  });

  const actorId = input.assignedToId ?? (await prisma.user.findFirst({ where: { deletedAt: null }, select: { id: true } }))?.id;
  if (actorId) {
    await triggerWorkflows("COMPLAINT_CREATED", "COMPLAINT", complaint.id, actorId, {
      priority: complaint.priority,
      customerSegment: customer.segment,
    });
  }

  revalidateCx(complaint.id);
  return { complaintId: complaint.id };
}

// SLA pause/hold (2026 source-docs gap analysis §4) — stops the clock while the ball is in the
// client's or a third party's court. On resume, both due dates shift forward by the elapsed
// paused duration so the agent isn't penalized for time outside their control.
export async function pauseComplaint(complaintId: string, reason: string) {
  await prisma.complaint.update({
    where: { id: complaintId },
    data: { pausedAt: new Date(), pauseReason: reason },
  });
  revalidateCx(complaintId);
}

export async function resumeComplaint(complaintId: string) {
  const complaint = await prisma.complaint.findUniqueOrThrow({
    where: { id: complaintId },
    select: { pausedAt: true, sla: true },
  });
  if (!complaint.pausedAt) return;

  const pausedMs = Date.now() - complaint.pausedAt.getTime();
  if (complaint.sla) {
    await prisma.complaintSLA.update({
      where: { complaintId },
      data: {
        responseDueAt: complaint.sla.respondedAt ? undefined : new Date(complaint.sla.responseDueAt.getTime() + pausedMs),
        resolutionDueAt: complaint.sla.resolvedAt ? undefined : new Date(complaint.sla.resolutionDueAt.getTime() + pausedMs),
      },
    });
  }
  await prisma.complaint.update({ where: { id: complaintId }, data: { pausedAt: null, pauseReason: null } });
  revalidateCx(complaintId);
}

export async function assignComplaint(complaintId: string, userId: string) {
  const complaint = await prisma.complaint.findUniqueOrThrow({ where: { id: complaintId }, select: { status: true } });
  await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      assignedToId: userId,
      status: complaint.status === "OPEN" ? "ASSIGNED" : undefined,
    },
  });
  revalidateCx(complaintId);
}

export async function addComplaintUpdate(complaintId: string, input: { note: string; updatedById: string }) {
  await prisma.$transaction(async (tx) => {
    await tx.complaintUpdate.create({
      data: { complaintId, note: input.note, updatedById: input.updatedById },
    });
    const complaint = await tx.complaint.findUniqueOrThrow({ where: { id: complaintId }, select: { status: true } });
    if (complaint.status === "OPEN" || complaint.status === "ASSIGNED") {
      await tx.complaint.update({ where: { id: complaintId }, data: { status: "IN_PROGRESS" } });
    }
    await tx.complaintSLA.updateMany({
      where: { complaintId, respondedAt: null },
      data: { respondedAt: new Date() },
    });
  });
  revalidateCx(complaintId);
}

export async function resolveComplaint(complaintId: string, input: { note?: string; userId: string }) {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.complaint.update({ where: { id: complaintId }, data: { status: "RESOLVED", resolvedAt: now } });
    await tx.complaintSLA.updateMany({ where: { complaintId }, data: { resolvedAt: now } });
    if (input.note) {
      await tx.complaintUpdate.create({ data: { complaintId, note: input.note, updatedById: input.userId } });
    }
  });
  revalidateCx(complaintId);

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    select: { customerId: true, assignedToId: true, unit: { select: { development: { select: { name: true } } } } },
  });
  if (complaint) {
    await triggerWorkflows("COMPLAINT_RESOLVED", "COMPLAINT", complaintId, complaint.assignedToId ?? input.userId, {
      customerId: complaint.customerId,
      consultantId: complaint.assignedToId,
      PropertyName: complaint.unit?.development.name,
      ResolutionDetails: input.note,
    });
  }
}

export async function closeComplaint(complaintId: string) {
  await prisma.complaint.update({ where: { id: complaintId }, data: { status: "CLOSED", closedAt: new Date() } });
  revalidateCx(complaintId);
}

export async function reopenComplaint(complaintId: string, input: { reason: string; userId: string }) {
  await prisma.$transaction(async (tx) => {
    await tx.complaint.update({
      where: { id: complaintId },
      data: { status: "REOPENED", resolvedAt: null, closedAt: null },
    });
    await tx.complaintUpdate.create({
      data: { complaintId, note: `Reopened: ${input.reason}`, updatedById: input.userId },
    });
  });
  revalidateCx(complaintId);
}

export async function escalateComplaint(
  complaintId: string,
  input: { reason: string; fromUserId: string; toUserId: string }
) {
  await prisma.escalation.create({
    data: { complaintId, reason: input.reason, escalatedFromId: input.fromUserId, escalatedToId: input.toUserId },
  });
  revalidateCx(complaintId);
}

export async function resolveEscalation(escalationId: string, complaintId: string) {
  await prisma.escalation.update({
    where: { id: escalationId },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });
  revalidateCx(complaintId);
}

export async function scheduleHandover(input: { customerId: string; unitId: string; scheduledAt: string; actorId: string }) {
  const unit = await prisma.unit.findUniqueOrThrow({
    where: { id: input.unitId },
    select: { unitNumber: true, development: { select: { name: true } } },
  });
  await prisma.handover.create({
    data: {
      customerId: input.customerId,
      unitId: input.unitId,
      scheduledAt: new Date(input.scheduledAt),
      status: "SCHEDULED",
    },
  });
  revalidatePath("/cx");

  await triggerWorkflows("HANDOVER_SCHEDULED", "UNIT", input.unitId, input.actorId, {
    customerId: input.customerId,
    UnitNumber: unit.unitNumber,
    PropertyName: unit.development.name,
    DevelopmentName: unit.development.name,
  });
}

export async function completeHandover(handoverId: string, conductedById: string) {
  await prisma.handover.update({
    where: { id: handoverId },
    data: { status: "COMPLETED", completedAt: new Date(), conductedById },
  });

  const handover = await prisma.handover.findUnique({
    where: { id: handoverId },
    select: { customerId: true, unit: { select: { unitNumber: true, development: { select: { name: true } } } } },
  });
  if (handover) {
    await triggerWorkflows("HANDOVER_COMPLETED", "HANDOVER", handoverId, conductedById, {
      customerId: handover.customerId,
      consultantId: conductedById,
      UnitNumber: handover.unit.unitNumber,
      PropertyName: handover.unit.development.name,
      DevelopmentName: handover.unit.development.name,
    });
  }
  revalidatePath("/cx");
}

export async function cancelHandover(handoverId: string) {
  await prisma.handover.update({ where: { id: handoverId }, data: { status: "CANCELLED" } });
  revalidatePath("/cx");
}
