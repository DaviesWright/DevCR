"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { syncGoogleAccount } from "@/lib/integrations/gmail-sync";
import { syncMicrosoftAccount } from "@/lib/integrations/microsoft-sync";

export async function getEmailConnectionsForUser(userId: string) {
  const connections = await prisma.emailAccountConnection.findMany({
    where: { userId },
    orderBy: { provider: "asc" },
  });
  return connections.map((c) => ({
    id: c.id,
    provider: c.provider,
    email: c.email,
    status: c.status,
    lastSyncedAt: c.lastSyncedAt,
    lastSyncError: c.lastSyncError,
  }));
}

export async function syncEmailAccountNow(connectionId: string) {
  const connection = await prisma.emailAccountConnection.findUniqueOrThrow({ where: { id: connectionId } });
  const result = connection.provider === "GOOGLE" ? await syncGoogleAccount(connectionId) : await syncMicrosoftAccount(connectionId);
  revalidatePath("/admin");
  revalidatePath("/customers");
  return result;
}

export async function disconnectEmailAccount(connectionId: string) {
  await prisma.emailAccountConnection.delete({ where: { id: connectionId } });
  revalidatePath("/admin");
}
