import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { JourneyDetailView } from "@/components/marketing/journey-detail";
import { getMarketingJourneyDetail } from "@/lib/queries/marketing";
import { getCurrentUser } from "@/lib/queries/reference";

export default async function JourneyDetailPage({ params }: { params: { id: string } }) {
  const [journey, currentUser] = await Promise.all([getMarketingJourneyDetail(params.id), getCurrentUser()]);
  if (!journey) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/marketing" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Marketing
      </Link>
      <div>
        <h1 className="font-heading text-2xl font-semibold">{journey.name}</h1>
        {journey.description && <p className="mt-1 text-sm text-muted-foreground">{journey.description}</p>}
      </div>
      <JourneyDetailView journey={journey} currentUserId={currentUser.id} />
    </div>
  );
}
