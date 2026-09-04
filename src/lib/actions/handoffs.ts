"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function revalidateHandoffs() {
  revalidatePath("/cx");
}

export async function acknowledgeHandoff(
  handoverId: string,
  input: { cxLeadId: string; dossierComplete: boolean; dossierNote?: string }
) {
  await prisma.clientHandover.update({
    where: { id: handoverId },
    data: {
      cxLeadId: input.cxLeadId,
      dossierComplete: input.dossierComplete,
      dossierNote: input.dossierNote || undefined,
      acknowledgedAt: new Date(),
      status: "ACKNOWLEDGED",
    },
  });
  revalidateHandoffs();
}

export async function logHandoffIntroduction(handoverId: string) {
  await prisma.clientHandover.update({
    where: { id: handoverId },
    data: { introductionLoggedAt: new Date(), status: "INTRODUCED" },
  });
  revalidateHandoffs();
}

export async function sendHandoffWelcome(handoverId: string) {
  await prisma.clientHandover.update({
    where: { id: handoverId },
    data: { welcomeSentAt: new Date(), status: "WELCOMED" },
  });
  revalidateHandoffs();
}

export async function scoreHandoffQuality(handoverId: string, input: { score: number; note?: string }) {
  await prisma.clientHandover.update({
    where: { id: handoverId },
    data: { qualityScore: input.score, qualityNote: input.note || undefined, status: "COMPLETE" },
  });
  revalidateHandoffs();
}
