import { prisma } from "@/lib/prisma";

export async function getChecklistTemplates() {
  const templates = await prisma.checklistTemplate.findMany({
    orderBy: { stageNumber: "asc" },
    include: { _count: { select: { steps: true, runs: true } } },
  });
  return templates.map((t) => ({
    id: t.id,
    stageNumber: t.stageNumber,
    title: t.title,
    goal: t.goal,
    trigger: t.trigger,
    owner: t.owner,
    sla: t.sla,
    isOpenDesignItem: t.isOpenDesignItem,
    stepCount: t._count.steps,
    runCount: t._count.runs,
  }));
}

export type ChecklistTemplateList = Awaited<ReturnType<typeof getChecklistTemplates>>;

export async function getChecklistTemplateDetail(templateId: string) {
  const template = await prisma.checklistTemplate.findUnique({
    where: { id: templateId },
    include: { steps: { orderBy: { order: "asc" } } },
  });
  if (!template) return null;

  const groups = new Map<string, typeof template.steps>();
  for (const step of template.steps) {
    if (!groups.has(step.groupLabel)) groups.set(step.groupLabel, []);
    groups.get(step.groupLabel)!.push(step);
  }

  return {
    id: template.id,
    stageNumber: template.stageNumber,
    title: template.title,
    goal: template.goal,
    trigger: template.trigger,
    owner: template.owner,
    sla: template.sla,
    isOpenDesignItem: template.isOpenDesignItem,
    groups: Array.from(groups.entries()).map(([groupLabel, steps]) => ({
      groupLabel,
      steps: steps.map((s) => ({
        id: s.id,
        kind: s.kind,
        label: s.label,
        notificationRecipient: s.notificationRecipient,
        notificationAction: s.notificationAction,
      })),
    })),
  };
}

export type ChecklistTemplateDetail = NonNullable<Awaited<ReturnType<typeof getChecklistTemplateDetail>>>;

export type ChecklistRunListItem = {
  id: string;
  stageNumber: number;
  templateTitle: string;
  customerName: string | null;
  label: string | null;
  startedByName: string | null;
  startedAt: Date;
  completedAt: Date | null;
  totalSteps: number;
  completedSteps: number;
  openFlags: number;
  // % of this run's QUALITY_CHECK steps that are ticked — null when the template has none.
  // Auto-computed, not manager-entered (see 2026-09-03 CX checklist scorecard decision).
  qualityScore: number | null;
};

export async function getChecklistRunsList(): Promise<ChecklistRunListItem[]> {
  const runs = await prisma.checklistRun.findMany({
    orderBy: { startedAt: "desc" },
    include: {
      template: { select: { stageNumber: true, title: true, steps: { select: { id: true, kind: true } } } },
      customer: { select: { firstName: true, lastName: true } },
      startedBy: { select: { firstName: true, lastName: true } },
      completions: { select: { stepId: true, completed: true } },
    },
  });

  return runs.map((r) => {
    const completedStepIds = new Set(r.completions.filter((c) => c.completed).map((c) => c.stepId));
    const totalSteps = r.template.steps.length;
    const completedSteps = completedStepIds.size;
    const qualitySteps = r.template.steps.filter((s) => s.kind === "QUALITY_CHECK");
    const openFlags = qualitySteps.filter((s) => !completedStepIds.has(s.id)).length;
    const qualityScore = qualitySteps.length > 0 ? Math.round(((qualitySteps.length - openFlags) / qualitySteps.length) * 100) : null;

    return {
      id: r.id,
      stageNumber: r.template.stageNumber,
      templateTitle: r.template.title,
      customerName: r.customer ? `${r.customer.firstName} ${r.customer.lastName}` : null,
      label: r.label,
      startedByName: r.startedBy ? `${r.startedBy.firstName} ${r.startedBy.lastName}` : null,
      startedAt: r.startedAt,
      completedAt: r.completedAt,
      totalSteps,
      completedSteps,
      openFlags,
      qualityScore,
    };
  });
}

export async function getChecklistKpis() {
  const runs = await getChecklistRunsList();
  const active = runs.filter((r) => !r.completedAt);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const completedThisMonth = runs.filter((r) => r.completedAt && r.completedAt >= monthStart).length;
  const totalOpenFlags = active.reduce((sum, r) => sum + r.openFlags, 0);
  const scored = runs.filter((r) => r.qualityScore !== null);
  const avgQualityScore = scored.length > 0 ? Math.round(scored.reduce((sum, r) => sum + (r.qualityScore ?? 0), 0) / scored.length) : null;

  return { activeCount: active.length, completedThisMonth, totalOpenFlags, avgQualityScore };
}

export async function getChecklistRunDetail(runId: string) {
  const run = await prisma.checklistRun.findUnique({
    where: { id: runId },
    include: {
      template: { include: { steps: { orderBy: { order: "asc" } } } },
      customer: { select: { firstName: true, lastName: true } },
      startedBy: { select: { firstName: true, lastName: true } },
      completions: { include: { completedBy: { select: { firstName: true, lastName: true } } } },
    },
  });
  if (!run) return null;

  const completionByStepId = new Map(run.completions.map((c) => [c.stepId, c]));

  const groups = new Map<
    string,
    { id: string; kind: string; label: string; notificationRecipient: string | null; notificationAction: string | null; completed: boolean; completedAt: Date | null; completedByName: string | null; note: string | null }[]
  >();
  for (const step of run.template.steps) {
    const completion = completionByStepId.get(step.id);
    if (!groups.has(step.groupLabel)) groups.set(step.groupLabel, []);
    groups.get(step.groupLabel)!.push({
      id: step.id,
      kind: step.kind,
      label: step.label,
      notificationRecipient: step.notificationRecipient,
      notificationAction: step.notificationAction,
      completed: completion?.completed ?? false,
      completedAt: completion?.completedAt ?? null,
      completedByName: completion?.completedBy ? `${completion.completedBy.firstName} ${completion.completedBy.lastName}` : null,
      note: completion?.note ?? null,
    });
  }

  const totalSteps = run.template.steps.length;
  const completedSteps = run.completions.filter((c) => c.completed).length;
  const qualitySteps = run.template.steps.filter((s) => s.kind === "QUALITY_CHECK");
  const completedQualityStepIds = new Set(run.completions.filter((c) => c.completed).map((c) => c.stepId));
  const qualityScore =
    qualitySteps.length > 0
      ? Math.round((qualitySteps.filter((s) => completedQualityStepIds.has(s.id)).length / qualitySteps.length) * 100)
      : null;

  const crossDepartmentalByGroup = new Map<string, { department: string; description: string }[]>();
  for (const step of run.template.steps) {
    if (!crossDepartmentalByGroup.has(step.groupLabel) && step.crossDepartmental) {
      crossDepartmentalByGroup.set(step.groupLabel, step.crossDepartmental as { department: string; description: string }[]);
    }
  }

  return {
    id: run.id,
    stageNumber: run.template.stageNumber,
    templateTitle: run.template.title,
    goal: run.template.goal,
    owner: run.template.owner,
    sla: run.template.sla,
    customerName: run.customer ? `${run.customer.firstName} ${run.customer.lastName}` : null,
    label: run.label,
    startedByName: run.startedBy ? `${run.startedBy.firstName} ${run.startedBy.lastName}` : null,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    totalSteps,
    completedSteps,
    qualityScore,
    groups: Array.from(groups.entries()).map(([groupLabel, steps]) => ({
      groupLabel,
      crossDepartmental: crossDepartmentalByGroup.get(groupLabel) ?? [],
      steps,
    })),
  };
}

export type DepartmentInteractionSummary = {
  department: string;
  keyContact: string;
  rows: { interactionType: string; frequency: string; keyActivities: string }[];
};

export async function getDepartmentInteractions(): Promise<DepartmentInteractionSummary[]> {
  const rows = await prisma.departmentInteraction.findMany({ orderBy: [{ department: "asc" }, { order: "asc" }] });
  const byDept = new Map<string, DepartmentInteractionSummary>();
  for (const r of rows) {
    if (!byDept.has(r.department)) byDept.set(r.department, { department: r.department, keyContact: r.keyContact, rows: [] });
    byDept.get(r.department)!.rows.push({ interactionType: r.interactionType, frequency: r.frequency, keyActivities: r.keyActivities });
  }
  return Array.from(byDept.values());
}

export type ChecklistRunDetail = NonNullable<Awaited<ReturnType<typeof getChecklistRunDetail>>>;
