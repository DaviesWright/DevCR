# "Real Opportunities" Lead Stage + Marketing Module Placeholder — Spec

Status: **DRAFT — for review.** Nothing in `Lead.status` or the schema changes until this is
approved; the only code change made alongside this doc is the "Marketing" sidebar placeholder
(§4), which is additive and reversible.

---

## 1. Lifecycle step: "Real Opportunities"

**Where it sits.** DevCRM's current Lead pipeline is:

```
NEW → CONTACTED → NURTURING → QUALIFIED → CONVERTED
              ↘ NO_RESPONSE      ↘ UNQUALIFIED
```

`QUALIFIED` today means "passed BANT+ scoring on paper" (`bantScore` crosses the threshold via
`scoreLead`). It does not mean the lead has *proven* real, sustained buying intent — a lead can
score well on a single call and then go quiet. **Real Opportunities** is the checkpoint between
those two things: a `QUALIFIED` lead that has also demonstrated verified, ongoing engagement,
making it worth the structured nurturing effort described in §2, and a strong candidate for
`convertLead` (→ `Opportunity`) once next steps are agreed.

**Purpose in the conversion process.** It filters signal from noise. Not every BANT-qualified
lead is a real opportunity yet — some score well but stall. Restricting nurturing investment (site
visits, mortgage pre-qual conversations, decision-maker mapping) to leads that have *earned* Real
Opportunity status protects Sales time and gives Marketing (once built) a cleaner signal for
persona-driven retargeting instead of working off raw lead volume.

**Proposed model:** a new `Lead.status` value, `REAL_OPPORTUNITY`, inserted between `QUALIFIED`
and `CONVERTED`:

```
NEW → CONTACTED → NURTURING → QUALIFIED → REAL_OPPORTUNITY → CONVERTED
```

**Entry criteria** (all required — this is the "lead-to-real-opportunity" gate):
- `qualificationStatus = QUALIFIED` (existing BANT+ gate, unchanged)
- At least 2 logged `LeadActivity` records of type `CALL`, `MEETING`, or `SITE_VISIT` (not `NOTE`
  or `EMAIL` alone) — proves two-way engagement, not just outbound noise
- `authority` pillar of the BANT breakdown ≥ 50 — some evidence the contact is or can reach the
  actual decision-maker
- No open `NO_RESPONSE` gap > 14 days in the activity log

**Exit criteria** (moves to `CONVERTED` via the existing `convertLead` action, unchanged): unit
selected, expected value agreed, `Opportunity` created. No new exit gate is proposed — conversion
stays exactly as it works today.

---

## 2. Nurturing phase for Real Opportunities

**Required activities** (each becomes a `LeadActivity` row via the existing `logLeadActivity`
action — no new activity infrastructure needed, only a cadence/content expectation layered on
top):

| Activity | Cadence | Logged as | Notes |
|---|---|---|---|
| Scheduled touchpoint | Every 5–7 business days | `CALL` or `EMAIL` | Cadence violation should surface the same way `NO_RESPONSE`-style staleness already does |
| Property-specific engagement | At least once during the phase | `SITE_VISIT` or `MEETING` | Brochure/pricing sheet sent, virtual tour, or physical visit |
| Financial readiness check | Once, before conversion | `CALL` or `MEETING` | Mortgage pre-qualification conversation, budget re-confirmation |
| Decision-maker confirmation | Once | `NOTE` | Explicit confirmation of who signs, updates BANT `authority` pillar via `scoreLead` |
| Objection log | As they arise | `NOTE` | Specific objection + how it was addressed — feeds the existing "Lost Reason" taxonomy if the lead later disqualifies |
| Competitive intel | As learned | `NOTE` | Is the client evaluating a competing development? |

Every row above already fits the existing `LeadActivity` model (`type`, `description`,
`occurredAt`, `createdById`) — no schema change needed for activity logging itself.

---

## 3. Suspected persona capture

`Customer.segment` (`BuyerSegment`: `LOCAL_RESIDENTIAL` / `DIASPORA` / `CORPORATE` / `INVESTOR`)
is a coarse, committed classification set at lead capture. **Suspected persona** is a finer,
*non-committal* marketing tag layered on top, captured during the Real Opportunities phase once
the Consultant has enough signal to guess a more specific profile — e.g. "Diaspora — Nostalgic
Retiree," "Local — Young Professional First-Time Buyer," "Investor — Yield Seeker," "Corporate —
Staff Housing Buyer." It is explicitly *suspected*, not confirmed, so Marketing can use it as a
retargeting hint without it polluting the authoritative `segment` field.

**Proposed model** (not yet implemented — pending approval of this spec):
```
Lead.suspectedPersona   String?   // free-text tag, e.g. "Diaspora — Nostalgic Retiree"
Lead.suspectedPersonaNote String? // rationale — why the Consultant suspects this
```
Captured once, editable, on the Lead detail page during the Real Opportunities phase. It travels
with the Lead → is available to `Opportunity`/`Customer` once converted, and becomes the seed
data Marketing consumes (§6).

---

## 4. Marketing module — placeholder requirements (build now)

Concrete, minimal requirement for *right now*: add "Marketing" to the sidebar as a `comingSoon`
entry, identical in treatment to `Customers` / `Projects` / `Finance` / `Construction` /
`Facilities` / `Reports` / `Admin` — a labeled, disabled nav item, no dead links, no built page.
**This is the only code change in this pass** (see `src/components/layout/nav-config.ts`).

Detailed requirements (campaign management, persona-based segmentation dashboards, channel
attribution) are explicitly deferred — this placeholder exists so the nav accurately reflects the
roadmap, not to pre-build the module.

---

## 5. Specification summary

**a) Data fields per stage**

| Stage | New/changed fields |
|---|---|
| Qualified → Real Opportunity | *(gate only, no new fields — computed from existing `LeadActivity`/`BantScore` data)* |
| Real Opportunity (nurturing) | `Lead.suspectedPersona`, `Lead.suspectedPersonaNote` *(proposed, §3)* |
| Real Opportunity → Converted | *(unchanged — existing `convertLead` flow)* |

**b) Activities to log** — see the table in §2. All use the existing `LeadActivity` model; no new
activity types are proposed.

**c) Roles responsible**

| Action | Role |
|---|---|
| Move Qualified → Real Opportunity | Sales Consultant (system-suggested once entry criteria are met; Consultant confirms) |
| Log nurturing activities | Sales Consultant |
| Capture suspected persona | Sales Consultant |
| Review Real Opportunity pipeline health | Sales Manager (weekly, same cadence as existing pipeline reviews) |
| Consume persona data | Marketing (once module exists) |

**d) Data flow / integration touchpoints**
- `Lead` (status, suspectedPersona) → unchanged `convertLead` → `Opportunity` → unchanged
  `moveOpportunityStage` → `Sale` / `ClientHandover` / `Commission` (all already built this
  session — Real Opportunities is inserted *before* this chain, doesn't alter it)
- `LeadActivity` rows already feed `getLeadDetail`'s engagement score and the CX/Sales analytics
  queries — Real Opportunity nurturing activities flow through the same path, no new reporting
  plumbing needed
- Suspected persona is a one-way handoff: Sales writes it, Marketing (future) reads it. No
  reverse sync proposed.

**e) Assumed constraints / rules**
- A lead cannot be marked `REAL_OPPORTUNITY` unless `qualificationStatus = QUALIFIED` first —
  status transitions stay strictly forward (matches the existing pattern; no skipping stages)
- `REAL_OPPORTUNITY` is a *status*, not a new pipeline stage duplicate of `Opportunity.stage` —
  it lives entirely within `Lead`, before conversion
- Disqualifying a Real Opportunity uses the existing `disqualifyLead` action and lost-reason
  taxonomy unchanged — no new disqualification path
- Suspected persona is advisory only — it never gates a status transition

---

## 6. Minimal example workflow

1. Lead **John Doe** reaches `QUALIFIED` (BANT score 78, per the existing seed data pattern).
2. Consultant logs a `SITE_VISIT` and a follow-up `CALL` within the cadence window → entry
   criteria met → status moves to `REAL_OPPORTUNITY`.
3. During nurturing: Consultant logs a `MEETING` (mortgage pre-qual chat), confirms John is the
   sole decision-maker (`NOTE`, bumps `authority` to 90 via `scoreLead`), and tags
   `suspectedPersona = "Diaspora — Returning Homeowner"` with a note ("mentioned relocating back
   in 18 months, cash-ready").
4. No competing objections surface. Cadence maintained (contact every 6 days).
5. Consultant runs `convertLead` → `Opportunity` created, `Lead.status = CONVERTED`.
   `suspectedPersona` carries forward on the `Lead` record for later Marketing use.

**Placeholder schema for the future Marketing Module** (illustrative only — not created now):

```prisma
// Illustrative — NOT part of the current schema. For Marketing module scoping later.
model MarketingPersona {
  id           String   @id @default(cuid())
  name         String                     // e.g. "Diaspora — Nostalgic Retiree"
  description  String?
  suggestedChannels String?               // e.g. "WhatsApp, Facebook, email newsletter"
  createdAt    DateTime @default(now())
}

model MarketingCampaign {
  id           String   @id @default(cuid())
  name         String
  personaId    String?
  persona      MarketingPersona? @relation(fields: [personaId], references: [id])
  channel      String                     // e.g. "Facebook", "Google Ads", "WhatsApp Broadcast"
  startDate    DateTime
  endDate      DateTime?
  status       String   @default("PLANNED")
  createdAt    DateTime @default(now())
}

// Bridges suspected personas captured during Real Opportunities nurturing to the
// Marketing module once it exists — read-only from Marketing's perspective.
model LeadPersonaSignal {
  id        String   @id @default(cuid())
  leadId    String
  suspectedPersona String
  note      String?
  capturedAt DateTime @default(now())
}
```

---

## Open questions for you

1. Should `REAL_OPPORTUNITY` actually be added to the `Lead.status` enum (a real migration), or
   would you rather this stay a *derived* state (computed from existing data, shown as a badge,
   no schema change) until Marketing is closer to being built?
2. Is the entry-criteria threshold in §1 (2+ engagement activities, authority ≥ 50, no 14-day
   gap) right, or does Sales have a different bar in mind?
3. Free-text `suspectedPersona`, or should it be a constrained list from the start (avoids
   spelling drift before Marketing exists to consume it)?
