"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractionActionBar, InteractionTimeline, type InteractionTimelineItem } from "@/components/shared/interaction-panel";
import { logInteraction, type InteractionEntityType } from "@/lib/actions/interactions";

export function CustomerInteractions({
  customerId,
  timeline,
  currentUser,
}: {
  customerId: string;
  timeline: InteractionTimelineItem[];
  currentUser: { id: string; name: string };
}) {
  const router = useRouter();
  const entityType: InteractionEntityType = "CUSTOMER";

  async function handleSubmit(type: string, input: { subject?: string; notes?: string; occurredAt?: string }) {
    await logInteraction(entityType, customerId, { ...input, type, userId: currentUser.id });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interactions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <InteractionActionBar onSubmit={handleSubmit} loggedBy={currentUser.name} supportsSend />
        <InteractionTimeline items={timeline} />
      </CardContent>
    </Card>
  );
}
