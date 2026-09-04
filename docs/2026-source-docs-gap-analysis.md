# 2026 Source Documents — Gap Analysis

**Update:** items 1-4 of the "ranked by buildability" summary below (customer lifetime-value
banding, nurturing-staleness alert + rep book-size cap, referral tracking, and the CX SLA
overhaul — priority/escalation/pause/entitlement tiering) have since been built. See
`docs/backlog.md` §8 for what shipped. Commission tranches and the 60-day repossession rule
remain flagged, not built, per the reasoning below.

Review of 9 real Devtraco documents the user supplied directly (extracted to `.scratch/DOC7`
through `DOC14`; `Devtraco_Sales_Playbook_v1.0.docx` was already extracted as `DOC3` in an
earlier pass). This is analysis only — nothing below has been built. Each section states what
the source document specifies, what DevCRM has today, and the concrete gap.

One of the nine — the customer consolidation spreadsheet — contains real customer names and
purchase amounts. Nothing from it is reproduced here beyond the aggregate structure; it should
never be imported into DevCRM's sample data.

---

## 1. Commission Structure (`Commission_Structure_D365_CRM_BC.docx`)

**Source spec:** commission is not a single flat payment. It releases in three tranches tied to
both a client-payment milestone and an internal business milestone: T1 = 80% (gated on deposit
cleared + SPA signed by both parties + unit allocated + management approval), T2 = 10% (2nd
instalment received, T1 already paid, no compliance flags), T3 = 10% (3rd instalment, same
gates). An SPA-delay protocol escalates an unsigned SPA past a grace period. Past-due/default
triggers HOLD → FROZEN → clawback assessment. Seven management decisions (SPA grace period,
past-due tolerance, clawback policy, 4+-instalment mapping, differentiated rates, payment
currency, approval matrix) are explicitly still open — the doc itself flags 10 of 25
configuration items as blocked on those decisions.

**DevCRM today:** `Commission` (`05-sales.prisma`) is a single row per sale — `amount`, `status`
(PENDING/APPROVED/PAID/VOID), created in full at `CLOSED_WON`. No tranches, no SPA gating, no
clawback.

**Gap:** structural. A tranche model needs `Commission` to become a parent with 1–3 tranche
rows (or a `CommissionTranche` child table), each with its own gate conditions and status, plus
the SPA-delay and past-due/clawback state machine. This is a real, well-specified feature — but
it depends on the same seven management decisions the source doc says are still open at
Devtraco. Building it now would mean guessing at thresholds (grace period, tolerance window,
clawback policy) the business hasn't decided. **Recommend:** flag as next-up once those seven
decisions are made; don't build speculatively against undecided policy.

---

## 2. Sales Process Assessment Memos (`DOC9`/`DOC10` — CTO and standard versions)

Real six-month diagnostic of Devtraco's actual D365 pipeline (776 rated Prospects, 0.5%
end-to-end conversion). Findings are about process/data-discipline, not missing CRM features —
but several point at real gaps in what DevCRM measures and alerts on:

| Finding | DevCRM today | Gap |
|---|---|---|
| Leads untouched 14+/30+/60+ days need staleness alerting, not just the 48h "no first contact" check | Only one staleness signal exists: `Lead.status = NEW` + no activity in 48h (`getHeaderAlerts`) | No alert for a lead that *has* been contacted but then gone stale in Nurturing for 30+/60+ days — this is the memo's single biggest finding (203 leads, 65% stale) |
| Rep capacity ceiling — conversion drops sharply past ~40 active Prospects per rep | No concept of "active book size" per rep anywhere | Real, cheap addition: a per-rep active-lead count, surfaced as a KPI and an over-capacity flag |
| Closure-signal reconciliation — free-text notes saying "purchased/reserved" while status lags behind | No equivalent; DevCRM's status transitions are explicit actions, not free-text-derived | Lower priority for DevCRM specifically, since leads don't get created from external free-text imports the way the real D365 book does |
| Rating-hygiene — Unqualified/unreachable leads still counted as active pipeline | DevCRM's `LeadStatus.UNQUALIFIED` already excludes from `getPipelineKpis`' open-count logic | **Already handled** — DevCRM's stricter status model doesn't have this leak |
| Source/channel concentration and quality-vs-volume mismatch | `LeadSource` exists and Leads Analytics has a per-source table | Partially covered; DevCRM doesn't yet compute per-source *late-stage* conversion specifically (only overall) |

**Recommend:** the Nurturing-staleness alert (30d) and a per-rep active-book-size KPI are the
two genuinely cheap, high-signal additions here — both fit the existing alerts/KPI query
pattern with no schema change. Not built this pass; noted as the top backlog candidate from
this whole document set.

---

## 3. Buyer Intelligence & Marketing Targeting (`Devtraco_Buyer_Intelligence_Marketing_Targeting.pptx`)

Real analysis of 8,275 leads / 642 enriched buyers / 614 purchases. Three buyer personas
(Diaspora Professional, Local Executive, Institutional/Investor) each with a specific *decision
driver* and *breakdown point* — richer than a label. Plus four proposed tools (diaspora
affordability calculator, investment yield estimator, "which development fits you" quiz,
construction progress portal) and a referral-program formalization (referral converts at 72%,
by far the best channel, but is unresourced).

**DevCRM today:** `MarketingPersona` is name + description + suggested channels — no structured
decision-driver/breakdown-point fields. `LeadSource` includes "Referral" as one of nine sources
but there's no referral-specific tracking (who referred whom, referral reward status).

**Gap:** the four proposed tools (calculator, yield estimator, quiz, progress portal) are
net-new customer-facing features, not CRM-internal work — out of scope for this app's admin/ops
surface. The structured persona model (decision driver / breaks-down-on) is a reasonable
enrichment to `MarketingPersona` but not currently blocking anything. **Referral tracking** is
the one item worth flagging concretely: DevCRM has no way to record "this lead was referred by
Customer X" or track referral-reward status, despite Referral being the highest-converting
source in both this deck and the assessment memos. A `referredByCustomerId` on `Lead` plus a
referral-status field would be a small, real addition — not built this pass.

---

## 4. Client Experience SLA Framework (`Devtraco_ClientExperience_SLA_Framework.pdf`)

A fully specified P1–P4 priority model with numeric SLA targets (P1: 1hr first response / 8hr
make-safe / 24hr plan; P2: 2 business hours / 2 days; P3: 4 hours / 5 days; P4: 1 day / 10
days), a 5-level escalation matrix (L0 owner → L4 executive) with specific response windows per
level, entitlement-based tiering (Standard/Premium/Strategic mapped to buyer segment), pause/
hold rules for SLA-clock-stopping states, and 12 email notification templates.

**DevCRM today (`08-customer-experience.prisma`, `docs/backlog.md` §3):** `Complaint` has a
single implicit SLA (the "stale lead" pattern extended informally) and a breach flag surfaced
on the CX dashboard (`SLA breaches` KPI). There is no priority field (P1–P4), no escalation
levels beyond the existing `Escalation` model's from/to fields, no pause/hold state, and no
entitlement-based tiering by customer segment.

**Gap:** this is the most fully-specified, build-ready document of the nine — closer to a
finished design than any other source doc reviewed this session. If the Sales Enhancement /
CX work continues, this is the strongest candidate for the next real feature: add `priority`
(P1–P4) and `pausedAt`/pause-reason to `Complaint`, compute SLA-target-by-priority the same way
`getCxKpis` already computes breach status, and surface an escalation-level badge instead of a
flat open/resolved state. Entitlement tiering by segment (Diaspora/Investor get halved response
targets) is a clean fit for the existing `Customer.segment` enum. Not built this pass — flagged
as the top CX candidate.

---

## 5. CRM Adoption Deliverables Report v7 (`DEVTRACO CRM Deliverables Report v7.docx`)

A consultancy progress report on the *real* D365/GEMS implementation — People/Process/
Governance status, not a feature spec. Three genuine functional gaps it names explicitly:

1. **Order-to-Business-Central handoff** — outstanding in the real system.
2. **Call centre integration** ("make calls directly from the system") — unaddressed, needs an
   in/out-of-scope decision.
3. **60-day default & repossession logic**, including a 20%-of-value refund rule on
   repossession — on hold, has financial/legal weight.

**DevCRM relevance:** these are specific to the real D365/BC integration and largely don't
translate into DevCRM feature work — DevCRM has no Business Central integration to hand off to,
and no call-centre/telephony surface. The 60-day repossession/refund rule is the one item with
a DevCRM equivalent: `PaymentPlan`/`PaymentSchedule` exist, but there's no default/repossession
workflow or refund-on-repossession calculation. Given the source document itself says this rule
is still "on hold" pending management decision at Devtraco, building it now would mean
inventing policy that doesn't exist yet — same caution as the commission tranches above.

---

## 6. Customer Consolidation & Banding (`Devtraco_Full_Sales_Customer_Consolidation_and_Banding.xlsx`)

Real portfolio data (591 confirmed customers, $131M) revealing three concepts DevCRM doesn't
have, described here structurally without reproducing any customer record:

- **Purchase banding** — customers are tiered by *cumulative* lifetime purchase value across
  all developments and units, in $200K increments (not a fixed persona label).
- **Multi-project buyer view** — a customer who has bought in 2+ developments is a distinct,
  valuable segment (81 of 591 confirmed customers in the source data) that no single
  per-development sales sheet would ever surface.
- **Tentative pipeline, held separately from confirmed sales** — reservations/soft-holds are
  tracked in their own view with an "indicative value," explicitly excluded from confirmed
  revenue reporting until converted.

**DevCRM today:** `Customer.segment` is a fixed enum (DIASPORA/LOCAL_RESIDENTIAL/CORPORATE/
INVESTOR) set once, not a computed value-based tier. There's no cross-development purchase
rollup — `Sale` records exist per unit but nothing aggregates "total lifetime value across all
of this customer's sales." The Reservation feature built this session (5-day hold, `/projects`
inventory) already keeps reserved units separate from `Sale` records structurally, but the
Sales KPIs don't yet report "confirmed" vs. "tentative/reserved" value as two distinct headline
numbers the way this spreadsheet's Band Summary does.

**Gap, and the cheapest one in this whole set:** a computed `getCustomerLifetimeValue(customerId)`
query (sum of `Sale.salePrice` across all of a customer's sales, banded into $200K tiers) plus a
"Multi-Project Buyers" view on Customer 360 would be a small, purely additive feature — no
schema change, since it's derivable entirely from existing `Sale` records. This is the single
most directly buildable idea across all nine documents. Not built this pass.

---

## 7. Sales Workflow Proposal (`Devtraco Proposal __ Sales Workflow (1).pdf`)

A third-party vendor sales pitch (Vision Realty, not an internal Devtraco document) using
generic industry benchmarks — speed-to-lead, 7–14 touchpoint follow-up cadences, database
reactivation. Directionally consistent with the assessment memos above but not itself a spec.
No new gap beyond what Section 2 already covers; the memos are the higher-fidelity version of
the same argument using Devtraco's own data.

---

## 8. Generic "Lead-to-Opportunity" reference (pasted mid-review, not a Devtraco document)

A generic vendor-blog description of a standard capture → qualify → convert → develop →
propose → close → nurture pipeline. DevCRM already implements this end to end: `createLead`
(capture), BANT scoring + `qualifyLead` (qualify), `convertLead` (convert, creates
`Opportunity`), `Opportunity.expectedValue`/`probability`/`unitId` (develop), the
`SITE_VISIT`/`RESERVATION`/`NEGOTIATION` stages (propose), `moveOpportunityStage` to
`CLOSED_WON`/`CLOSED_LOST` (close), and the Marketing module's `CustomerJourney` (nurture). No
gap — confirms the existing pipeline model already matches the standard pattern.

---

## Summary — ranked by buildability if this work continues

1. **Customer lifetime-value banding + multi-project buyer view** (§6) — no schema change,
   derived entirely from existing `Sale` data. Cheapest, most self-contained.
2. **CX priority (P1–P4) + escalation levels + entitlement tiering** (§4) — most fully
   specified source document; moderate schema addition to `Complaint`.
3. **Nurturing-staleness alert (30d) + per-rep active-book-size KPI** (§2) — fits the existing
   alerts/KPI pattern, no schema change.
4. **Referral tracking on Lead** (§3) — small schema addition (`referredByCustomerId`), unlocks
   real referral-program measurement.
5. **Commission tranches (T1/T2/T3) with SPA gating and clawback** (§1) — well-specified but
   blocked on seven undecided management policies; building now means guessing at business
   rules Devtraco hasn't set.
6. **60-day default/repossession/refund logic** (§5) — same caution as #5, explicitly "on hold"
   in the source document.
7. Customer-facing marketing tools (affordability calculator, yield estimator, quiz,
   construction-progress portal) (§3) — real ideas, but a different product surface
   (customer-facing site) rather than this internal CRM.
