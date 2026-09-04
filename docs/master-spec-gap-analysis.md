# Master Technical Specification — Gap Analysis

Source: `DevCRM — Master Technical Specification & Development Prompt.md` — a greenfield
architecture prompt for a full event-driven CRM/marketing/automation platform (event bus,
workflow execution engine with branching, background job queues, webhook framework,
integration/credential framework, AI service abstraction, formal SLA engine, conversation
model, website tracking, revenue attribution). It is explicitly written as a multi-phase,
multi-team rebuild ("Do not attempt to build every feature simultaneously," §53) and itself
lists 10 prerequisite architecture deliverables (§56) before implementation.

This is not a scoped feature request the way the Marketing module and Omnichannel view specs
were — it describes months of platform engineering. This document does the review §56 asks
for (gap analysis against the existing build) and integrates the pieces that are genuinely
missing, cheap, and fit DevCRM's actual architecture (Next.js Server Actions + Prisma +
Postgres, no queue/cache/event-bus infrastructure) without requiring new infrastructure.
Everything else is catalogued below as a deliberate, documented gap — consistent with how
AI content generation and A/B testing were already handled in the Marketing module.

## Already covered (no action needed)

| Spec ask | Covered by |
|---|---|
| §6.1 Campaign, CampaignMember, CampaignChannel, CampaignEvent | `MarketingCampaign`, `MarketingSegmentMember` (audience), `MarketingMessage` (delivered/opened/clicked/replied timestamps = CampaignEvent) |
| §7 Segment (static/dynamic/rule-based) | `MarketingSegment` + `MarketingSegmentMember`, criteria-based, recomputed on demand |
| §8 Lead scoring (Fit/Engagement) | `BantScore` (fit-style) + `BehavioralScore` (engagement: opens/clicks/visits/meetings/calls + level) — pre-existing, not part of this pass |
| §9 Event architecture (narrow) | `EngagementEvent` (marketing/product touchpoints) + `LeadActivity` + `Interaction` — scoped event logs, not a generic bus |
| §10/§15/§16 Workflow/drip/nurture (linear) | `MarketingJourney` + `MarketingJourneyStep` + `CustomerJourney` — ordered steps, manual/simulated execution (see `marketing-spec.md`) |
| §22-ish unified touchpoint view | Omnichannel view (`/customers/[id]/channels`) — Email/SMS/WhatsApp/Phone/In-Person in one timeline |
| §23 Channel preferences / consent | `Customer.optOutEmail/Sms/Whatsapp` + `CustomerPreference.marketingOptIn` — **this pass adds** `marketingConsentAt`/`marketingConsentSource` |
| §24 MessageTemplate | `MessageTemplate` (name, channel, subject, body, variables) |
| §25 Forms & lead capture | `src/app/api/leads/capture/route.ts` (pre-existing) |
| §27 Sales automation (lead actions) | `LeadActionBar` — Qualify/Disqualify/Convert/Assign/Task/Call/Meeting/Note, plus Real Opportunities gate |
| §29 SLA (lead response) | `getHeaderAlerts()`'s "Lead not contacted within 48h" alert — an informal, non-configurable equivalent (pre-existing) |
| §30 Attribution (single/first-touch) | `Lead.sourceId` + `Lead.campaignId`, set once at creation |
| §32 Activity model | Fragmented across `LeadActivity` / `Interaction` / `MarketingMessage` / `EngagementEvent` rather than one unified table — functionally equivalent, not worth a risky consolidation for this pass |
| §39 Audit log (table existed, unused) | **This pass**: wired `AuditLog` writes into the Marketing module's consequential actions |

## Newly integrated this pass

1. **Audit logging** (§39, Rule 8 — "every automation action must be auditable"): `AuditLog`
   existed in the schema since the original build but had zero writes anywhere in the app.
   Added `logAudit()` in `src/lib/actions/marketing.ts`, now called from: segment creation,
   campaign creation, campaign send, journey creation, journey enrollment, journey step
   advancement, customer marketing-preference updates, and direct-message sends. Scoped to
   actions with real consequence — not every read or list refresh.
2. **Consent trail** (§23): `CustomerPreference.marketingConsentAt` / `marketingConsentSource`
   — stamped whenever staff update a customer's marketing preferences via the Customer 360
   panel, since that's the only consent-capture flow this app has (no public web-form consent
   widget to wire up instead).

## Deliberately out of scope (needs infrastructure this app doesn't have)

| Spec section | Why not built | 
|---|---|
| §9 generic `CustomerEvent`/event bus, §43 event-driven pipeline | Would mean re-routing every mutation through a queue this app has no infrastructure for (no Redis, no message broker). The scoped event logs above already give each domain (marketing, sales, CX) what it needs. |
| §10–§14 configurable automation engine, visual workflow builder, branching/conditions, `WorkflowExecution`/`WorkflowVersion`/`WorkflowNode` | `MarketingJourney` covers the linear-sequence case for real. A general condition/branch DSL + visual builder is a multi-week feature in its own right, not a "missing aspect" to bolt on. |
| §18–§21 provider adapter interfaces (`EmailProvider`/`SmsProvider`/`WhatsAppProvider`), real ESP/SMS/WhatsApp integration | No provider is configured anywhere in this app (matches the "simulate/log only" decision made earlier this session); an adapter interface with nothing behind it is dead code. |
| §22 `Conversation`/`ConversationMessage` (threaded inbound/outbound chat) | `MarketingMessage` and `Interaction` cover outbound + logged touchpoints; there's no inbound webhook receiver to populate a real conversation thread. |
| §26 website/behavioural tracking (`WebsiteEvent`/`TrackingSession`) | No tracking script exists on any customer-facing site; fabricating "page view" data with no source would be dishonest, same reasoning as the Omnichannel view's Website/App/Social/Chatbot/Marketplace exclusions. |
| §28 lead routing engine (round robin/territory/etc.) | Real and buildable in principle, but a genuinely new feature (not a "missing aspect" of what already exists) — flagged in `docs/backlog.md` as a candidate for a future pass rather than added speculatively here. |
| §29 formal SLA engine (configurable rules, timers, escalation) | The informal 48h "not contacted" alert already satisfies the spirit of this section for leads; a fully configurable SLA-rule table with escalation chains is new scope, not integration of an existing gap. |
| §30 multi-touch attribution (linear/weighted models) | Would require deciding what counts as a "touch" and updating it from every action call site (activity logs, campaign sends, journey steps, direct messages) — too invasive to bolt on safely in this pass; first-touch (already captured) is documented as the supported model. |
| §33 AI service abstraction, AI actions | No AI provider is configured (same reasoning as `AIContentLog` in the Marketing module — schema-only, no working "Generate" button). |
| §34 background jobs / queue-worker system | This is a request-response Next.js app with no worker process; everything here runs synchronously in Server Actions by design (documented repeatedly in `marketing-spec.md`). |
| §35 webhook framework, §36 integration framework (`Integration`/`IntegrationAccount`/credential vaulting) | No inbound webhooks exist to receive (no provider is connected); building credential storage and a webhook router with nothing on the other end would be speculative infrastructure, which CLAUDE.md's project rules explicitly discourage. |
| §37 formal API-first REST layer | This app uses Server Actions throughout, not a REST API surface, by established convention (see every other module built this session). |
| §46 workflow safety (execution limits, frequency caps, kill switches) | Only meaningful once a real automation engine with recurring/scheduled execution exists; the current manual-trigger journeys have no runaway-loop risk to guard against. |

## Where this leaves DevCRM

The core of §57's revenue lifecycle — Lead Generation → Capture → Segmentation → Scoring →
Nurturing → Qualification → Sales Handoff → Opportunity → Customer → Retention → Revenue — is
represented end to end, just without a generic automation/event-bus substrate underneath it:
Leads/BANT scoring → Real Opportunities gate → Convert → Opportunity → Sale/Commission →
ClientHandover → Customer 360 (with the new Marketing + Omnichannel panels) → Marketing
segments/campaigns/journeys feeding back in via `LeadPersonaSignal`. That is the realistic
scope for this codebase; the event-driven platform architecture described in the master spec
would be a genuine ground-up rebuild, which §53 itself says not to attempt in one pass.
