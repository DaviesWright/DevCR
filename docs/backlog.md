# DevCRM Backlog

Working queue of outstanding build items, prioritized top to bottom. Source citations point to
the extracted playbook text in `.scratch/DOC*.txt` (Devtraco's own Sales Playbook, CX Playbook,
and Sales/CX Workflow Optimisation documents).

---

## 1. Sales → Customer Experience handoff chain — BUILT

Identified from **Sales Playbook §5.3–6.4** (`DOC3_Sales_Playbook.txt`) and **CX Playbook Stage 01**
(`DOC1_State2_CX_Playbook.txt`), then cross-checked against a generic developer Sales→CX handoff
framework the user supplied directly (see "Cross-check" below). This is the sequence between a
deal closing and the CX team taking ownership of the relationship.

**Important distinction**: this is a *different* handover than the existing `Handover` Prisma
model in `08-customer-experience.prisma`. That model is CX Playbook Stage 04 — the physical unit
handover after construction completes, months later. The Sales→CX handoff below happens
immediately after the deal is won, long before the unit is ready. Built as its own model,
`ClientHandover` (`prisma/schema/08-customer-experience.prisma`), surfaced as the "Sales Handoffs"
tab on `/cx`.

1. **Deal-Won completeness gate** — ⚠️ **partial.** Built as a soft checklist: the CX Lead ticks
   `dossierComplete` (+ optional `dossierNote`) while acknowledging a handoff, rather than a hard
   block on closing the deal. A true blocking gate needs Reservation Form file upload, which
   doesn't exist anywhere in the app yet — tracked as a follow-up, not done here. *Source: §5.3
   "Deal Won — Checklist"; §6.4 "Incomplete CRM record at time of handover."*
2. **Sales → CX Handover record** — ✅ **built.** `moveOpportunityStage` auto-creates a
   `ClientHandover` (status `PENDING_ACK`) the moment a deal closes won, alongside the existing
   `Sale`/`Commission`. *Source: §6.1–6.2.*
3. **Ownership transfer** — ✅ **built.** Acknowledging a handoff assigns a `cxLeadId` from the
   assignable-users pool. *Source: §6.2.*
4. **Warm client introduction — logged** — ✅ **built.** `introductionLoggedAt` timestamp, its own
   wizard step. *Source: §6.2–6.4.*
5. **CX Welcome Communication** — ✅ **built.** `welcomeSentAt` timestamp; the list computes a
   "Welcome overdue" badge past the 48h SLA, same pattern as the existing stale-lead alert.
   **Distinct from CX Playbook Stage 05 "Client Welcome Pack"**, which fires much later, after the
   physical unit handover — kept separate in the data model on purpose.
   *Source: §6.2–6.3; CX Playbook Stage 05 line 40 for the contrast.*
6. **SPA (Sale & Purchase Agreement) preparation & dispatch** — ⏳ **not built.** CX Playbook
   Stage 01 in full: auto-populate the SPA template from client/unit/price data, dispatch with
   Sales Consultant and Head of Sales copied, track status to execution, 48h reminder to archive
   the signed SPA. SLA: issued within 2 business days of reservation confirmation. Needs document
   template + dispatch infrastructure this app doesn't have yet. *Source: CX Playbook Stage 01.*
7. **Handover Quality Score** — ✅ **built.** `qualityScore` (1–10) + `qualityNote`, the wizard's
   final step, moves the handoff to `COMPLETE`. Not yet surfaced back on the Sales side (e.g. a
   Sales KPI dashboard) — the raw data exists, the feedback-loop UI doesn't. *Source: Sales
   Playbook "Sales KPIs & Performance Dashboard" table, "Handover Quality Score (CX Feedback)" row.*

**Cross-check against a generic developer Sales→CX handoff framework** (supplied by the user,
industry-generic rather than Devtraco-specific): strongly corroborates the above — its
"Sales-Led Phase" (liaising with solicitors/mortgage advisors) maps directly to backlog items 06
(Mortgage) and 07 (Sublease/Legal) below; its "After-Sales Service" (warranty claims, maintenance,
repairs) maps directly to the `WarrantyClaim`/`WorkOrder` gap in section 3 — this reframes that
gap as a **primary CX-led-phase activity**, not a minor nice-to-have, so it should be prioritized
above the other section-3 items next. Two nuances it surfaces that Devtraco's own docs don't name
explicitly:
- **Single point of contact** — named as the thing that "reassures the buyer." The `cxLeadId`
  field already gives every handoff one owner; worth carrying that discipline forward into
  whatever picks up `WarrantyClaim`/`WorkOrder` next, rather than leaving those unowned.
- **Structured property orientation** — a walkthrough explaining the unit's technical systems
  (heating, etc.) as part of handover, not just "cleaned & ready → inspect → sign." Devtraco's own
  CX Playbook Stage 04 checklist doesn't name this explicitly; consider folding an "orientation
  completed" flag into the existing `Handover` model when that gets revisited.

---

## 2. CX Playbook stages with no UI yet

- **Stage 06 — Mortgage application support**: T-6-month alert per client, bank document
  checklist, payment-advice routing to Finance/Collections.
- **Stage 07 — Sublease & ancillary agreement execution**: Legal document generation, Lands
  Commission submission tracking with milestone alerts.
- **Stage 09 — Dedicated CX reporting**: SPAs, site visits, inspections, handovers, mortgages,
  sublease/documentation, snags, complaints, accrued compensation, master client list.
- **Stage 10 — Client satisfaction surveys**: flagged as an *open design item* in Devtraco's own
  source doc — tool (Customer Voice / Forms Pro / third-party), cadence, and scoring model
  (CSAT vs. NPS) are undecided upstream, not just unbuilt here.
- **Stage 11 — Client loyalty management**: tier design, auto-enrolment on handover-complete,
  referral tracking and rewards.

## 3. Smaller CX gaps already flagged

- **`WarrantyClaim` and `WorkOrder`/`Contractor` — NEXT UP** (elevated per the cross-check above:
  named as a primary CX-led-phase activity, "After-Sales Service," not a minor gap). Models exist
  in schema but have no UI — a complaint can't yet be turned into a contractor work order.
- No file upload for `ComplaintAttachment` (photos of a snag/complaint).
- Stages 01–03 (SPA prep — see item 1.6 above, site visits during construction, internal snagging)
  have schema (`SiteVisit`, `SnaggingInspection`/`SnaggingItem`) but no UI.

## 4. Cross-cutting / infra debt

- **Lightweight "act-as" auth only** — a cookie-based user switcher (header dropdown, no
  passwords) drives ownership checks (lead read-only banner, bulk-assign restricted to managers).
  This is UI-level only — no server-side enforcement on the Server Actions themselves — a real
  RBAC layer is still a follow-up.
- No automated tests.
- Not a git repo — no commit history to fall back on.
- 5 of 11 attached business PDFs were never read (blocked by workspace folder permissions, no
  PDF-parsing library available).
- Sidebar modules still fully unbuilt: Projects, Finance, Reports, Admin. `Construction` and
  `Facilities` were removed from the sidebar entirely (not needed at this stage) — their Prisma
  schema files (`07-construction.prisma`, `09-facilities.prisma`) are untouched in case they're
  wanted again later. `Customers` (Customer 360) and `Marketing` are now both built — see §5 and
  [`docs/marketing-spec.md`](./marketing-spec.md) for what's real vs. simulated vs. schema-only
  in Marketing (AI content generation and A/B testing are schema-only; there's no AI provider
  configured and no traffic-splitting send path).

## 5. Pending design decisions

- **"Real Opportunities" lead stage + Marketing module** — ✅ **built.** Full spec in
  [`docs/real-opportunities-spec.md`](./real-opportunities-spec.md); implemented per the spec's
  own primary proposals. `Lead.status = REAL_OPPORTUNITY` sits between `QUALIFIED` and
  `CONVERTED`, gated by a 4-part check (BANT-Qualified, 2+ logged calls/meetings/site visits,
  Authority score ≥50, activity within the last 14 days) via the "Mark Real Opportunity" action on
  a lead. Captures a free-text `suspectedPersona` + note, bridged into Marketing via
  `LeadPersonaSignal` — see [`docs/marketing-spec.md`](./marketing-spec.md) for the full
  Marketing build (segmentation, campaigns, journeys, Customer 360 marketing panel) and
  [`docs/master-spec-gap-analysis.md`](./master-spec-gap-analysis.md) for how it maps against
  the "Master Technical Specification" event-driven-platform blueprint.

## 6. Candidates flagged by the Master Technical Specification gap analysis

Not built this pass (see [`docs/master-spec-gap-analysis.md`](./master-spec-gap-analysis.md)
for the full reasoning on why each needs new infrastructure or is out of proportion to
"integrate missing aspects") — kept here as forward-looking candidates, roughly in order of how
cheaply each would fit the existing Server-Actions architecture without a queue/event-bus:

- **Lead routing rules** (round robin / territory / product / score-based auto-assignment on
  lead creation) — realistic to add without new infrastructure; not added speculatively here.
- **Formal, configurable SLA rules** (beyond the existing informal 48h "not contacted" alert) —
  would need a rules table + per-rule due-by computation.
- **Journey branching** (e.g. "if the welcome email was opened, send X; else send Y") — the
  current `MarketingJourney` is a strictly linear sequence; real conditional branching is a
  meaningful upgrade to that model, not a trivial one.
- **Multi-touch attribution** — first-touch only today (`Lead.sourceId`/`campaignId` at
  creation); last-touch/linear/weighted models would need touch-tracking added to every action
  call site.

## 7. Sales Enhancement (`sales Enhancement.md`) — ✅ built, scoped

The source doc's own mockups use hardcoded names/numbers and reference models (`Deal`, Redis,
next-auth) this app doesn't have. Built the same feature set against real data instead, at
`/sales/performance`:

- **Gamification** — real, event-driven: `SalesPoint` ledger awarded on lead create/qualify/
  Real-Opportunity, site-visit logging, reservation creation, Contract stage, and Closed Won
  (`src/lib/gamification.ts`); tiers computed from point totals; 11 badges computed from real
  Opportunity/ClientHandover data (volume, speed, referrals, one quality badge off the existing
  `ClientHandover.qualityScore`, growth). Monthly/quarterly/yearly leaderboard.
- **Target Tracking** — `SalesTarget` rows (seeded for the two demo reps) vs. real Closed-Won
  Opportunity counts/value in the period, with pace and a linear-projection estimate.
- **Time-to-Close** — avg/best/worst from real `Opportunity.createdAt`→`closedAt`, plus a real
  with-site-visit-vs-without comparison. Per-stage breakdown is **not built** — there's no
  stage-transition-history table, only the current `Opportunity.stage`.
- **Deal Aging Alerts** — days since `Opportunity.updatedAt` (a faithful proxy for "days in
  current stage" since every stage move touches that field), thresholded at 14/30 days.
- **Data Quality Score** — real completeness percentages (Customer email/KYC, Lead budget/
  property type), not a decorative bar.
- **Priority Action Center** — per-rep bucketed list reusing the same signals as the header
  alerts (stale leads, reservations expiring within 48h, stalled deals).
- **Reservation hold cap** — separate from this doc but requested alongside it: every
  reservation (from the pipeline's "Generate Reservation Form" or the new `/projects` unit
  inventory) is capped at `MAX_RESERVATION_DAYS = 5`, with a live countdown badge and a manual
  "Release expired holds" sweep (no scheduler exists — same convention as everywhere else).
- **Not built**: email drip-campaign builder UI and SMS bot (Marketing already has campaigns/
  journeys — a "Site Visit Reminder" journey template is a cheap follow-up, not a new system),
  smart scheduling (needs calendar/availability data this app doesn't model), and Action Plan
  templates/automation (a real but separate feature — `ActionPlan`/`ActionPlanInstance` would
  need their own schema and UI).

## 8. Confirmed deployment from the 2026 source-docs gap analysis — ✅ built

Full reasoning in [`docs/2026-source-docs-gap-analysis.md`](./2026-source-docs-gap-analysis.md).

- **Nurture Pipeline tab + rep book-size cap** — a new tab on `/leads` (`src/lib/queries/
  nurture.ts`, `nurture-pipeline.tsx`) tracks Leads from capture through Real Opportunity —
  distinct from the post-conversion Opportunity Kanban at `/sales` — with a per-stage staleness
  threshold (30 days for Nurturing, matching the real six-month pipeline diagnostic's headline
  finding). A "Nurturing lead stale 30+ days" alert was added alongside the existing 48h check,
  and Leads Analytics gained a per-rep active-book-size table with a 40-lead capacity flag.
- **Customer lifetime-value banding** — `getCustomerDetail` now computes lifetime value across
  all of a customer's confirmed sales, banded in $200K increments (matching Devtraco's own
  "Customer Purchase Consolidation & Banding" model), plus a "Multi-project buyer" badge when a
  customer has bought across 2+ developments. Pure read, no schema change.
- **Referral tracking** — `Lead.referredByCustomerId` + `referralRewardStatus`
  (NONE/PENDING/REWARDED). Captured on the New Lead form, displayed on the lead detail page
  with a "Mark rewarded" action, and surfaced as a "Referrals made" list on Customer 360.
- **CX SLA overhaul** — `Complaint.pausedAt`/`pauseReason` for SLA hold states (due dates shift
  forward by the paused duration on resume); entitlement-based SLA tiering by customer segment
  (Diaspora/Investor get halved response/resolution targets, Corporate gets a further-reduced
  "Strategic" tier) applied at complaint creation; and a computed L0-L4 escalation level
  (`src/lib/cx-sla.ts`) shown on both the complaints list and detail page — no stored
  escalation-history table, same "no scheduler exists" convention used everywhere else in this
  app.
