import { prisma } from "@/lib/prisma";

// Single source of truth for pipeline stage data — replaces every duplicated hardcoded
// stage->label/color/probability/threshold map found across sales.ts, dashboard.ts,
// pipeline-board.tsx, opportunity-detail.tsx, lead-status-badge.tsx, leads-table.tsx,
// nurture.ts. Server-only (imports prisma) — client components receive stages as a fetched
// prop, same pattern lead-taxonomy.ts already established for prisma-free client imports.
export type StageDTO = {
  id: string;
  key: string;
  label: string;
  stageOrder: number;
  badgeVariant: string;
  probability: number;
  isWonStage: boolean;
  isLostStage: boolean;
  staleAfterDays: number | null;
  countsAsAgeingOpen: boolean;
  countsAsNurtureActive: boolean;
};

function toDTO(stage: {
  id: string;
  key: string;
  label: string;
  stageOrder: number;
  badgeVariant: string;
  probability: number;
  isWonStage: boolean;
  isLostStage: boolean;
  staleAfterDays: number | null;
  countsAsAgeingOpen: boolean;
  countsAsNurtureActive: boolean;
}): StageDTO {
  return {
    id: stage.id,
    key: stage.key,
    label: stage.label,
    stageOrder: stage.stageOrder,
    badgeVariant: stage.badgeVariant,
    probability: stage.probability,
    isWonStage: stage.isWonStage,
    isLostStage: stage.isLostStage,
    staleAfterDays: stage.staleAfterDays,
    countsAsAgeingOpen: stage.countsAsAgeingOpen,
    countsAsNurtureActive: stage.countsAsNurtureActive,
  };
}

export async function getOrderedStages(pipelineKey: string): Promise<StageDTO[]> {
  const stages = await prisma.pipelineStage.findMany({
    where: { pipeline: { key: pipelineKey }, isActive: true },
    orderBy: { stageOrder: "asc" },
  });
  return stages.map(toDTO);
}

export async function getStageIdByKey(pipelineKey: string, stageKey: string): Promise<StageDTO> {
  const stage = await prisma.pipelineStage.findFirstOrThrow({
    where: { pipeline: { key: pipelineKey }, key: stageKey },
  });
  return toDTO(stage);
}

export async function getStageMapByKey(pipelineKey: string): Promise<Map<string, StageDTO>> {
  const stages = await getOrderedStages(pipelineKey);
  return new Map(stages.map((s) => [s.key, s]));
}
