import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewLeadForm } from "@/components/leads/new-lead-form";
import {
  getLeadSources,
  getCampaigns,
  getMarketingChannelGroups,
  getMarketingMediums,
  getPropertyTypes,
  getAssignableUsers,
  getCurrentUser,
  getCustomersForReferralPicker,
} from "@/lib/queries/reference";

export default async function NewLeadPage() {
  const [sources, campaigns, channelGroups, mediums, propertyTypes, assignableUsers, currentUser, referralCustomers] = await Promise.all([
    getLeadSources(),
    getCampaigns(),
    getMarketingChannelGroups(),
    getMarketingMediums(),
    getPropertyTypes(),
    getAssignableUsers(),
    getCurrentUser(),
    getCustomersForReferralPicker(),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/leads" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Leads
      </Link>
      <div>
        <h1 className="font-heading text-2xl font-semibold">New Lead</h1>
        <p className="text-sm text-muted-foreground">Capture a new contact and their interest.</p>
      </div>

      <NewLeadForm
        sources={sources}
        campaigns={campaigns}
        channelGroups={channelGroups}
        mediums={mediums}
        propertyTypes={propertyTypes}
        assignableUsers={assignableUsers}
        referralCustomers={referralCustomers}
        currentUserId={currentUser.id}
      />
    </div>
  );
}
