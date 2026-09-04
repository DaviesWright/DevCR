# DevCRM

Real estate CRM for Devtraco Group — Leads, Sales Pipeline, Commissions, and Customer
Experience (complaints, handovers, Sales→CX handoffs). Next.js 14 (App Router) + PostgreSQL 16
via Prisma.

## Prerequisites

- **Node.js 18+** (developed on v24) and npm
- **Docker Desktop** (for the PostgreSQL database — must support `docker compose`, not the
  legacy standalone `docker-compose`)

## Setup on a new machine

```bash
# 1. Install dependencies
npm install

# If npm install skips postinstall scripts (a Windows security policy sometimes blocks
# them), generate the Prisma client explicitly:
npx prisma generate

# 2. Create your local env file
cp .env.example .env
# .env.example already points at the docker-compose database below — only change it if
# you need a different port or credentials.

# 3. Start PostgreSQL
docker compose up -d db

# 4. Apply migrations and seed demo data
npx prisma migrate deploy
npx prisma db seed

# 5. Run the dev server
npm run dev
```

Then open **http://localhost:3000** (or whatever port `next dev` reports).

## Notes for testers

- **No password login — lightweight "act-as" switcher instead.** The header (top right, next to
  the theme switcher) has a "Switch user (demo — no password)" dropdown listing every seeded
  user. Whoever is "acting" drives ownership checks app-wide: a lead assigned to someone else
  shows a read-only banner instead of the action bar (unless the acting user is a
  manager/director/admin), and bulk-assign on `/leads` is hidden for non-managers. This is
  UI-level only, not real server-side auth — see `docs/backlog.md` §4.
- **Simulated external integrations** — there's no real email/SMS/document provider wired up.
  Instead, actions that would normally call one write a real, visible activity record labeled
  "(simulated — no provider configured)": creating a lead logs a simulated acknowledgment email;
  clicking "Generate Reservation Form" on a Sales Pipeline card (once it has a unit and isn't
  closed) creates a real `Reservation` record and logs the simulated document generation.
- **Database port is 5433, not 5432** — `docker-compose.yml` maps Postgres to host port 5433
  specifically to avoid clashing with a native Postgres install on the original dev machine. This
  works fine on a clean machine too; no need to change it unless 5433 is also taken.
- **Seed data resets on `prisma migrate reset`** — this drops and recreates the database, then
  re-runs the seed script. Useful if the demo data gets messy during testing:
  ```bash
  npx prisma migrate reset --force
  ```
- **Modules to test**:
  - `/leads` (with `/leads/new` and `/leads/analytics`) — includes BANT scoring and the new
    **"Mark Real Opportunity"** action on a Qualified lead (requires 2+ logged calls/meetings/site
    visits, Authority score ≥50, and activity within the last 14 days — the button surfaces
    exactly which check failed if you try too early).
  - `/sales` (drag a card to "Closed Won" to see a Sale + Commission + CX handoff auto-created;
    "Generate Reservation Form" on any card with a unit assigned), `/sales/commissions`.
  - `/cx` (Complaints, Sales Handoffs, and Handovers tabs) and `/cx/playbook` — the full 11-stage
    CX checklist engine (Templates / Runs / Departments tabs), transcribed from Devtraco's CX
    Workflow Playbook, with SLA-overdue flags and cross-departmental notes per step group.
  - `/customers` — Customer 360: a unified profile per customer pulling together their leads,
    opportunities, sales/payment status, complaints, and handovers, plus a Marketing panel
    (engagement score, sentiment, opt-outs, segment memberships, persona signals) with an
    "Omnichannel" button to `/customers/[id]/channels` — a radial diagram of Email/SMS/WhatsApp/
    Phone/In-Person, click a channel to send a one-off message or log a call/meeting, with a
    combined interaction timeline and stats.
  - `/marketing` — Segments (structured criteria, recomputed on demand — including two
    dynamically-computed triggers: **"Reservations Expiring Soon"**, real estate's equivalent of
    an abandoned cart, and **"Birthdays This Month"**, using `Customer.dateOfBirth`), Campaigns
    ("Send now" simulates delivery to every eligible segment member), Journeys (multi-step
    sequences you enroll a segment into and manually advance — no live scheduler), Templates, and
    Personas. Seeded with a full sample content library: 4 personas (one per buyer segment), 11
    message templates across Email/SMS/WhatsApp, 4 multi-channel campaigns, and 4 end-to-end
    journeys (a "Reservation Recovery" cart-abandonment flow, a "New Client Welcome Journey", a
    same-day "Birthday Greetings" flow, and the original Diaspora nurture series) — a starting
    point to build your own automation sequences from. AI content generation and A/B testing are
    schema-only — see `docs/marketing-spec.md`.
  - Every consequential Marketing action (segment/campaign/journey creation, sends, enrollments,
    consent-preference changes) now writes to the `AuditLog` table, and `CustomerPreference`
    tracks a consent timestamp/source — see `docs/master-spec-gap-analysis.md` for what else was
    reviewed against a "rebuild as an event-driven platform" spec and deliberately not built (no
    UI to browse the audit log yet — check `audit_logs` directly, e.g. via `psql`, until an Admin
    module exists).
  - Everything else in the sidebar is labeled "SOON" and intentionally not built yet.
- Theme switcher (top right, palette icon) cycles between three brand themes — Devtraco Plus
  (black/gold), Woodlands (green/gold), and a generic mauve/tan theme — each with light/dark
  variants.

## What's not included in this package

`.scratch/` (extracted text from Devtraco's internal business documents used to ground this
build) is excluded — it's proprietary source material, not needed to run or test the app. See
`docs/backlog.md` for the outstanding work queue and its citations.
