// One-off data addition (2026-09-03) — user asked to "see multiple purchases on buyers" to
// exercise the multi-project-buyer badge and Top Purchasers league table, which had zero repeat
// buyers in the seed data (only 3 total sales, one each). Gives 3 existing customers a second
// confirmed sale in a different development each. Only touches fields getCustomerDetail() and
// getTopPurchasers() actually read (Sale.salePrice/status, Unit.developmentId) — no
// commission/milestone apparatus, since those aren't part of what this data is meant to exercise.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PLAN: { customerName: string; units: string[] }[] = [
  { customerName: "Isaac Opoku", units: ["NOV101", "ADD101"] },
  { customerName: "Elizabeth Ampofo", units: ["ARL903", "LOT202"] },
  { customerName: "Kwabena Tuffour", units: ["EDG1005", "WDL102"] },
];

async function main() {
  let created = 0;
  for (const entry of PLAN) {
    const [firstName, ...rest] = entry.customerName.split(" ");
    const lastName = rest.join(" ");
    const customer = await prisma.customer.findFirstOrThrow({ where: { firstName, lastName } });

    for (const [i, unitNumber] of entry.units.entries()) {
      const unit = await prisma.unit.findFirstOrThrow({ where: { unitNumber } });
      if (unit.status !== "AVAILABLE") continue;

      const saleDate = new Date(Date.now() - (60 - i * 20) * 86400000);
      await prisma.$transaction([
        prisma.sale.create({
          data: {
            unitId: unit.id,
            customerId: customer.id,
            salePrice: unit.currentPrice,
            currency: unit.currency,
            status: "COMPLETED",
            saleDate,
          },
        }),
        prisma.unit.update({ where: { id: unit.id }, data: { status: "SOLD" } }),
      ]);
      created++;
    }
  }
  console.log(`Created ${created} sales across ${PLAN.length} customers.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
