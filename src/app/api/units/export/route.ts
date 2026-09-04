import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";

const IMPORT_TEMPLATE_HEADERS = [
  "developmentName",
  "projectCode",
  "region",
  "location",
  "blockName",
  "floor",
  "unitNumber",
  "propertyType",
  "bedrooms",
  "bathrooms",
  "builtAreaSqm",
  "price",
  "currency",
  "status",
];

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("template") === "1") {
    const csv = toCsv(IMPORT_TEMPLATE_HEADERS, [
      ["Woodlands", "WDL-001", "Greater Accra", "Trasacco Valley, Accra", "Plots A", "1", "WDL111", "Serviced Plot", "0", "0", "600", "18500", "USD", "AVAILABLE"],
      ["Nova", "NOVA-001", "Greater Accra", "Roman Ridge, Accra", "Tower 1", "5", "NOV501", "2-Bedroom Apartment", "2", "2", "95", "320000", "USD", "AVAILABLE"],
    ]);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="units-import-template.csv"`,
      },
    });
  }

  const units = await prisma.unit.findMany({
    where: { deletedAt: null },
    orderBy: [{ development: { name: "asc" } }, { unitNumber: "asc" }],
    include: {
      development: { select: { name: true, projectCode: true } },
      block: { select: { name: true } },
      propertyType: { select: { name: true, bedrooms: true, bathrooms: true } },
    },
  });

  const headers = [
    "development",
    "projectCode",
    "block",
    "unitNumber",
    "propertyType",
    "bedrooms",
    "bathrooms",
    "currentPrice",
    "currency",
    "status",
  ];
  const rows = units.map((u) => [
    u.development.name,
    u.development.projectCode,
    u.block?.name ?? "",
    u.unitNumber,
    u.propertyType.name,
    u.propertyType.bedrooms,
    u.propertyType.bathrooms,
    Number(u.currentPrice),
    u.currency,
    u.status,
  ]);

  const csv = toCsv(headers, rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="units-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
