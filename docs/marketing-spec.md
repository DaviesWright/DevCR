# Marketing Module — Build Notes

Source: `DevCRM_marketing.md` (a generic marketing-CRM blueprint written for a Node.js /
Sequelize / RabbitMQ / Redis / Elasticsearch / SendGrid / Twilio / Azure OpenAI stack). DevCRM
is Next.js 14 App Router + Prisma + PostgreSQL with no message queue, cache layer, search
index, or configured external providers — so this doc translates the source's *intent* into
that actual stack rather than implementing its literal infrastructure, following the same
"simulate/log only" pattern already used for lead-acknowledgment emails and Reservation Form
generation elsewhere in this app.

## What's real vs. simulated vs. schema-only

| Capability | Status |
|---|---|
| Segmentation (structured criteria: buyer segment, KYC status, sentiment, min. engagement score, created-after) | **Real.** `MarketingSegment` + `MarketingSegmentMember`, recomputed synchronously on create/edit/"Refresh" — no cron, since there's no scheduler in this app. |
| Campaigns (segment + persona + template targeting) | **Real**, sending is **simulated** — "Send now" writes a real `MarketingMessage` per eligible recipient (respecting per-channel opt-outs) with a body noting "(simulated — no \<channel\> provider configured)", same as every other outbound-integration point in this app. |
| Journeys (ordered step sequences: send / wait / add-to-segment / remove-from-segment / create-task) | **Real**, execution is **manual/simulated** — "Enroll segment now" runs step 1 immediately for each member; "Advance" runs the next step. `waitHours` is recorded for display only; there's no background clock enforcing it. |
| Customer engagement score / sentiment / opt-outs | **Real** — new `Customer` columns, editable from the Customer 360 "Marketing" panel. |
| Suspected-persona bridge from Sales | **Real** — `markRealOpportunity` (Real Opportunities stage, see `real-opportunities-spec.md`) now also writes an append-only `LeadPersonaSignal` row Marketing can read. |
| AI content generation (subject lines, body copy) | **Schema-only.** `AIContentLog` table exists; no "Generate" button, since no AI provider (Azure OpenAI / OpenAI API) is configured. |
| A/B testing | **Schema-only.** `ABTest` table exists; no traffic-splitting send path to actually run one. |
| Analytics dashboard | **Partial.** Per-campaign KPIs (sent/opened/clicked/replied, rates) are real, computed from `MarketingMessage`. A dedicated cross-campaign analytics/reporting page is not built. |
| Elasticsearch-backed search/segmentation, Redis caching, RabbitMQ event bus | **Not applicable** — this app has none of that infrastructure; segment evaluation runs as a direct Postgres query via Prisma instead. |
| Omnichannel view (`OmniChannel Design Overview.md`) — radial per-customer channel diagram, quick send/log actions, interaction timeline, stats | **Real, scoped to 5 channels.** Email, SMS, WhatsApp, Phone, In-Person — each backed by real data (`MarketingMessage` for the first three, the existing `Interaction` model for Phone/In-Person). The source doc's Website / Mobile App / Social / Chatbot / Marketplace channels are **not shown** — this app has no analytics, mobile app, social, chatbot, or marketplace integration to back an "available" status for them honestly, and no `ChannelPreference`/`ChannelInteraction` tables were added since `Customer`'s opt-out columns and the existing `Interaction`/`MarketingMessage` models already cover the same ground. Sending is simulated, same as campaigns. |

## Naming

New models are prefixed `Marketing`/`AI` (`MarketingSegment`, `MarketingCampaign`,
`MarketingMessage`, `MarketingJourney`, `AIContentLog`, …) to avoid colliding with two
pre-existing, differently-scoped models: `Campaign` (lead-attribution — "which ad campaign
brought this lead in") and `Interaction` (a generic CRM touchpoint log). `EngagementEvent` and
`LeadPersonaSignal` keep their spec names since nothing in DevCRM already used them.

## Where things live

- Schema: `prisma/schema/14-marketing.prisma`, plus additive fields on `Customer`
  (`prisma/schema/03-customers.prisma`) and back-relations on `User`/`Lead`.
- Migrations: `prisma/migrations/20260902181652_marketing_module/` and
  `prisma/migrations/20260902190205_direct_message_sent/` (adds the `DIRECT_MESSAGE_SENT`
  engagement-event type for the Omnichannel view's one-off sends).
- Queries: `src/lib/queries/marketing.ts`. Actions: `src/lib/actions/marketing.ts`.
- UI: `/marketing` (Segments / Campaigns / Journeys / Templates / Personas tabs), a "Marketing"
  panel on the Customer 360 page (`src/components/marketing/customer-marketing-panel.tsx`), and
  `/customers/[id]/channels` (`src/components/marketing/omnichannel-view.tsx`), linked from that
  panel's "Omnichannel" button.
- Seed demo data: end of `prisma/seed.ts` — a Diaspora persona/segment, a sent welcome
  campaign, a 2-step nurture journey, a preferred-channel preference, and a logged call +
  meeting, all against John Doe (the existing Real Opportunities demo lead).
