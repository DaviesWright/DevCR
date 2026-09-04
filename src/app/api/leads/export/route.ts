import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";

const IMPORT_TEMPLATE_HEADERS = [
  "firstName",
  "lastName",
  "phone",
  "email",
  "nationality",
  "segment",
  "source",
  "budgetMin",
  "budgetMax",
  "currency",
  "preferredLocation",
  "notes",
];

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("template") === "1") {
    const csv = toCsv(IMPORT_TEMPLATE_HEADERS, [
      ["Kwame", "Mensah", "+233241110099", "kwame.mensah2@example.com", "Ghanaian", "LOCAL_RESIDENTIAL", "Website", "200000", "350000", "USD", "East Legon", "Interested in a 2-bedroom unit"],
    ]);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-import-template.csv"`,
      },
    });
  }

  const leads = await prisma.lead.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { firstName: true, lastName: true, email: true, phone: true, segment: true } },
      source: { select: { name: true } },
      channel: { select: { name: true, group: { select: { name: true } } } },
      medium: { select: { name: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
      propertyType: { select: { name: true } },
    },
  });

  const headers = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "segment",
    "source",
    "channelGroup",
    "channel",
    "medium",
    "touchpoint",
    "status",
    "qualificationStatus",
    "bantScore",
    "assignedTo",
    "propertyType",
    "budgetMin",
    "budgetMax",
    "currency",
    "preferredLocation",
    "createdAt",
  ];
  const rows = leads.map((l) => [
    l.customer.firstName,
    l.customer.lastName,
    l.customer.email,
    l.customer.phone,
    l.customer.segment,
    l.source.name,
    l.channel?.group.name ?? "",
    l.channel?.name ?? "",
    l.medium?.name ?? "",
    l.touchpoint ?? "",
    l.status,
    l.qualificationStatus,
    l.bantScore,
    l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}` : "",
    l.propertyType?.name ?? "",
    l.budgetMin ? Number(l.budgetMin) : "",
    l.budgetMax ? Number(l.budgetMax) : "",
    l.currency,
    l.preferredLocation ?? "",
    l.createdAt.toISOString(),
  ]);

  const csv = toCsv(headers, rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
