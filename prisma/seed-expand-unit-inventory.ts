// One-off seed (2026-09-03): every Development had only 2-8 real Unit rows despite a much
// larger totalUnits capacity figure (e.g. Woodlands: totalUnits=400, only 2 Unit rows existed).
// Tops each development up to at least 10 real, individually reservable/sellable Unit rows so
// the Projects page shows a realistic inventory per project. Reuses each development's own
// existing property types, prices, and unit-number prefix/format — continues the established
// numbering convention (e.g. NOV1xx, ADD1xx/5xx, WDL1xx) rather than inventing a new one.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TARGET_PER_DEVELOPMENT = 10;

function parseUnitNumber(unitNumber: string): { prefix: string; digits: string; value: number } | null {
  const m = unitNumber.match(/^(.*?)(\d+)$/);
  if (!m) return null;
  return { prefix: m[1], digits: m[2], value: Number(m[2]) };
}

async function main() {
  const developments = await prisma.development.findMany({
    include: {
      units: {
        where: { deletedAt: null },
        select: { unitNumber: true, propertyTypeId: true, currentPrice: true, currency: true },
      },
    },
  });

  let totalCreated = 0;

  for (const dev of developments) {
    const needed = TARGET_PER_DEVELOPMENT - dev.units.length;
    if (needed <= 0) continue;

    // Group existing units by property type so new units keep the same type/price mix.
    const groups = new Map<string, { propertyTypeId: string; currentPrice: string; currency: string; maxValue: number; prefix: string; digitLen: number }>();
    for (const u of dev.units) {
      const parsed = parseUnitNumber(u.unitNumber);
      if (!parsed) continue;
      const existing = groups.get(u.propertyTypeId);
      if (!existing || parsed.value > existing.maxValue) {
        groups.set(u.propertyTypeId, {
          propertyTypeId: u.propertyTypeId,
          currentPrice: u.currentPrice.toString(),
          currency: u.currency,
          maxValue: parsed.value,
          prefix: parsed.prefix,
          digitLen: parsed.digits.length,
        });
      }
    }
    if (groups.size === 0) continue;

    const usedNumbers = new Set(dev.units.map((u) => u.unitNumber));
    const groupList = [...groups.values()];
    const toCreate: { developmentId: string; propertyTypeId: string; unitNumber: string; currentPrice: string; currency: string }[] = [];

    for (let i = 0; i < needed; i++) {
      const group = groupList[i % groupList.length];
      let next = group.maxValue + 1;
      let unitNumber = `${group.prefix}${String(next).padStart(group.digitLen, "0")}`;
      while (usedNumbers.has(unitNumber)) {
        next += 1;
        unitNumber = `${group.prefix}${String(next).padStart(group.digitLen, "0")}`;
      }
      group.maxValue = next;
      usedNumbers.add(unitNumber);
      toCreate.push({
        developmentId: dev.id,
        propertyTypeId: group.propertyTypeId,
        unitNumber,
        currentPrice: group.currentPrice,
        currency: group.currency,
      });
    }

    for (const u of toCreate) {
      await prisma.unit.create({
        data: {
          developmentId: u.developmentId,
          propertyTypeId: u.propertyTypeId,
          unitNumber: u.unitNumber,
          currentPrice: u.currentPrice,
          currency: u.currency,
          status: "AVAILABLE",
        },
      });
    }
    totalCreated += toCreate.length;
    console.log(`${dev.name}: ${dev.units.length} -> ${dev.units.length + toCreate.length} units (+${toCreate.length})`);
  }

  console.log(`Total units created: ${totalCreated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
