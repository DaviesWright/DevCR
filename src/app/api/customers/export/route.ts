import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const customers = await prisma.customer.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      assignedSalesRep: { select: { firstName: true, lastName: true } },
      sales: { where: { status: { in: ["ACTIVE", "COMPLETED"] } }, select: { salePrice: true } },
    },
  });

  const headers = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "nationality",
    "segment",
    "kycStatus",
    "assignedSalesRep",
    "lifetimeValue",
    "engagementScore",
    "sentiment",
    "createdAt",
  ];
  const rows = customers.map((c) => [
    c.firstName,
    c.lastName,
    c.email,
    c.phone,
    c.nationality,
    c.segment,
    c.kycStatus,
    c.assignedSalesRep ? `${c.assignedSalesRep.firstName} ${c.assignedSalesRep.lastName}` : "",
    c.sales.reduce((sum, s) => sum + Number(s.salePrice), 0),
    Number(c.engagementScore),
    c.sentiment,
    c.createdAt.toISOString(),
  ]);

  const csv = toCsv(headers, rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
