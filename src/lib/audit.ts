import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Shared audit trail helper (Master Technical Specification §39, Rule 8 — "every automation
// action must be auditable"). Uses the existing AuditLog table. Scoped to actions with real
// business consequence, not every read or list-refresh.
export function logAudit(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  changes?: Prisma.InputJsonValue
) {
  return prisma.auditLog.create({ data: { userId, action, entityType, entityId, changes } });
}
