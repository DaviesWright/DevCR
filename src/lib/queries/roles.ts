import { prisma } from "@/lib/prisma";

export async function getRolesOverview() {
  const roles = await prisma.role.findMany({
    orderBy: [{ dataScope: "desc" }, { name: "asc" }],
    include: { _count: { select: { users: true, fieldPermissions: true } } },
  });
  return roles.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    dataScope: r.dataScope,
    reportScope: r.reportScope,
    isReadOnly: r.isReadOnly,
    userCount: r._count.users,
    fieldRestrictionCount: r._count.fieldPermissions,
  }));
}
