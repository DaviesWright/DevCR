# Finance Module — End-to-End Roadmap

The Finance nav item has been a `comingSoon` placeholder since this project began. The schema
underneath it (`prisma/schema/06-finance.prisma`) is real and reasonably complete — it's just
never been wired to any query, action, or page. This roadmap sequences turning that schema into
an actual module, plus what's genuinely missing from it.

## What already exists (schema-only — zero UI, zero queries, zero actions)

| Model | Purpose | Wired to app code? |
|---|---|---|
| `PaymentPlan` | Total amount, down payment, status per `Sale` | Read-only, via `getCustomerDetail`'s payment-progress bar on Customer 360 |
| `PaymentSchedule` | Per-installment due date/amount/status | Same — read-only, used to compute "overdue installments" count |
| `Payment` | A recorded payment (method, reference, amount) — intentionally generic; no gateway | Not read or written anywhere |
| `PaymentAllocation` | Splits one `Payment` across one or more `PaymentSchedule` rows | Not read or written anywhere |
| `Receipt` | One per `Payment`, a receipt number + optional document URL | Not read or written anywhere |
| `Refund` | Request → Approved/Rejected → Paid, tied to a `Payment` | Not read or written anywhere |
| `Penalty` | Late-payment penalty tied to a `PaymentSchedule` | Not read or written anywhere |
| `Invoice` | Tied to a `Sale`, with tax amount and its own status lifecycle | Not read or written anywhere |

So today: a `PaymentPlan` and its `PaymentSchedule` rows are created once, at seed time, when a
sample sale completes — nothing in the running app ever records a `Payment`, allocates it,
issues a `Receipt`, raises a `Refund`, applies a `Penalty`, or issues an `Invoice`. That's the
entire gap: not the data model, the workflow on top of it.

## Phase 1 — Payment recording (the foundation everything else depends on)

- `recordPayment(customerId, amount, method, reference?)` action: creates a `Payment`, then
  auto-allocates it against the customer's oldest outstanding `PaymentSchedule` rows (FIFO),
  creating `PaymentAllocation` rows and flipping schedule status to `PAID`/`PARTIAL`. This is
  the one action every other Finance feature builds on.
- `issueReceipt(paymentId)` — generates a `Receipt` with a sequential `receiptNo`. Simulated
  (no PDF/email provider), same pattern as every other "document" in this app — logs the
  receipt as a real record, doesn't actually email a PDF.
- `/finance` dashboard: total collected this month, upcoming due (next 7/30 days), overdue
  amount, a recent-payments list. Same KPI-tile + table pattern as every other module.
- `/finance/customers/[id]` (or fold into the existing Customer 360 payment card): a real
  "Record Payment" button where today there's just a read-only progress bar.

## Phase 2 — Overdue handling & penalties

- A computed "days overdue" per `PaymentSchedule` (same lazy-computation convention as deal
  aging and reservation expiry elsewhere in this app — no cron).
- `applyPenalty(scheduleId, amount, reason)` action, surfaced when a schedule is overdue past a
  configurable grace period.
- Feed overdue schedules into the existing header-alerts panel (`getHeaderAlerts`) — a
  customer's `PaymentSchedule` going `OVERDUE` should show up the same way an expiring
  reservation does today.

## Phase 3 — Refunds

- `requestRefund(paymentId, amount, reason)` → `REQUESTED`.
- `approveRefund(refundId, approvedById)` → `APPROVED`, then a separate `markRefundPaid`
  step — mirrors the CX complaint resolve/close split already used elsewhere.
- This is also where the CRM Adoption Deliverables Report's "60-day default & repossession
  logic, including a 20%-of-value refund rule" would plug in — **but that rule is explicitly
  described as on hold pending a management decision in the source document**, so it's not
  specified here beyond "the `Refund` model can carry it once the percentage and trigger
  conditions are decided." Don't build the repossession-refund calculation speculatively.

## Phase 4 — Invoicing

- `createInvoice(saleId, amount, taxAmount, dueDate)` → `DRAFT`, then `issueInvoice(invoiceId)`
  → `ISSUED`.
- Invoice status should track its `PaymentSchedule` coverage the same way a `Complaint`'s SLA
  status tracks time — `PARTIAL`/`PAID`/`OVERDUE` computed from allocated payments, not set by
  hand.

## Phase 5 — Reconciliation & reporting

This is the piece the real Devtraco documents (both the CRM Deliverables Report and the Sales
Process Assessment Memos) flag as the actual organizational pain point, not a technical gap:

- **Monthly reconciliation between Finance and Sales/CRM** — the assessment memos' own
  recommendation ("reconcile the CRM's Closed Sale status against Finance/ERP records"). In
  DevCRM this is cheap once Phase 1-4 exist: a report comparing `Sale.status` against whether
  its `PaymentPlan` is fully allocated.
- **Revenue reports**: collected vs. outstanding vs. overdue, by development, by sales rep
  (ties into the Sales Performance page's existing target-tracking pattern).
- **Commission payout linkage** — once the Commission Structure's tranche model is built (see
  `docs/2026-source-docs-gap-analysis.md` §1), a commission tranche's "Finance confirms
  instalment receipt" gate reads directly from `PaymentSchedule`/`PaymentAllocation` — this is
  the one place Finance and the gamification/commission work intersect.

## Phase 6 — Out of scope for this app (external systems)

Explicitly excluded per the schema's own header comment and confirmed by the real CRM
Deliverables Report's findings:

- **Payment gateway integration** (Paystack/Flutterwave/Mobile Money APIs, webhook
  verification, idempotency) — `Payment.method`/`reference` are intentionally generic fields
  for this reason.
- **CRM → Business Central handoff** — named as an explicit outstanding gap in the real
  Deliverables Report (`DM-03`). DevCRM has no Business Central integration to hand off to.
- **FX/multi-currency settlement** — every Finance model already carries its own `currency`
  field (now defaulting to USD across the app), but real foreign-exchange handling (BoG rate
  lookups, settlement currency vs. sale currency) is a Commission Structure decision item
  (#6 in that document) that hasn't been made yet.

## Suggested build order

1. Phase 1 (payment recording + `/finance` dashboard) — unlocks everything else, no
   dependencies.
2. Phase 2 (overdue + penalties) — small, high-signal, reuses existing alert infrastructure.
3. Phase 5's reconciliation report — cheap once Phase 1 exists, and it's the actual business
   ask from the real assessment memos.
4. Phase 3 (refunds) and Phase 4 (invoicing) — real but lower urgency; nothing else depends on
   them.
5. Commission-tranche linkage — only after the Commission Structure's seven open management
   decisions are resolved (see the gap analysis doc).
