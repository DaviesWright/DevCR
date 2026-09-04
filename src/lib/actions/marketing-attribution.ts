"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// Admin CRUD for the configurable attribution Channel/Medium master tables
// (19-marketing-attribution.prisma) — the whole point of "configurable" per the 2026-09-04
// request is that a new channel is a form submission here, not a code change.

export async function createMarketingChannelGroup(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Group name is required.");
  const maxOrder = await prisma.marketingChannelGroup.aggregate({ _max: { sortOrder: true } });
  const group = await prisma.marketingChannelGroup.create({
    data: { name: trimmed, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
  });
  revalidatePath("/admin");
  return { groupId: group.id };
}

export async function createMarketingChannel(groupId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Channel name is required.");
  const maxOrder = await prisma.marketingChannelMaster.aggregate({
    where: { groupId },
    _max: { sortOrder: true },
  });
  const channel = await prisma.marketingChannelMaster.create({
    data: { groupId, name: trimmed, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
  });
  revalidatePath("/admin");
  return { channelId: channel.id };
}

export async function toggleMarketingChannelActive(channelId: string, isActive: boolean) {
  await prisma.marketingChannelMaster.update({ where: { id: channelId }, data: { isActive } });
  revalidatePath("/admin");
}

export async function createMarketingMedium(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Medium name is required.");
  const maxOrder = await prisma.marketingMedium.aggregate({ _max: { sortOrder: true } });
  const medium = await prisma.marketingMedium.create({
    data: { name: trimmed, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
  });
  revalidatePath("/admin");
  return { mediumId: medium.id };
}

export async function toggleMarketingMediumActive(mediumId: string, isActive: boolean) {
  await prisma.marketingMedium.update({ where: { id: mediumId }, data: { isActive } });
  revalidatePath("/admin");
}
