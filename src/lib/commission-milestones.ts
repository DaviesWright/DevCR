// Commission milestone gating (Commission Structure doc, as confirmed directly by the user):
// T1 (80%) releases only once every condition below is true. T2/T3 (10% each) additionally
// require the preceding tranche PAID and the client's instalment confirmed received.
//
// SPA_GRACE_PERIOD_DAYS is the doc's own "recommended" default for Management Decision #1
// (SPA grace period) — Devtraco hasn't made that decision yet, so this is a sensible default,
// not a hardcoded business rule. Same for PAST_DUE_TOLERANCE_DAYS (Decision #2).
export const SPA_GRACE_PERIOD_DAYS = 30;
export const PAST_DUE_TOLERANCE_DAYS = 14;

export const MILESTONE_STEPS = [
  { key: "depositConfirmedAt", label: "Deposit received & confirmed cleared" },
  { key: "spaSignedByClientAt", label: "SPA signed by client" },
  { key: "spaSignedByDevtracoAt", label: "SPA countersigned by Devtraco" },
  { key: "unitAllocatedAt", label: "Unit formally allocated" },
  { key: "managementApprovedAt", label: "Management approval issued" },
] as const;

export type MilestoneChecklist = {
  depositConfirmedAt: Date | null;
  spaSignedByClientAt: Date | null;
  spaSignedByDevtracoAt: Date | null;
  unitAllocatedAt: Date | null;
  managementApprovedAt: Date | null;
};

export function isT1GateMet(checklist: MilestoneChecklist): boolean {
  return MILESTONE_STEPS.every((step) => checklist[step.key] !== null);
}

export function completedStepCount(checklist: MilestoneChecklist): number {
  return MILESTONE_STEPS.filter((step) => checklist[step.key] !== null).length;
}

// Days since deposit confirmed with the SPA still not fully signed (both parties) — drives the
// "PENDING — SPA" / "ESCALATED" states in the source doc's SPA Delay Protocol.
export function spaDelayDays(checklist: MilestoneChecklist): number | null {
  if (!checklist.depositConfirmedAt) return null;
  if (checklist.spaSignedByClientAt && checklist.spaSignedByDevtracoAt) return null;
  return Math.floor((Date.now() - checklist.depositConfirmedAt.getTime()) / 86400000);
}

export function isSpaEscalated(checklist: MilestoneChecklist): boolean {
  const days = spaDelayDays(checklist);
  return days !== null && days > SPA_GRACE_PERIOD_DAYS;
}
