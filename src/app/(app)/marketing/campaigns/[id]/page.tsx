import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CampaignDetailView } from "@/components/marketing/campaign-detail";
import { getMarketingCampaignDetail } from "@/lib/queries/marketing";
import { getCurrentUser } from "@/lib/queries/reference";

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const [campaign, currentUser] = await Promise.all([getMarketingCampaignDetail(params.id), getCurrentUser()]);
  if (!campaign) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/marketing" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Marketing
      </Link>
      <div>
        <h1 className="font-heading text-2xl font-semibold">{campaign.name}</h1>
        {campaign.objective && <p className="mt-1 text-sm text-muted-foreground">{campaign.objective}</p>}
      </div>
      <CampaignDetailView campaign={campaign} currentUserId={currentUser.id} />
    </div>
  );
}
