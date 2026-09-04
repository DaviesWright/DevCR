import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OmnichannelView } from "@/components/marketing/omnichannel-view";
import { getCustomerOmnichannelProfile } from "@/lib/queries/marketing";
import { getCurrentUser } from "@/lib/queries/reference";

export default async function CustomerChannelsPage({ params }: { params: { id: string } }) {
  const [profile, currentUser] = await Promise.all([
    getCustomerOmnichannelProfile(params.id),
    getCurrentUser(),
  ]);
  if (!profile) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/customers/${params.id}`}
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to {profile.customer.name}
      </Link>
      <div>
        <h1 className="font-heading text-2xl font-semibold">Omnichannel — {profile.customer.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every way to reach this customer, and every logged touchpoint, in one view.
        </p>
      </div>
      <OmnichannelView customerId={params.id} profile={profile} currentUserId={currentUser.id} />
    </div>
  );
}
