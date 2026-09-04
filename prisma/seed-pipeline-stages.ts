// Seeds the two dynamic pipelines (SALES_OPPORTUNITY, LEAD_NURTURE) with stages matching
// today's OpportunityStage/LeadStatus enum values 1:1 — key/label/probability/badgeVariant
// sourced exactly from src/lib/queries/sales.ts (PIPELINE_STAGES/STAGE_LABEL),
// src/lib/actions/sales.ts (STAGE_PROBABILITY), src/components/sales/opportunity-detail.tsx
// (STAGE_VARIANT), src/components/leads/lead-status-badge.tsx (STATUS_VARIANT/STATUS_LABEL),
// and src/lib/queries/nurture.ts (STALE_THRESHOLD_DAYS). Idempotent — safe to re-run.
import { prisma } from "../src/lib/prisma";

type StageSeed = {
  key: string;
  label: string;
  order: number;
  badgeVariant: string;
  probability?: number;
  isWonStage?: boolean;
  isLostStage?: boolean;
  staleAfterDays?: number;
  countsAsAgeingOpen?: boolean;
  countsAsNurtureActive?: boolean;
};

const SALES_OPPORTUNITY_STAGES: StageSeed[] = [
  { key: "PROSPECTING", label: "Prospecting", order: 1, badgeVariant: "secondary", probability: 10 },
  { key: "QUALIFIED", label: "Qualified", order: 2, badgeVariant: "info", probability: 25 },
  { key: "SITE_VISIT", label: "Site Visit", order: 3, badgeVariant: "info", probability: 40 },
  { key: "RESERVATION", label: "Reservation", order: 4, badgeVariant: "warning", probability: 55 },
  { key: "NEGOTIATION", label: "Negotiation", order: 5, badgeVariant: "warning", probability: 70 },
  { key: "CONTRACT", label: "Contract", order: 6, badgeVariant: "highlight", probability: 85 },
  { key: "CLOSED_WON", label: "Closed Won", order: 7, badgeVariant: "success", probability: 100, isWonStage: true },
  { key: "CLOSED_LOST", label: "Closed Lost", order: 8, badgeVariant: "destructive", probability: 0, isLostStage: true },
];

const LEAD_NURTURE_STAGES: StageSeed[] = [
  { key: "NEW", label: "New", order: 1, badgeVariant: "info", staleAfterDays: 2, countsAsAgeingOpen: true, countsAsNurtureActive: true },
  { key: "CONTACTED", label: "Contacted", order: 2, badgeVariant: "secondary", staleAfterDays: 14, countsAsAgeingOpen: true, countsAsNurtureActive: true },
  { key: "NURTURING", label: "Nurturing", order: 3, badgeVariant: "warning", staleAfterDays: 30, countsAsNurtureActive: true },
  { key: "NO_RESPONSE", label: "No response", order: 4, badgeVariant: "outline" },
  { key: "QUALIFIED", label: "Qualified", order: 5, badgeVariant: "success", staleAfterDays: 14, countsAsAgeingOpen: true, countsAsNurtureActive: true },
  { key: "REAL_OPPORTUNITY", label: "Real Opportunity", order: 6, badgeVariant: "highlight", staleAfterDays: 14, countsAsNurtureActive: true },
  { key: "UNQUALIFIED", label: "Unqualified", order: 7, badgeVariant: "destructive", isLostStage: true },
  { key: "CONVERTED", label: "Converted", order: 8, badgeVariant: "highlight", isWonStage: true },
];

async function seedPipeline(pipelineKey: string, pipelineName: string, stages: StageSeed[]) {
  const pipeline = await prisma.pipeline.upsert({
    where: { key: pipelineKey },
    update: { name: pipelineName },
    create: { key: pipelineKey, name: pipelineName },
  });

  for (const s of stages) {
    await prisma.pipelineStage.upsert({
      where: { pipelineId_key: { pipelineId: pipeline.id, key: s.key } },
      update: {
        label: s.label,
        stageOrder: s.order,
        badgeVariant: s.badgeVariant,
        probability: s.probability ?? 0,
        isWonStage: s.isWonStage ?? false,
        isLostStage: s.isLostStage ?? false,
        staleAfterDays: s.staleAfterDays ?? null,
        countsAsAgeingOpen: s.countsAsAgeingOpen ?? false,
        countsAsNurtureActive: s.countsAsNurtureActive ?? false,
      },
      create: {
        pipelineId: pipeline.id,
        key: s.key,
        label: s.label,
        stageOrder: s.order,
        badgeVariant: s.badgeVariant,
        probability: s.probability ?? 0,
        isWonStage: s.isWonStage ?? false,
        isLostStage: s.isLostStage ?? false,
        staleAfterDays: s.staleAfterDays ?? null,
        countsAsAgeingOpen: s.countsAsAgeingOpen ?? false,
        countsAsNurtureActive: s.countsAsNurtureActive ?? false,
      },
    });
  }

  return pipeline;
}

async function main() {
  await seedPipeline("SALES_OPPORTUNITY", "Sales Opportunity Pipeline", SALES_OPPORTUNITY_STAGES);
  await seedPipeline("LEAD_NURTURE", "Lead Nurture Pipeline", LEAD_NURTURE_STAGES);
  console.log(`Seeded 2 pipelines (${SALES_OPPORTUNITY_STAGES.length + LEAD_NURTURE_STAGES.length} stages).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
