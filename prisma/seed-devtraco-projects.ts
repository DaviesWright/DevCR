// Devtraco Group's full development portfolio, as a standalone, idempotent seed file — every
// entity is upserted on its natural unique key (PropertyType.name, Development.projectCode,
// Block[developmentId,name], Floor[blockId,level], Unit[developmentId,unitNumber]), so this file
// is safe to run whether or not prisma/seed.ts has already created these same 12 developments
// (it will not duplicate them), and safe to re-run.
//
// Run:  npx tsx prisma/seed-devtraco-projects.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type UnitSpec = { floor: number; room: number; propertyType: string; price: number; status?: "AVAILABLE" | "RESERVED" | "SOLD" };
type DevelopmentSpec = {
  name: string;
  projectCode: string; // matches the projectCode already used by prisma/seed.ts, so this script
                        // never creates a duplicate development for one that already exists.
  unitPrefix: string;  // matches prisma/seed.ts's existing unit-number convention per development.
  location: string;
  region: string;
  totalUnits: number;
  blockName: string;
  status: "PLANNING" | "CONSTRUCTION" | "SELLING" | "COMPLETED";
  units: UnitSpec[];
};

// Bedrooms/bathrooms/area per Devtraco's actual unit mix. Woodlands sells serviced land plots,
// not built units, so bedrooms/bathrooms are 0 and builtAreaSqm holds plot size instead.
const PROPERTY_TYPES = [
  { name: "Studio Apartment", bedrooms: 0, bathrooms: 1, builtAreaSqm: 38 },
  { name: "1-Bedroom Apartment", bedrooms: 1, bathrooms: 1, builtAreaSqm: 65 },
  { name: "2-Bedroom Apartment", bedrooms: 2, bathrooms: 2, builtAreaSqm: 95 },
  { name: "3-Bedroom Townhouse", bedrooms: 3, bathrooms: 3, builtAreaSqm: 165 },
  { name: "4-Bedroom Detached", bedrooms: 4, bathrooms: 4, builtAreaSqm: 220 },
  { name: "Penthouse", bedrooms: 4, bathrooms: 5, builtAreaSqm: 320 },
  { name: "Hotel Suite", bedrooms: 1, bathrooms: 1, builtAreaSqm: 45 },
  { name: "Serviced Plot", bedrooms: 0, bathrooms: 0, builtAreaSqm: 600 },
] as const;

// The full Devtraco Group portfolio. Unit numbers follow {projectCode}{floor}{room, zero-padded
// to 2} — e.g. AHR301 = Airport Hills, floor 3, room 01 — matching the convention already in use.
const DEVELOPMENTS: DevelopmentSpec[] = [
  {
    name: "Airport Hills Residences", projectCode: "AHR-001", unitPrefix: "A-", location: "Accra, Ghana", region: "Greater Accra",
    totalUnits: 240, blockName: "Block A", status: "SELLING",
    units: [
      { floor: 3, room: 1, propertyType: "3-Bedroom Townhouse", price: 850000, status: "AVAILABLE" },
      { floor: 3, room: 2, propertyType: "4-Bedroom Detached", price: 1200000, status: "RESERVED" },
      { floor: 2, room: 3, propertyType: "3-Bedroom Townhouse", price: 850000, status: "SOLD" },
      { floor: 4, room: 1, propertyType: "3-Bedroom Townhouse", price: 875000, status: "AVAILABLE" },
      { floor: 4, room: 2, propertyType: "3-Bedroom Townhouse", price: 875000, status: "AVAILABLE" },
    ],
  },
  {
    name: "Nova", projectCode: "NOVA-001", unitPrefix: "NOV", location: "Roman Ridge, Accra", region: "Greater Accra",
    totalUnits: 180, blockName: "Tower 1", status: "SELLING",
    units: [
      { floor: 1, room: 1, propertyType: "Studio Apartment", price: 380000, status: "AVAILABLE" },
      { floor: 1, room: 2, propertyType: "Studio Apartment", price: 380000, status: "AVAILABLE" },
      { floor: 2, room: 1, propertyType: "2-Bedroom Apartment", price: 520000, status: "AVAILABLE" },
      { floor: 2, room: 2, propertyType: "2-Bedroom Apartment", price: 520000, status: "AVAILABLE" },
      { floor: 2, room: 3, propertyType: "2-Bedroom Apartment", price: 550000, status: "AVAILABLE" },
    ],
  },
  {
    name: "The Edge", projectCode: "EDG-001", unitPrefix: "EDG", location: "Cantonments, Accra", region: "Greater Accra",
    totalUnits: 150, blockName: "Tower 1", status: "SELLING",
    units: [
      { floor: 22, room: 10, propertyType: "2-Bedroom Apartment", price: 320000 },
      { floor: 22, room: 11, propertyType: "2-Bedroom Apartment", price: 320000, status: "RESERVED" },
      { floor: 10, room: 5, propertyType: "3-Bedroom Townhouse", price: 410000 },
      { floor: 10, room: 6, propertyType: "3-Bedroom Townhouse", price: 410000 },
    ],
  },
  {
    name: "Henrietta's Residences", projectCode: "HEN-001", unitPrefix: "HEN", location: "East Legon, Accra", region: "Greater Accra",
    totalUnits: 60, blockName: "Block A", status: "SELLING",
    units: [
      { floor: 1, room: 1, propertyType: "1-Bedroom Apartment", price: 145000 },
      { floor: 1, room: 2, propertyType: "1-Bedroom Apartment", price: 145000 },
      { floor: 2, room: 3, propertyType: "2-Bedroom Apartment", price: 210000, status: "SOLD" },
    ],
  },
  {
    name: "The Address", projectCode: "ADD-001", unitPrefix: "ADD", location: "Airport Residential Area, Accra", region: "Greater Accra",
    totalUnits: 200, blockName: "Tower 1", status: "SELLING",
    units: [
      { floor: 1, room: 1, propertyType: "3-Bedroom Townhouse", price: 480000 },
      { floor: 1, room: 2, propertyType: "3-Bedroom Townhouse", price: 480000 },
      { floor: 5, room: 28, propertyType: "Penthouse", price: 950000 },
      { floor: 5, room: 29, propertyType: "4-Bedroom Detached", price: 720000, status: "RESERVED" },
    ],
  },
  {
    name: "The Pelican Hotel", projectCode: "PEL-001", unitPrefix: "PEL", location: "Osu, Accra", region: "Greater Accra",
    totalUnits: 80, blockName: "Main Wing", status: "SELLING",
    units: [
      { floor: 3, room: 1, propertyType: "Hotel Suite", price: 165000 },
      { floor: 3, room: 2, propertyType: "Hotel Suite", price: 165000 },
      { floor: 6, room: 4, propertyType: "Hotel Suite", price: 185000, status: "SOLD" },
    ],
  },
  {
    name: "ARLO Cantonments", projectCode: "ARL-001", unitPrefix: "ARL", location: "Cantonments, Accra", region: "Greater Accra",
    totalUnits: 200, blockName: "Tower A", status: "SELLING",
    units: [
      { floor: 4, room: 1, propertyType: "3-Bedroom Townhouse", price: 520000 },
      { floor: 4, room: 2, propertyType: "4-Bedroom Detached", price: 680000 },
      { floor: 9, room: 3, propertyType: "Penthouse", price: 1100000 },
    ],
  },
  {
    name: "Forte", projectCode: "FRT-001", unitPrefix: "FRT", location: "Spintex, Accra", region: "Greater Accra",
    totalUnits: 120, blockName: "Block A", status: "SELLING",
    units: [
      { floor: 1, room: 1, propertyType: "1-Bedroom Apartment", price: 130000 },
      { floor: 1, room: 2, propertyType: "2-Bedroom Apartment", price: 190000 },
      { floor: 3, room: 3, propertyType: "2-Bedroom Apartment", price: 195000, status: "RESERVED" },
    ],
  },
  {
    name: "The Niiyo", projectCode: "NII-001", unitPrefix: "NII", location: "Tema, Greater Accra", region: "Greater Accra",
    totalUnits: 100, blockName: "Block A", status: "SELLING",
    units: [
      { floor: 1, room: 1, propertyType: "Studio Apartment", price: 78000 },
      { floor: 2, room: 2, propertyType: "1-Bedroom Apartment", price: 135000 },
      { floor: 2, room: 3, propertyType: "2-Bedroom Apartment", price: 205000 },
    ],
  },
  {
    name: "Avant Garde", projectCode: "AVG-001", unitPrefix: "AVG", location: "Airport Hills, Accra", region: "Greater Accra",
    totalUnits: 65, blockName: "Block A", status: "SELLING",
    units: [
      { floor: 1, room: 1, propertyType: "3-Bedroom Townhouse", price: 460000 },
      { floor: 2, room: 2, propertyType: "4-Bedroom Detached", price: 640000, status: "SOLD" },
    ],
  },
  {
    name: "Woodlands", projectCode: "WDL-001", unitPrefix: "WDL", location: "Trasacco Valley, Accra", region: "Greater Accra",
    totalUnits: 400, blockName: "Plots A", status: "SELLING",
    units: [
      { floor: 1, room: 1, propertyType: "Serviced Plot", price: 18500 },
      { floor: 1, room: 2, propertyType: "Serviced Plot", price: 18500 },
    ],
  },
  {
    name: "Lotus", projectCode: "LOT-001", unitPrefix: "LOT", location: "Adjiringanor, Accra", region: "Greater Accra",
    totalUnits: 200, blockName: "Block A", status: "SELLING",
    units: [
      { floor: 1, room: 1, propertyType: "1-Bedroom Apartment", price: 140000 },
      { floor: 2, room: 2, propertyType: "2-Bedroom Apartment", price: 215000 },
      { floor: 2, room: 3, propertyType: "2-Bedroom Apartment", price: 215000, status: "RESERVED" },
    ],
  },
];

async function main() {
  console.log("Seeding Devtraco Group's full development portfolio (idempotent)...");

  const propertyTypeIdByName = new Map<string, string>();
  for (const pt of PROPERTY_TYPES) {
    const created = await prisma.propertyType.upsert({
      where: { name: pt.name },
      update: {},
      create: pt,
    });
    propertyTypeIdByName.set(pt.name, created.id);
  }

  let developmentCount = 0;
  let unitCount = 0;

  for (const dev of DEVELOPMENTS) {
    const development = await prisma.development.upsert({
      where: { projectCode: dev.projectCode },
      update: {
        name: dev.name,
        location: dev.location,
        region: dev.region,
        status: dev.status,
        totalUnits: dev.totalUnits,
      },
      create: {
        name: dev.name,
        projectCode: dev.projectCode,
        location: dev.location,
        region: dev.region,
        status: dev.status,
        totalUnits: dev.totalUnits,
      },
    });
    developmentCount++;

    const block = await prisma.block.upsert({
      where: { developmentId_name: { developmentId: development.id, name: dev.blockName } },
      update: {},
      create: { developmentId: development.id, name: dev.blockName },
    });

    const floorIdByLevel = new Map<number, string>();
    for (const level of [...new Set(dev.units.map((u) => u.floor))]) {
      const floor = await prisma.floor.upsert({
        where: { blockId_level: { blockId: block.id, level } },
        update: {},
        create: { blockId: block.id, level },
      });
      floorIdByLevel.set(level, floor.id);
    }

    for (const u of dev.units) {
      const unitNumber = `${dev.unitPrefix}${u.floor}${String(u.room).padStart(2, "0")}`;
      await prisma.unit.upsert({
        where: { developmentId_unitNumber: { developmentId: development.id, unitNumber } },
        update: {},
        create: {
          developmentId: development.id,
          blockId: block.id,
          floorId: floorIdByLevel.get(u.floor)!,
          propertyTypeId: propertyTypeIdByName.get(u.propertyType)!,
          unitNumber,
          currentPrice: u.price,
          status: (u.status ?? "AVAILABLE") as never,
        },
      });
      unitCount++;
    }
  }

  console.log(`Ensured ${developmentCount} developments and ${unitCount} units (created or already present).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
