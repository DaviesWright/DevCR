// Core dispatcher — called synchronously from inside the existing action that performs the
// triggering event (createLead, moveOpportunityStage, createComplaint, etc.). No queue/cron:
// same "computed live, not scheduled" pattern used everywhere else in this app.
import { prisma } from "@/lib/prisma";
import { logInteraction } from "@/lib/actions/interactions";
import { sendEmail } from "@/lib/integrations/email-sender";
import { isSmtpConfigured } from "@/lib/integrations/config";
import type { RelatedEntityType } from "@prisma/client";

// {{ClientName}} / {{PropertyName}} / {{UnitNumber}} / {{ConsultantName}} / {{Amount}} / etc. —
// direct substitution against whatever the trigger site put in `context`, using the exact
// PascalCase keys the Devtraco email template spec (Aug 2026) uses as variable names.
function mergeTemplate(text: string, vars: Record<string, unknown>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = vars[key];
    return value === undefined || value === null ? match : String(value);
  });
}

type Condition = { field: string; operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte"; value: unknown };

// The triggering entity's relevant fields, flattened for condition evaluation — callers build
// this from whatever they already have in hand (no extra query needed in the common case).
type TriggerContext = Record<string, unknown>;

function evaluateConditions(conditions: Condition[] | null | undefined, context: TriggerContext): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((c) => {
    const actual = context[c.field];
    switch (c.operator) {
      case "eq":
        return actual === c.value;
      case "ne":
        return actual !== c.value;
      case "gt":
        return typeof actual === "number" && typeof c.value === "number" && actual > c.value;
      case "gte":
        return typeof actual === "number" && typeof c.value === "number" && actual >= c.value;
      case "lt":
        return typeof actual === "number" && typeof c.value === "number" && actual < c.value;
      case "lte":
        return typeof actual === "number" && typeof c.value === "number" && actual <= c.value;
      default:
        return false;
    }
  });
}

function matchesTriggerConfig(config: Record<string, unknown> | null | undefined, context: TriggerContext): boolean {
  if (!config) return true;
  return Object.entries(config).every(([key, value]) => context[key] === value);
}

async function executeStep(
  step: { stepOrder: number; actionType: string; actionConfig: unknown },
  entityType: RelatedEntityType,
  entityId: string,
  actorId: string,
  context: TriggerContext
): Promise<{ stepOrder: number; actionType: string; ok: boolean; error?: string }> {
  const config = (step.actionConfig ?? {}) as Record<string, string | undefined>;
  try {
    if (step.actionType === "CREATE_TASK") {
      await prisma.task.create({
        data: {
          relatedEntityType: entityType,
          relatedEntityId: entityId,
          title: config.title || "Workflow task",
          description: config.description || null,
          assignedToId: config.assignedToId || actorId,
          priority: (config.priority as never) || "MEDIUM",
        },
      });
    } else if (step.actionType === "LOG_INTERACTION") {
      if (entityType === "LEAD" || entityType === "OPPORTUNITY" || entityType === "CUSTOMER") {
        await logInteraction(entityType, entityId, {
          type: "NOTE",
          subject: config.subject || "Automated by workflow",
          notes: config.notes || "",
          userId: actorId,
        });
      } else {
        await prisma.interaction.create({
          data: {
            type: "NOTE",
            subject: config.subject || "Automated by workflow",
            notes: config.notes || null,
            userId: actorId,
            relatedEntityType: entityType,
            relatedEntityId: entityId,
          },
        });
      }
    } else if (step.actionType === "CALL_WEBHOOK") {
      const webhookId = config.webhookId;
      if (!webhookId) throw new Error("No webhook configured for this step.");
      const webhook = await prisma.webhook.findUniqueOrThrow({ where: { id: webhookId } });
      if (!webhook.isActive) throw new Error(`Webhook "${webhook.name}" is inactive.`);

      const payload = { event: webhook.event, entityType, entityId, triggeredAt: new Date().toISOString() };
      const startedAt = Date.now();
      let responseCode: number | null = null;
      let responseBody: string | null = null;
      let error: string | null = null;
      try {
        const res = await fetch(webhook.url, {
          method: webhook.method,
          headers: {
            "Content-Type": "application/json",
            ...((webhook.headers as Record<string, string> | null) ?? {}),
            ...(webhook.secret ? { "X-Webhook-Secret": webhook.secret } : {}),
          },
          body: JSON.stringify(payload),
        });
        responseCode = res.status;
        responseBody = (await res.text()).slice(0, 2000);
        if (!res.ok) error = `HTTP ${res.status}`;
      } catch (err) {
        error = err instanceof Error ? err.message : "Request failed.";
      }
      const durationMs = Date.now() - startedAt;

      await prisma.$transaction([
        prisma.webhookLog.create({
          data: { webhookId: webhook.id, payload, responseCode, responseBody, error, durationMs, status: error ? "FAILED" : "SUCCESS" },
        }),
        prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            lastTriggeredAt: new Date(),
            triggerCount: { increment: 1 },
            failureCount: error ? { increment: 1 } : undefined,
          },
        }),
      ]);
      if (error) throw new Error(error);
    } else if (step.actionType === "SEND_EMAIL") {
      if (!config.templateId) throw new Error("No email template configured for this step.");
      const template = await prisma.messageTemplate.findUniqueOrThrow({ where: { id: config.templateId } });

      const customerId = context.customerId as string | undefined;
      if (!customerId) throw new Error("No customer resolved for this event — can't send a client email.");
      const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId }, select: { firstName: true, lastName: true, email: true } });

      const recipient = config.recipient === "CONSULTANT" ? "CONSULTANT" : "CUSTOMER";
      let toEmail: string | null;
      if (recipient === "CONSULTANT") {
        const consultantId = (context.consultantId as string | undefined) || actorId;
        const consultant = await prisma.user.findUnique({ where: { id: consultantId }, select: { email: true, firstName: true, lastName: true } });
        toEmail = consultant?.email ?? null;
        context = { ...context, ConsultantName: consultant ? `${consultant.firstName} ${consultant.lastName}` : undefined };
      } else {
        toEmail = customer.email;
      }
      if (!toEmail) throw new Error(`No email address on file for the ${recipient.toLowerCase()}.`);

      const mergeVars = { ClientName: `${customer.firstName} ${customer.lastName}`, ...context };
      const subject = mergeTemplate(template.subject || template.name, mergeVars);
      const body = mergeTemplate(template.bodyText || template.bodyHtml || "", mergeVars);

      let status: "SENT" | "FAILED" = "SENT";
      let sendError: string | null = null;
      if (isSmtpConfigured()) {
        try {
          await sendEmail({ to: toEmail, subject, text: body });
        } catch (err) {
          status = "FAILED";
          sendError = err instanceof Error ? err.message : "Send failed.";
        }
      }

      await prisma.marketingMessage.create({
        data: {
          customerId,
          channel: "EMAIL",
          templateId: template.id,
          subject,
          body: isSmtpConfigured() ? body : `${body}\n\n[SMTP not configured — simulated, not actually sent to ${toEmail}]`,
          status,
          sentAt: status === "SENT" ? new Date() : null,
        },
      });
      if (sendError) throw new Error(sendError);
    }
    return { stepOrder: step.stepOrder, actionType: step.actionType, ok: true };
  } catch (err) {
    return { stepOrder: step.stepOrder, actionType: step.actionType, ok: false, error: err instanceof Error ? err.message : "Step failed." };
  }
}

export async function triggerWorkflows(
  event: string,
  entityType: RelatedEntityType,
  entityId: string,
  actorId: string,
  context: TriggerContext = {}
): Promise<void> {
  const workflows = await prisma.workflow.findMany({
    where: { triggerEvent: event as never, isActive: true },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });

  for (const workflow of workflows) {
    if (!matchesTriggerConfig(workflow.triggerConfig as Record<string, unknown> | null, context)) continue;
    if (!evaluateConditions(workflow.conditions as Condition[] | null, context)) continue;

    const results = [];
    for (const step of workflow.steps) {
      results.push(await executeStep(step, entityType, entityId, actorId, context));
    }
    const allOk = results.every((r) => r.ok);
    const noneOk = results.every((r) => !r.ok);

    await prisma.workflowRun.create({
      data: {
        workflowId: workflow.id,
        entityType,
        entityId,
        status: results.length === 0 ? "SUCCESS" : allOk ? "SUCCESS" : noneOk ? "FAILED" : "PARTIAL",
        stepResults: results,
      },
    });
  }
}
