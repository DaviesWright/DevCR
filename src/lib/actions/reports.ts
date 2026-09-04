"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { runReport, type ReportConfig, type ReportResult, type ReportChartType } from "@/lib/reports/engine";

export type SavedReportConfig = ReportConfig & { chartType: ReportChartType };

// Runs a report without saving it — powers the builder's live preview as a manager configures
// entity/dimension/metric/chart type.
export async function previewReport(config: ReportConfig): Promise<ReportResult> {
  return runReport(config);
}

export async function createReport(input: {
  name: string;
  description?: string;
  config: SavedReportConfig;
  createdById: string;
  isShared: boolean;
}) {
  const report = await prisma.dashboard.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      config: input.config as never,
      createdById: input.createdById,
      isShared: input.isShared,
    },
  });
  revalidatePath("/reports");
  return { reportId: report.id };
}

export async function updateReport(
  id: string,
  input: { name: string; description?: string; config: SavedReportConfig; isShared: boolean }
) {
  await prisma.dashboard.update({
    where: { id },
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      config: input.config as never,
      isShared: input.isShared,
    },
  });
  revalidatePath("/reports");
  revalidatePath(`/reports/${id}`);
}

export async function deleteReport(id: string) {
  await prisma.dashboard.delete({ where: { id } });
  revalidatePath("/reports");
}
