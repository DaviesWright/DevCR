import { prisma } from "@/lib/prisma";
import { runReport } from "@/lib/reports/engine";
import type { SavedReportConfig } from "@/lib/actions/reports";

// A saved report's data isn't cached — every view re-runs it against current data (same
// "computed, not stored" convention used elsewhere in this app, e.g. deal aging, reservation
// expiry). Datasets are small enough that this is cheap.

export async function getReportsList(userId: string) {
  const reports = await prisma.dashboard.findMany({
    where: { OR: [{ createdById: userId }, { isShared: true }] },
    orderBy: { updatedAt: "desc" },
    include: { createdBy: { select: { firstName: true, lastName: true } } },
  });

  return reports.map((r) => {
    const config = r.config as unknown as SavedReportConfig;
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      config,
      isShared: r.isShared,
      isOwn: r.createdById === userId,
      createdByName: r.createdBy ? `${r.createdBy.firstName} ${r.createdBy.lastName}` : null,
      updatedAt: r.updatedAt,
    };
  });
}

export type ReportListItem = Awaited<ReturnType<typeof getReportsList>>[number];

export async function getReportDetail(id: string, userId: string) {
  const r = await prisma.dashboard.findUnique({
    where: { id },
    include: { createdBy: { select: { firstName: true, lastName: true } } },
  });
  if (!r) return null;
  if (r.createdById !== userId && !r.isShared) return null;

  const config = r.config as unknown as SavedReportConfig;
  const result = await runReport(config);

  return {
    id: r.id,
    name: r.name,
    description: r.description,
    config,
    isShared: r.isShared,
    isOwn: r.createdById === userId,
    createdByName: r.createdBy ? `${r.createdBy.firstName} ${r.createdBy.lastName}` : null,
    updatedAt: r.updatedAt,
    result,
  };
}

export type ReportDetail = NonNullable<Awaited<ReturnType<typeof getReportDetail>>>;
