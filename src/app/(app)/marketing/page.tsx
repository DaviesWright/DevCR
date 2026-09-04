import { Users, Megaphone, Route, MessagesSquare } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonasList } from "@/components/marketing/personas-list";
import { SegmentsList } from "@/components/marketing/segments-list";
import { TemplatesList } from "@/components/marketing/templates-list";
import { CampaignsList } from "@/components/marketing/campaigns-list";
import { JourneysList } from "@/components/marketing/journeys-list";
import {
  getMarketingOverview,
  getMarketingPersonas,
  getMarketingSegments,
  getMessageTemplates,
  getMarketingCampaigns,
  getMarketingJourneys,
} from "@/lib/queries/marketing";
import { getCurrentUser } from "@/lib/queries/reference";
import { relativeTime } from "@/lib/utils";

export default async function MarketingPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const [overview, personas, segments, templates, campaigns, journeys, currentUser] = await Promise.all([
    getMarketingOverview(),
    getMarketingPersonas(),
    getMarketingSegments(),
    getMessageTemplates(),
    getMarketingCampaigns(),
    getMarketingJourneys(),
    getCurrentUser(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Marketing</h1>
        <p className="text-sm text-muted-foreground">
          Segmentation, campaigns, and journeys built on DevCRM's own customer data — sending is simulated (no
          email/SMS/WhatsApp provider configured) and AI content generation / A/B testing are schema-only for now.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <KpiCard title="Segments" value={String(overview.segmentCount)} icon={Users} tone="info" href="/marketing?tab=segments" />
        <KpiCard title="Campaigns" value={String(overview.campaignCount)} icon={Megaphone} tone="highlight" href="/marketing?tab=campaigns" />
        <KpiCard title="Journeys" value={String(overview.journeyCount)} icon={Route} tone="primary" href="/marketing?tab=journeys" />
        <KpiCard title="Messages sent" value={String(overview.messageCount)} icon={MessagesSquare} tone="success" href="/marketing?tab=campaigns" />
      </div>

      <Tabs key={searchParams.tab ?? "segments"} defaultValue={searchParams.tab ?? "segments"}>
        <TabsList>
          <TabsTrigger value="segments">Segments ({segments.length})</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="journeys">Journeys ({journeys.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="personas">Personas ({personas.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="segments">
          <SegmentsList segments={segments} currentUserId={currentUser.id} />
        </TabsContent>
        <TabsContent value="campaigns">
          <CampaignsList campaigns={campaigns} segments={segments} personas={personas} templates={templates} currentUserId={currentUser.id} />
        </TabsContent>
        <TabsContent value="journeys">
          <JourneysList journeys={journeys} segments={segments} currentUserId={currentUser.id} />
        </TabsContent>
        <TabsContent value="templates">
          <TemplatesList templates={templates} />
        </TabsContent>
        <TabsContent value="personas">
          <PersonasList personas={personas} />
        </TabsContent>
      </Tabs>

      {overview.recentEvents.length > 0 && (
        <div className="rounded-lg border border-border p-4">
          <p className="mb-3 text-sm font-medium text-foreground">Recent engagement</p>
          <div className="flex flex-col divide-y divide-border">
            {overview.recentEvents.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-foreground">
                  {e.customerName} · <span className="capitalize text-muted-foreground">{e.eventType.toLowerCase().replace(/_/g, " ")}</span>
                </span>
                <span className="text-xs text-muted-foreground">{relativeTime(e.occurredAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
