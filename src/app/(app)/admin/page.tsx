import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailIntegrations } from "@/components/admin/email-integrations";
import { RolesOverview } from "@/components/admin/roles-overview";
import { MarketingChannelsPanel } from "@/components/admin/marketing-channels-panel";
import { getEmailConnectionsForUser } from "@/lib/actions/integrations";
import { getRolesOverview } from "@/lib/queries/roles";
import { getCurrentUser, getMarketingChannelGroups, getMarketingMediums } from "@/lib/queries/reference";
import { isGoogleConfigured, isMicrosoftConfigured } from "@/lib/integrations/config";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();
  const [connections, roles, channelGroups, mediums] = await Promise.all([
    getEmailConnectionsForUser(currentUser.id),
    getRolesOverview(),
    getMarketingChannelGroups(false),
    getMarketingMediums(false),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-muted-foreground">Workspace and integration settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email &amp; calendar sync</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Connect your own Gmail or Outlook account to pull your real sent/received emails and calendar events into
            each customer's timeline — no more re-typing what you already sent. Sync is on-demand ("Sync now") since
            this app has no public URL for a real-time push subscription.
          </p>
          <EmailIntegrations
            connections={connections}
            googleConfigured={isGoogleConfigured()}
            microsoftConfigured={isMicrosoftConfigured()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roles &amp; permissions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            The 24 roles from the Devtraco CRM Roles &amp; Permissions Specification — data scope controls which
            records a role can see/edit (Own → Team → Department → All → System), report scope controls which
            reports, and read-only roles (Executives) never get a write action. Switch accounts (top right) to see
            these enforced live — try Group Chief Executive Officer, Client Experience Officer, or Sales Agent.
          </p>
          <RolesOverview roles={roles} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Marketing channels</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            The lead-attribution taxonomy (Channel → Source → Campaign → Medium → Touchpoint) — a configurable master
            table, not a hard-coded list. Click a chip to activate/deactivate it; deactivated values stop appearing
            in the New Lead form but stay attached to any lead that already used them. Separate from the Email/SMS/
            WhatsApp send channels used elsewhere in Marketing.
          </p>
          <MarketingChannelsPanel groups={channelGroups} mediums={mediums} />
        </CardContent>
      </Card>
    </div>
  );
}
