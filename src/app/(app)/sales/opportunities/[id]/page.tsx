import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OpportunityDetailView } from "@/components/sales/opportunity-detail";
import { getOpportunityDetail } from "@/lib/queries/sales";
import { getInteractionTimeline } from "@/lib/queries/interactions";
import { getCurrentUser } from "@/lib/queries/reference";
import { getPermissionProfile, assertCanAccessRecord } from "@/lib/permissions";

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const [opportunity, currentUser] = await Promise.all([getOpportunityDetail(params.id), getCurrentUser()]);
  if (!opportunity) notFound();
  const timeline = await getInteractionTimeline("OPPORTUNITY", params.id, opportunity.customer.id);

  // Same server-enforced ownership check as the Lead detail page (src/lib/permissions.ts) —
  // an opportunity owned by another rep is view-only, not actionable, for a scoped role.
  const profile = await getPermissionProfile(currentUser.id);
  let canManage = !profile.isReadOnly;
  if (canManage) {
    try {
      await assertCanAccessRecord(profile, opportunity.owner.id);
    } catch {
      canManage = false;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/sales" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Sales Pipeline
      </Link>
      <OpportunityDetailView opportunity={opportunity} timeline={timeline} currentUser={{ id: currentUser.id, name: currentUser.name }} canManage={canManage} />
    </div>
  );
}
