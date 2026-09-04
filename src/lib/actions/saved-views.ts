"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function createSavedView(input: {
  name: string;
  entityType: "LEAD" | "CUSTOMER" | "OPPORTUNITY";
  state: Record<string, unknown>;
  createdById: string;
  revalidate: string;
}) {
  const view = await prisma.savedView.create({
    data: {
      name: input.name.trim(),
      entityType: input.entityType,
      state: input.state as Prisma.InputJsonValue,
      createdById: input.createdById,
    },
  });
  revalidatePath(input.revalidate);
  return { viewId: view.id };
}

export async function updateSavedView(viewId: string, state: Record<string, unknown>, revalidate: string) {
  await prisma.savedView.update({ where: { id: viewId }, data: { state: state as Prisma.InputJsonValue } });
  revalidatePath(revalidate);
}

export async function deleteSavedView(viewId: string, revalidate: string) {
  await prisma.savedView.delete({ where: { id: viewId } });
  revalidatePath(revalidate);
}
