// Real, server-side permission enforcement per the Devtraco CRM Roles & Permissions
// Specification (v1.0) — replaces the UI-only "assigned rep or manager" checks that were
// scattered across pages (e.g. the old canManage in leads/[id]/page.tsx) with a single engine
// backed by Role.dataScope/reportScope/isReadOnly and FieldPermission.
import { prisma } from "@/lib/prisma";
import type { AccessScope, FieldAccess, RelatedEntityType } from "@prisma/client";

export type PermissionProfile = {
  userId: string;
  roleId: string;
  roleName: string;
  departmentId: string | null;
  dataScope: AccessScope;
  reportScope: AccessScope;
  isReadOnly: boolean;
};

export async function getPermissionProfile(userId: string): Promise<PermissionProfile> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { departmentId: true, role: { select: { id: true, name: true, dataScope: true, reportScope: true, isReadOnly: true } } },
  });
  return {
    userId,
    roleId: user.role.id,
    roleName: user.role.name,
    departmentId: user.departmentId,
    dataScope: user.role.dataScope,
    reportScope: user.role.reportScope,
    isReadOnly: user.role.isReadOnly,
  };
}

// A Prisma `where` fragment scoping a query to what this profile's dataScope allows, given the
// field that names the record's owner (e.g. "assignedToId" for Lead, "ownerId" for Opportunity)
// and, for TEAM/DEPARTMENT scope, the set of user ids in the profile's department.
export async function getDataScopeWhere(
  profile: PermissionProfile,
  ownerField: string
): Promise<Record<string, unknown>> {
  if (profile.dataScope === "ALL" || profile.dataScope === "SYSTEM") return {};
  if (profile.dataScope === "OWN") return { [ownerField]: profile.userId };

  // TEAM / DEPARTMENT — same meaning in this app (no sub-team hierarchy below Department yet).
  if (!profile.departmentId) return { [ownerField]: profile.userId }; // no department = fall back to OWN
  const peers = await prisma.user.findMany({ where: { departmentId: profile.departmentId }, select: { id: true } });
  return { [ownerField]: { in: peers.map((p) => p.id) } };
}

// Throws if the profile's dataScope doesn't cover a record owned by `ownerId`. Use in mutating
// Server Actions right before the write, so a scope violation is a real 4xx-equivalent error,
// not just a hidden button in the UI.
export async function assertCanAccessRecord(profile: PermissionProfile, ownerId: string | null | undefined) {
  if (profile.dataScope === "ALL" || profile.dataScope === "SYSTEM") return;
  if (profile.dataScope === "OWN") {
    if (ownerId !== profile.userId) throw new Error("You don't have access to this record — it isn't assigned to you.");
    return;
  }
  // TEAM / DEPARTMENT
  if (!ownerId) throw new Error("You don't have access to this record.");
  if (!profile.departmentId) {
    if (ownerId !== profile.userId) throw new Error("You don't have access to this record — it isn't assigned to you.");
    return;
  }
  const owner = await prisma.user.findUnique({ where: { id: ownerId }, select: { departmentId: true } });
  if (owner?.departmentId !== profile.departmentId) {
    throw new Error("You don't have access to this record — it belongs to a different department.");
  }
}

// Throws if the role is read-only (Executive View roles per the spec) — call at the top of any
// mutating Server Action once the profile is known.
export function assertCanWrite(profile: PermissionProfile) {
  if (profile.isReadOnly) {
    throw new Error(`Your role (${profile.roleName}) has read-only access — this action isn't available.`);
  }
}

const fieldPermissionCache = new Map<string, Map<string, FieldAccess>>();

async function getFieldOverrides(roleId: string, entityType: RelatedEntityType): Promise<Map<string, FieldAccess>> {
  const cacheKey = `${roleId}:${entityType}`;
  const cached = fieldPermissionCache.get(cacheKey);
  if (cached) return cached;
  const rows = await prisma.fieldPermission.findMany({ where: { roleId, entityType }, select: { fieldName: true, access: true } });
  const map = new Map(rows.map((r) => [r.fieldName, r.access]));
  fieldPermissionCache.set(cacheKey, map);
  return map;
}

// Default access when no FieldPermission row exists for a field: WRITE for a normal role, READ
// for a read-only role (Executives see everything, change nothing).
export async function getFieldAccess(profile: PermissionProfile, entityType: RelatedEntityType, fieldName: string): Promise<FieldAccess> {
  const overrides = await getFieldOverrides(profile.roleId, entityType);
  const override = overrides.get(fieldName);
  if (override) return override;
  return profile.isReadOnly ? "READ" : "WRITE";
}

// Redacts (sets to null) any field the profile's role has HIDDEN for this entity type. Fields
// with no override, or explicit READ/WRITE, pass through unchanged — this is a redaction pass,
// not a full projection.
export async function redactFields<T extends Record<string, unknown>>(
  record: T,
  profile: PermissionProfile,
  entityType: RelatedEntityType
): Promise<T> {
  const overrides = await getFieldOverrides(profile.roleId, entityType);
  if (overrides.size === 0) return record;
  const result = { ...record };
  for (const [field, access] of overrides) {
    if (access === "HIDDEN" && field in result) {
      (result as Record<string, unknown>)[field] = null;
    }
  }
  return result;
}
