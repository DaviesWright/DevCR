# New sample data — 2026-09-03

Five new seed scripts, written to match the exact conventions already used in this repo
(`seed-additional-30.ts`, `seed-sample-clients.ts`) — real `cuid()`-keyed rows via Prisma, not a
flat import. Each is self-contained, checks its own prerequisites, and is safe to run more than
once except where noted.

## What's in each file

| File | Adds | Depends on |
|---|---|---|
| `seed-devtraco-projects.ts` | All 12 Devtraco Group developments (Airport Hills Residences, Nova, The Edge, Henrietta's Residences, The Address, The Pelican Hotel, ARLO Cantonments, Forte, The Niiyo, Avant Garde, Woodlands, Lotus) as `Development` + `Block`/`Floor`/`Unit` rows, plus the 8 `PropertyType`s. **Idempotent** — upserts on `projectCode`/`name`/unit number, so it's safe to run whether or not `prisma/seed.ts` already created these same developments. | Nothing — can run first, on an empty database. |
| `seed-new-customers.ts` | 15 new customers (across all 4 buyer segments, realistic KYC mix), each with a `CustomerAddress` and `CustomerPreference` row. | Main seed (`npx prisma db seed`) — needs existing sales reps to assign to. |
| `seed-new-leads.ts` | 25 new leads (own new `Customer` each — `Lead.customerId` is required), full BANT + behavioral scoring, logged activities, notes, and `Opportunity` rows for the Qualified/Real-Opportunity tier. Funnel-shaped across all `LeadStatus` values except `CONVERTED`. Two are linked to an existing customer via `referredByCustomerId` to exercise referral tracking. | Main seed. |
| `seed-sales-team.ts` | 4 new Sales Agents + 1 new Sales Manager, using the existing `Sales Agent`/`Sales Manager` roles and `Sales` department, each with a `SalesAgent` profile (agent code + commission rate). | Main seed (needs those roles/department to already exist). |
| `seed-marketing-data.ts` | Completes the 4-persona buyer set (`Local Resident — First-Time Homeowner`, `Diaspora — Nostalgic Retiree` — Investor and Corporate personas already exist) + 5 segments, 6 templates, 4 campaigns, 3 journeys with step sequences and sample enrollments. | Main seed. |

## How to run

```bash
npx prisma migrate deploy      # or your usual DB setup
npx prisma db seed             # main seed, if not already run

npx tsx prisma/seed-devtraco-projects.ts
npx tsx prisma/seed-new-customers.ts
npx tsx prisma/seed-sales-team.ts     # run before seed-new-leads.ts so new agents get leads assigned to them too
npx tsx prisma/seed-new-leads.ts
npx tsx prisma/seed-marketing-data.ts
```

`seed-devtraco-projects.ts` can run before or after the main seed. The other four expect the main
seed's reference data (lead sources, property types, roles, department, Jane/Michael) to already
exist, and will throw a clear error naming what's missing if it doesn't.

## Leads: CSV alternative

`leads-import-25.csv` (delivered alongside these files, not committed to the repo) holds the same
25 people in the exact column format the in-app **Import leads from CSV** feature expects
(`src/components/leads/import-leads-sheet.tsx` → Leads page → Import). That path is faster —
no server access needed — but only carries `firstName, lastName, phone, email, nationality,
segment, source, budgetMin, budgetMax, currency, preferredLocation, notes`; it won't set BANT
scores, assigned rep, property type, or activity history the way `seed-new-leads.ts` does. Use the
CSV for a quick, no-server-access upload; use the script for the fuller dataset.

## A note on "all the Devtraco developments"

The main seed (`prisma/seed.ts`) already creates all 12 real developments — the comment there says
they were "shared directly by the user." `seed-devtraco-projects.ts` doesn't add a 13th; it makes
that same portfolio available as its own standalone, idempotent script, useful if you ever need to
(re)provision just the project/inventory data without re-running the full seed.
