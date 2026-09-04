"use server";

// No-code project/unit management: lets staff create developments and add/amend units and
// pricing via CSV upload instead of the seed-script-only path this app started with (see
// prisma/seed-devtraco-projects.ts, which upserts with `update: {}` and so never amends an
// existing unit's price — this action fills that gap for live data). Mirrors the seed script's
// Development -> Block -> Floor -> PropertyType -> Unit upsert chain, but real price/status
// changes on an existing unit are applied (and logged to UnitPricingHistory, a model the schema
// already had but nothing wrote to yet) rather than silently skipped.
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { getPermissionProfile, assertCanWrite } from "@/lib/permissions";

export type UnitCsvRow = {
  developmentName: string;
  projectCode: string;
  region?: string;
  location?: string;
  blockName?: string;
  floor?: string;
  unitNumber: string;
  propertyType: string;
  bedrooms?: string;
  bathrooms?: string;
  builtAreaSqm?: string;
  price: string;
  currency?: string;
  status?: string;
};

const VALID_STATUSES = new Set(["AVAILABLE", "RESERVED", "SOLD", "UNDER_CONSTRUCTION", "HANDED_OVER", "BLOCKED"]);

export async function importUnitsCsv(rows: UnitCsvRow[], actorId: string) {
  const profile = await getPermissionProfile(actorId);
  assertCanWrite(profile);

  let createdCount = 0;
  let updatedCount = 0;
  const errors: { row: number; reason: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2;

    if (!r.developmentName?.trim() || !r.projectCode?.trim()) {
      errors.push({ row: rowNum, reason: "Missing developmentName or projectCode" });
      continue;
    }
    if (!r.unitNumber?.trim()) {
      errors.push({ row: rowNum, reason: "Missing unitNumber" });
      continue;
    }
    if (!r.propertyType?.trim()) {
      errors.push({ row: rowNum, reason: "Missing propertyType" });
      continue;
    }
    const price = Number(r.price);
    if (!r.price || !Number.isFinite(price) || price <= 0) {
      errors.push({ row: rowNum, reason: `Invalid price "${r.price}"` });
      continue;
    }
    const status = r.status?.trim() ? r.status.trim().toUpperCase() : "AVAILABLE";
    if (!VALID_STATUSES.has(status)) {
      errors.push({ row: rowNum, reason: `Invalid status "${r.status}"` });
      continue;
    }

    try {
      const development = await prisma.development.upsert({
        where: { projectCode: r.projectCode.trim() },
        update: {
          name: r.developmentName.trim(),
          ...(r.region?.trim() ? { region: r.region.trim() } : {}),
          ...(r.location?.trim() ? { location: r.location.trim() } : {}),
        },
        create: {
          name: r.developmentName.trim(),
          projectCode: r.projectCode.trim(),
          location: r.location?.trim() || "TBD",
          region: r.region?.trim() || null,
          status: "SELLING",
        },
      });

      const blockName = r.blockName?.trim() || "Main";
      const block = await prisma.block.upsert({
        where: { developmentId_name: { developmentId: development.id, name: blockName } },
        update: {},
        create: { developmentId: development.id, name: blockName },
      });

      const level = r.floor?.trim() ? parseInt(r.floor, 10) : 1;
      const floor = await prisma.floor.upsert({
        where: { blockId_level: { blockId: block.id, level: Number.isFinite(level) ? level : 1 } },
        update: {},
        create: { blockId: block.id, level: Number.isFinite(level) ? level : 1 },
      });

      const propertyType = await prisma.propertyType.upsert({
        where: { name: r.propertyType.trim() },
        update: {},
        create: {
          name: r.propertyType.trim(),
          bedrooms: r.bedrooms?.trim() ? parseInt(r.bedrooms, 10) : 0,
          bathrooms: r.bathrooms?.trim() ? parseInt(r.bathrooms, 10) : 0,
          builtAreaSqm: r.builtAreaSqm?.trim() ? Number(r.builtAreaSqm) : 0,
        },
      });

      const currency = r.currency?.trim() || "USD";
      const existingUnit = await prisma.unit.findUnique({
        where: { developmentId_unitNumber: { developmentId: development.id, unitNumber: r.unitNumber.trim() } },
        select: { id: true, currentPrice: true },
      });

      if (existingUnit) {
        const priceChanged = Number(existingUnit.currentPrice) !== price;
        await prisma.unit.update({
          where: { id: existingUnit.id },
          data: {
            blockId: block.id,
            floorId: floor.id,
            propertyTypeId: propertyType.id,
            currentPrice: price,
            currency,
            status: status as never,
          },
        });
        if (priceChanged) {
          await prisma.unitPricingHistory.create({
            data: { unitId: existingUnit.id, price, currency, changedById: actorId, reason: "CSV bulk price update" },
          });
        }
        updatedCount++;
      } else {
        const unit = await prisma.unit.create({
          data: {
            developmentId: development.id,
            blockId: block.id,
            floorId: floor.id,
            propertyTypeId: propertyType.id,
            unitNumber: r.unitNumber.trim(),
            currentPrice: price,
            currency,
            status: status as never,
          },
        });
        await prisma.unitPricingHistory.create({
          data: { unitId: unit.id, price, currency, changedById: actorId, reason: "CSV bulk import — initial price" },
        });
        createdCount++;
      }
    } catch (err) {
      errors.push({ row: rowNum, reason: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  await logAudit(actorId, "IMPORT_UNITS_CSV", "Unit", "bulk", { createdCount, updatedCount, errorCount: errors.length });
  revalidatePath("/projects");

  return { createdCount, updatedCount, errors };
}
