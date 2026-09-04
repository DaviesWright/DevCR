import { prisma } from "@/lib/prisma";

export async function getWorkflows() {
  const workflows = await prisma.workflow.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      steps: { orderBy: { stepOrder: "asc" } },
      createdBy: { select: { firstName: true, lastName: true } },
      _count: { select: { runs: true } },
    },
  });
  return workflows.map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    triggerEvent: w.triggerEvent,
    triggerConfig: w.triggerConfig as Record<string, unknown> | null,
    conditions: w.conditions as { field: string; operator: string; value: unknown }[] | null,
    isActive: w.isActive,
    createdBy: w.createdBy ? `${w.createdBy.firstName} ${w.createdBy.lastName}` : null,
    createdAt: w.createdAt,
    runCount: w._count.runs,
    steps: w.steps.map((s) => ({
      id: s.id,
      stepOrder: s.stepOrder,
      actionType: s.actionType,
      actionConfig: s.actionConfig as Record<string, string>,
    })),
  }));
}

export async function getRecentWorkflowRuns(limit = 20) {
  const runs = await prisma.workflowRun.findMany({
    orderBy: { triggeredAt: "desc" },
    take: limit,
    include: { workflow: { select: { name: true } } },
  });
  return runs.map((r) => ({
    id: r.id,
    workflowName: r.workflow.name,
    entityType: r.entityType,
    entityId: r.entityId,
    status: r.status,
    triggeredAt: r.triggeredAt,
  }));
}

export async function getWebhooks() {
  const webhooks = await prisma.webhook.findMany({ orderBy: { createdAt: "desc" } });
  return webhooks.map((w) => ({
    id: w.id,
    name: w.name,
    url: w.url,
    event: w.event,
    isActive: w.isActive,
    lastTriggeredAt: w.lastTriggeredAt,
    triggerCount: w.triggerCount,
    failureCount: w.failureCount,
  }));
}
