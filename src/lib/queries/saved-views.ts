import { prisma } from "@/lib/prisma";

export async function getSavedViews(entityType: "LEAD" | "CUSTOMER" | "OPPORTUNITY", userId: string) {
  const views = await prisma.savedView.findMany({
    where: { entityType, createdById: userId },
    orderBy: { name: "asc" },
  });
  return views.map((v) => ({
    id: v.id,
    name: v.name,
    state: v.state as Record<string, unknown>,
    isDefault: v.isDefault,
  }));
}
