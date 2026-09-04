"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function revalidateChecklists(runId?: string) {
  revalidatePath("/cx/playbook");
  if (runId) revalidatePath(`/cx/playbook/runs/${runId}`);
}

export async function startChecklistRun(
  templateId: string,
  input: { customerId?: string; label?: string; relatedEntityType?: string; relatedEntityId?: string; startedById: string }
): Promise<{ runId: string }> {
  const run = await prisma.checklistRun.create({
    data: {
      templateId,
      customerId: input.customerId || undefined,
      label: input.label || undefined,
      relatedEntityType: (input.relatedEntityType as never) || undefined,
      relatedEntityId: input.relatedEntityId || undefined,
      startedById: input.startedById,
    },
  });
  revalidateChecklists(run.id);
  return { runId: run.id };
}

export async function toggleChecklistStep(
  runId: string,
  stepId: string,
  completed: boolean,
  userId: string
) {
  await prisma.checklistStepCompletion.upsert({
    where: { runId_stepId: { runId, stepId } },
    create: {
      runId,
      stepId,
      completed,
      completedAt: completed ? new Date() : null,
      completedById: completed ? userId : undefined,
    },
    update: {
      completed,
      completedAt: completed ? new Date() : null,
      completedById: completed ? userId : undefined,
    },
  });

  // Auto-complete the run once every step in its template is ticked; reopen it if a step
  // gets unticked afterward — mirrors the playbook's own exit-criteria checklists.
  const run = await prisma.checklistRun.findUniqueOrThrow({
    where: { id: runId },
    include: { template: { select: { steps: { select: { id: true } } } }, completions: { select: { stepId: true, completed: true } } },
  });
  const completedStepIds = new Set(run.completions.filter((c) => c.completed).map((c) => c.stepId));
  const allDone = run.template.steps.every((s) => completedStepIds.has(s.id));

  await prisma.checklistRun.update({
    where: { id: runId },
    data: { completedAt: allDone ? new Date() : null },
  });

  revalidateChecklists(runId);
}

// Lets a step carry a note ("waiting on signed ID copy") without being ticked — the same
// upsert as toggleChecklistStep, but never flips `completed`, so a run can be saved with
// partial detail and revisited once the rest is available.
export async function updateChecklistStepNote(runId: string, stepId: string, note: string) {
  await prisma.checklistStepCompletion.upsert({
    where: { runId_stepId: { runId, stepId } },
    create: { runId, stepId, note: note || null },
    update: { note: note || null },
  });
  revalidateChecklists(runId);
}
