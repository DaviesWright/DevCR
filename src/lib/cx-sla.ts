// Entitlement-based SLA tiering (2026 source-docs gap analysis §4) — Diaspora/Investor get a
// "Premium" tier (halved response/resolution targets), Corporate gets "Strategic" (even
// faster), Local Resident is the Standard baseline. Applied at complaint-creation time by
// scaling the category's default SLA hours — no separate entitlement table needed since the
// buyer segment DevCRM already tracks is the entitlement.
const SEGMENT_SLA_MULTIPLIER: Record<string, number> = {
  DIASPORA: 0.5,
  INVESTOR: 0.5,
  CORPORATE: 0.4,
  LOCAL_RESIDENTIAL: 1,
};

export function slaMultiplierForSegment(segment: string | null): number {
  return segment ? (SEGMENT_SLA_MULTIPLIER[segment] ?? 1) : 1;
}

export type EscalationLevel = 0 | 1 | 2 | 3 | 4;

// Computed, not stored — same "no scheduler exists" convention as the reservation-expiry and
// deal-aging logic elsewhere. L0-L4 mirror the source doc's escalation matrix:
// L0 owner-only, L1 first-response warning (75% elapsed), L2 any breach, L3 breached 2x the
// target, L4 a CRITICAL case still unresolved after 24h.
export function computeEscalationLevel(input: {
  priority: string;
  status: string;
  openedAt: Date;
  pausedAt: Date | null;
  responseDueAt: Date | null;
  resolutionDueAt: Date | null;
  respondedAt: Date | null;
  resolvedAt: Date | null;
}): EscalationLevel {
  if (input.pausedAt) return 0;
  if (["RESOLVED", "CLOSED"].includes(input.status)) return 0;

  const now = Date.now();

  if (
    input.priority === "CRITICAL" &&
    !input.resolvedAt &&
    now - input.openedAt.getTime() > 24 * 3600000
  ) {
    return 4;
  }

  if (input.resolutionDueAt && !input.resolvedAt) {
    const overdueMs = now - input.resolutionDueAt.getTime();
    if (overdueMs > (input.resolutionDueAt.getTime() - input.openedAt.getTime())) return 3;
    if (overdueMs > 0) return 2;
  }
  if (input.responseDueAt && !input.respondedAt && now > input.responseDueAt.getTime()) return 2;

  if (input.responseDueAt && !input.respondedAt) {
    const totalMs = input.responseDueAt.getTime() - input.openedAt.getTime();
    const elapsedMs = now - input.openedAt.getTime();
    if (totalMs > 0 && elapsedMs / totalMs >= 0.75) return 1;
  }

  return 0;
}

export const ESCALATION_LABEL: Record<EscalationLevel, string> = {
  0: "On track",
  1: "Response warning",
  2: "SLA breached",
  3: "Critically overdue",
  4: "Executive escalation",
};
