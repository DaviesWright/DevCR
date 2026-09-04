"use server";

// Single write path behind the shared <InteractionActionBar> used on Lead, Opportunity, and
// Customer pages (src/components/shared/interaction-panel.tsx). Storage differs per entity —
// Lead keeps writing LeadActivity (preserves the Real-Opportunity gate and gamification hooks
// that already read it), Customer keeps its Marketing-aware sendDirectMessage/logCustomerInteraction
// (opt-outs, MarketingMessage, EngagementEvent), Opportunity is a plain generic Interaction (no
// prior storage to preserve) — but all three are driven by the exact same UI and function signature.
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logLeadActivity } from "@/lib/actions/leads";
import { logCustomerInteraction, sendDirectMessage } from "@/lib/actions/marketing";

export type InteractionEntityType = "LEAD" | "OPPORTUNITY" | "CUSTOMER";

const MESSAGE_CHANNELS = new Set(["EMAIL", "SMS", "WHATSAPP"]);

export async function logInteraction(
  entityType: InteractionEntityType,
  entityId: string,
  input: { type: string; subject?: string; notes?: string; occurredAt?: string; userId: string }
) {
  if (entityType === "LEAD") {
    // LeadActivity has no subject column — fold it into the description so nothing is dropped.
    const description = input.subject ? `${input.subject}${input.notes ? `\n${input.notes}` : ""}` : input.notes;
    await logLeadActivity(entityId, {
      type: input.type,
      description,
      occurredAt: input.occurredAt,
      createdById: input.userId,
    });
    return;
  }

  if (entityType === "CUSTOMER") {
    if (MESSAGE_CHANNELS.has(input.type)) {
      await sendDirectMessage(entityId, input.userId, {
        channel: input.type as "EMAIL" | "SMS" | "WHATSAPP",
        subject: input.subject,
        body: input.notes || "",
      });
    } else {
      await logCustomerInteraction(entityId, {
        type: input.type as "CALL" | "MEETING" | "NOTE",
        subject: input.subject,
        notes: input.notes,
        actorId: input.userId,
      });
    }
    return;
  }

  // OPPORTUNITY — no prior storage to preserve, so this is a plain generic Interaction row.
  await prisma.interaction.create({
    data: {
      type: input.type as never,
      subject: input.subject?.trim() || null,
      notes: input.notes?.trim() || null,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
      userId: input.userId,
      relatedEntityType: "OPPORTUNITY",
      relatedEntityId: entityId,
    },
  });
  revalidatePath(`/sales/opportunities/${entityId}`);
  revalidatePath("/sales");
}
