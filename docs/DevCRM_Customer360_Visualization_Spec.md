# DevCRM — Customer 360 View: Visualization & Drill-Down Build Spec

**To:** DevCRM Engineering
**From:** PKB, CTO
**Re:** Customer 360 page — replace flat text sections with charts, timelines, and drill-down interactions

---

## 1. Why this matters

The current Customer 360 (Kweku's page) is a static read: KYC tag, a leads list, an empty opportunities block, an empty payment history block. It answers "what exists" but nothing about *trend, pace, risk, or where to intervene*. A sales agent or relationship manager should be able to glance at this page and know: is this customer moving or stalling, where's the money, and what's the next action. That requires visual encoding, not more text rows.

Below is a section-by-section spec: what to build, what data it binds to, and how it should behave on click/hover. Treat this as a backlog, not a single sprint — priority tiers are marked.

---

## 2. Header block (identity + status)

**Current:** Name, KYC badge, contact line.

**Build:**
- **KYC progress ring** (small circular stepper, not a flat badge) — stages: Submitted → Verified → Approved. Ring fills per stage; color shifts amber → jade as it progresses. Hover shows stage timestamps and outstanding docs.
- **Relationship health chip** next to the name — a single computed score (activity recency + pipeline stage + payment punctuality once available) rendered as a small sparkline trend arrow, not just a number. Click expands the scoring breakdown in a side panel.

Priority: **P1** (quick win, high visibility, no new data model needed beyond existing KYC stage field).

---

## 3. Sales journey — Leads

**Current:** Flat list, one lead ("Orca Deco"), status pills.

**Build:**
- **Horizontal funnel/stage tracker** per lead — New → Contacted → Qualified → Unqualified/Converted — rendered as a segmented progress bar rather than a pill. Current stage highlighted in Senrab Blue; dead-end stages (Unqualified) in muted grey, not red (avoid alarmist coloring on a normal outcome).
- **Activity timeline** under each lead — a horizontal dot-timeline of touches (call logged, email sent, site visit) with dates. This is the single highest-value addition: it turns "New · Unqualified" into a story of what actually happened.
- **Drill-down:** clicking a lead expands an inline panel (not a new page) showing full activity log, assigned rep, and a "days in stage" counter. Days-in-stage > threshold (configurable, default 14) renders in amber to flag stalling leads.

Priority: **P1** for the timeline + days-in-stage flag (this is where deals die silently); **P2** for the funnel visual polish.

---

## 4. Opportunities

**Current:** "No opportunities yet" empty state — no visual structure at all, so nothing to retrofit against once data exists.

**Build (design now, populate later):**
- **Pipeline value bar** — horizontal stacked bar showing opportunity value by stage (Qualifying → Proposal → Negotiation → Won/Lost), one bar per customer if multiple opportunities exist.
- **Mini Kanban strip** — 4-5 stage columns, opportunity cards as small chips with value and expected close date. Click opens the standard opportunity detail view (existing, don't rebuild).
- **Weighted forecast tag** — value × stage-probability shown as a single number next to the pipeline bar, so a customer with 3 early-stage opportunities doesn't visually overstate its worth against one late-stage opportunity of similar face value.

Priority: **P2** — build the empty-state placeholder now so it doesn't ship as plain text; full chart logic can follow once real opportunity data flows through.

---

## 5. Sales & payment history

**Current:** "No sales yet" — same empty-state gap as Opportunities.

**Build:**
- **Payment timeline (line/step chart)** — cumulative amount paid vs. scheduled milestones over time. This is the chart Finance will actually use in a customer conversation ("you're 2 payments behind schedule").
- **Aging donut** — current / 30 / 60 / 90+ days overdue, small and inline, only rendered once a balance exists.
- **Drill-down:** click any point on the timeline to expand the underlying transaction (date, method — MoMo/bank/cash, receipt reference) in a side panel rather than navigating away.

Priority: **P1** once Finance data is wired in — this single chart does more for collections conversations than any report currently exists to support. Until then, ship a clean empty state (not "No sales yet" — say "No sales recorded — payment timeline will appear here once a unit is sold").

---

## 6. New section worth adding: Engagement heatmap

Not in the current layout, but should be. A small calendar-style heatmap (GitHub-contribution-graph style) showing touchpoint density over the last 90 days — calls, emails, site visits, portal logins if CX module exposes it. One glance tells a rep whether a customer has gone cold. This sits well between the Sales Journey and Opportunities blocks.

Priority: **P2**.

---

## 7. Interaction principles (apply across all charts)

- **Inline expansion over navigation.** Every drill-down should open a side panel or accordion on the same page — never force a full page reload to see one transaction or one activity log. This is the single biggest usability upgrade over the current design.
- **Hover = detail, click = action.** Hovering a chart element shows a tooltip with exact values/dates. Clicking opens the expandable detail panel described per section above.
- **Empty states are designed, not default.** Every chart needs a populated look and a deliberate empty-state look (see Section 5) — no bare "No X yet" text.
- **Consistent color logic:** Senrab Blue (#0019F9) = active/primary state and current stage. Jade (#00A86A) = positive/on-track/completed. Amber = attention needed (stalling lead, overdue payment). Avoid red except for genuinely critical flags (KYC rejected, payment default) — reserve it so it retains meaning.

---

## 8. Implementation notes

- **Chart library:** Recharts or Chart.js are sufficient for everything above (line, stacked bar, donut, stepper); no need for a heavier viz library. The engagement heatmap can be a lightweight custom SVG grid — don't pull in a full calendar-heatmap dependency for one component.
- **Data binding:** Leads/Opportunities/Payment data should come from whatever DevCRM's own backend model is (this page is DevCRM-native, not a direct D365 CE render) — confirm with the Customers module owner whether Sales & Payment History reads from Business Central directly or is mirrored into DevCRM's own tables. If mirrored, the payment timeline needs a defined sync cadence (daily is likely sufficient — this isn't a real-time trading view).
- **Performance:** All charts on this page should render from data already loaded with the customer record (no extra round-trips per chart) — pre-aggregate stage counts, payment totals, and activity counts server-side rather than computing client-side from raw transaction lists.

---

## 9. Build priority summary

| Priority | Items |
|---|---|
| **P1 — this sprint** | KYC progress ring, lead activity timeline + days-in-stage flag, payment timeline (once Finance data available), designed empty states |
| **P2 — next** | Opportunity pipeline bar + mini-Kanban, aging donut, engagement heatmap, relationship health chip |
| **P3 — later** | Weighted forecast tag, cross-module drill-down (e.g., linking a payment to its unit in Construction module) |

