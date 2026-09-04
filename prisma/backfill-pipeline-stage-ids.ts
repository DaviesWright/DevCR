// One-off, rerunnable backfill: sets pipelineStageId on every existing Lead/Opportunity row by
// looking up the PipelineStage whose key matches the row's current status/stage enum value.
// Durable (kept in prisma/, not scripts/) since it needs to run again against staging/prod.
// Safe to re-run — only touches rows where pipelineStageId is still null.
import { prisma } from "../src/lib/prisma";

async function main() {
  const [oppPipeline, leadPipeline] = await Promise.all([
    prisma.pipeline.findUniqueOrThrow({ where: { key: "SALES_OPPORTUNITY" }, include: { stages: true } }),
    prisma.pipeline.findUniqueOrThrow({ where: { key: "LEAD_NURTURE" }, include: { stages: true } }),
  ]);

  const oppStageIdByKey = new Map(oppPipeline.stages.map((s) => [s.key, s.id]));
  const leadStageIdByKey = new Map(leadPipeline.stages.map((s) => [s.key, s.id]));

  const opportunities = await prisma.opportunity.findMany({
    where: { pipelineStageId: null },
    select: { id: true, stage: true },
  });
  let oppUpdated = 0;
  for (const o of opportunities) {
    const stageId = oppStageIdByKey.get(o.stage);
    if (!stageId) {
      console.warn(`No matching PipelineStage for Opportunity ${o.id} stage="${o.stage}" — skipped.`);
      continue;
    }
    await prisma.opportunity.update({ where: { id: o.id }, data: { pipelineStageId: stageId } });
    oppUpdated++;
  }

  const leads = await prisma.lead.findMany({
    where: { pipelineStageId: null },
    select: { id: true, status: true },
  });
  let leadUpdated = 0;
  for (const l of leads) {
    const stageId = leadStageIdByKey.get(l.status);
    if (!stageId) {
      console.warn(`No matching PipelineStage for Lead ${l.id} status="${l.status}" — skipped.`);
      continue;
    }
    await prisma.lead.update({ where: { id: l.id }, data: { pipelineStageId: stageId } });
    leadUpdated++;
  }

  console.log(`Backfilled ${oppUpdated}/${opportunities.length} opportunities, ${leadUpdated}/${leads.length} leads.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
