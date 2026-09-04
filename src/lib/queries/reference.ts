import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  departmentId: true,
  role: { select: { id: true, name: true, dataScope: true, reportScope: true, isReadOnly: true } },
} as const;

// Lightweight interim auth: no passwords or sessions, but "who you're acting as" is a real
// per-browser cookie set via setActingUser, not a hardcoded user. Falls back to the first
// seeded user when no cookie is set (e.g. a fresh browser). dataScope/reportScope/isReadOnly
// come straight from Role (src/lib/permissions.ts) — real, server-enforced values per the
// Devtraco CRM Roles & Permissions Specification, not a regex guess at the role name.
export async function getCurrentUser() {
  const actingId = cookies().get("acting_user_id")?.value;

  const acting = actingId
    ? await prisma.user.findFirst({ where: { id: actingId, deletedAt: null, isActive: true }, select: USER_SELECT })
    : null;

  const user =
    acting ??
    (await prisma.user.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: USER_SELECT,
    }));

  if (!user) throw new Error("No users exist — run the seed script first.");
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    roleId: user.role?.id ?? "",
    roleName: user.role?.name ?? null,
    departmentId: user.departmentId,
    dataScope: user.role?.dataScope ?? "OWN",
    reportScope: user.role?.reportScope ?? "OWN",
    isReadOnly: user.role?.isReadOnly ?? false,
    // Kept for existing callers — now derived from real scope instead of a name regex.
    isManager: user.role ? user.role.dataScope !== "OWN" || user.role.isReadOnly : false,
  };
}

export async function getAssignableUsers() {
  const users = await prisma.user.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { firstName: "asc" },
  });
  return users.map((u) => ({ id: u.id, name: `${u.firstName} ${u.lastName}` }));
}

export async function getLeadSources() {
  const sources = await prisma.leadSource.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return sources;
}

// Configurable attribution Channel taxonomy (19-marketing-attribution.prisma) — grouped for the
// New Lead form's dropdown and the admin management panel. Inactive channels/groups are hidden
// from pickers but never deleted, so historical leads keep their attribution intact.
export async function getMarketingChannelGroups(activeOnly = true) {
  const groups = await prisma.marketingChannelGroup.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      channels: {
        where: activeOnly ? { isActive: true } : undefined,
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, isActive: true },
      },
    },
  });
  return groups
    .map((g) => ({ id: g.id, name: g.name, channels: g.channels }))
    .filter((g) => !activeOnly || g.channels.length > 0);
}

export async function getMarketingMediums(activeOnly = true) {
  const mediums = await prisma.marketingMedium.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    select: { id: true, name: true, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return mediums;
}

export async function getCampaigns() {
  const campaigns = await prisma.campaign.findMany({
    where: { status: { in: ["PLANNED", "ACTIVE"] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return campaigns;
}

export async function getPropertyTypes() {
  const types = await prisma.propertyType.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return types;
}

export async function getCustomersForReferralPicker() {
  const customers = await prisma.customer.findMany({
    where: { deletedAt: null },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { firstName: "asc" },
    take: 300,
  });
  return customers.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }));
}

export async function getAvailableUnitsForConversion() {
  const units = await prisma.unit.findMany({
    where: { status: { in: ["AVAILABLE", "RESERVED"] }, deletedAt: null },
    select: { id: true, unitNumber: true, currentPrice: true, currency: true, status: true },
    orderBy: { unitNumber: "asc" },
    take: 100,
  });
  return units.map((u) => ({
    id: u.id,
    unitNumber: u.unitNumber,
    currentPrice: Number(u.currentPrice),
    currency: u.currency,
    status: u.status,
  }));
}
