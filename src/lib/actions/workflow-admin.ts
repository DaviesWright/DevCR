"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function createWorkflow(input: {
  name: string;
  description?: string;
  triggerEvent: string;
  triggerConfig?: Record<string, unknown>;
  conditions?: { field: string; operator: string; value: unknown }[];
  createdById: string;
  steps: { actionType: string; actionConfig: Record<string, string> }[];
}) {
  if (input.steps.length === 0) throw new Error("A workflow needs at least one step.");

  const workflow = await prisma.workflow.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      triggerEvent: input.triggerEvent as never,
      triggerConfig: (input.triggerConfig as Prisma.InputJsonValue) ?? undefined,
      conditions: input.conditions && input.conditions.length > 0 ? (input.conditions as Prisma.InputJsonValue) : undefined,
      createdById: input.createdById,
      steps: {
        create: input.steps.map((s, i) => ({
          stepOrder: i + 1,
          actionType: s.actionType as never,
          actionConfig: s.actionConfig,
        })),
      },
    },
  });
  revalidatePath("/admin");
  return { workflowId: workflow.id };
}

export async function toggleWorkflowActive(workflowId: string, isActive: boolean) {
  await prisma.workflow.update({ where: { id: workflowId }, data: { isActive } });
  revalidatePath("/admin");
}

export async function deleteWorkflow(workflowId: string) {
  await prisma.workflow.delete({ where: { id: workflowId } });
  revalidatePath("/admin");
}

export async function createWebhook(input: { name: string; url: string; event: string; method?: string; secret?: string }) {
  const webhook = await prisma.webhook.create({
    data: {
      name: input.name.trim(),
      url: input.url.trim(),
      event: input.event.trim(),
      method: input.method || "POST",
      secret: input.secret?.trim() || null,
    },
  });
  revalidatePath("/admin");
  return { webhookId: webhook.id };
}

export async function toggleWebhookActive(webhookId: string, isActive: boolean) {
  await prisma.webhook.update({ where: { id: webhookId }, data: { isActive } });
  revalidatePath("/admin");
}

export async function deleteWebhook(webhookId: string) {
  await prisma.webhook.delete({ where: { id: webhookId } });
  revalidatePath("/admin");
}
