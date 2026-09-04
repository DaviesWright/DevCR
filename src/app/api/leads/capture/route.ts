import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStageIdByKey } from "@/lib/pipeline/stages";

// Matches the payload built by buildLeadPayload() in the Devtraco Plus
// tablet lead-capture form (leadgen7.html). That form still posts to its
// own Power Automate webhook for email/WhatsApp delivery — this endpoint
// is a second, independent ingestion path straight into the CRM's Postgres
// database, meant to be added as an additional fetch() target once this
// app is deployed somewhere the tablets can reach.
type CapturePayload = {
  name: string;
  phone: string;
  email?: string;
  preferredContact?: string;
  developmentInterest?: string;
  propertyType?: string;
  purpose?: string;
  budgetRange?: string;
  purchaseTimeline?: string;
  preferredLocation?: string;
  notes?: string;
  sourceLocation?: string;
  assignedExecutive?: string;
  assignedExecutiveName?: string;
  consentGiven?: boolean;
  consentTimestamp?: string;
  timestamp?: string;
};

const BUDGET_RANGES: Record<string, [number, number]> = {
  "under-200k": [0, 200_000],
  "200k-500k": [200_000, 500_000],
  "500k-1m": [500_000, 1_000_000],
  "1m-2m": [1_000_000, 2_000_000],
  "2m-plus": [2_000_000, 5_000_000],
};

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts.shift() ?? fullName;
  const lastName = parts.join(" ") || "—";
  return { firstName, lastName };
}

export async function POST(request: Request) {
  let payload: CapturePayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload.name?.trim() || !payload.phone?.trim()) {
    return NextResponse.json({ error: "name and phone are required" }, { status: 400 });
  }

  const { firstName, lastName } = splitName(payload.name);
  const capturedAt = payload.timestamp ? new Date(payload.timestamp) : new Date();

  const [salesRole, salesDept, siteSource] = await Promise.all([
    prisma.role.upsert({
      where: { name: "Sales Agent" },
      update: {},
      create: { name: "Sales Agent", isSystem: true },
    }),
    prisma.department.upsert({
      where: { name: "Sales" },
      update: {},
      create: { name: "Sales" },
    }),
    prisma.leadSource.upsert({
      where: { name: payload.sourceLocation?.trim() || "Site Activation" },
      update: {},
      create: { name: payload.sourceLocation?.trim() || "Site Activation" },
    }),
  ]);

  let assignedToId: string | null = null;
  if (payload.assignedExecutive) {
    const execName = payload.assignedExecutiveName?.trim() || payload.assignedExecutive;
    const { firstName: execFirst, lastName: execLast } = splitName(execName);
    const user = await prisma.user.upsert({
      where: { employeeCode: payload.assignedExecutive },
      update: {},
      create: {
        employeeCode: payload.assignedExecutive,
        firstName: execFirst,
        lastName: execLast,
        email: `${payload.assignedExecutive.toLowerCase()}@devtracoplus.com`,
        passwordHash: "capture-endpoint-placeholder",
        roleId: salesRole.id,
        departmentId: salesDept.id,
      },
    });
    assignedToId = user.id;
  }

  let propertyTypeId: string | undefined;
  if (payload.propertyType) {
    const match = await prisma.propertyType.findFirst({
      where: { name: { contains: payload.propertyType, mode: "insensitive" } },
    });
    propertyTypeId = match?.id;
  }

  const customer = await prisma.customer.upsert({
    where: { phone: payload.phone.trim() },
    update: {
      email: payload.email?.trim() || undefined,
      assignedSalesRepId: assignedToId ?? undefined,
    },
    create: {
      firstName,
      lastName,
      phone: payload.phone.trim(),
      email: payload.email?.trim() || null,
      assignedSalesRepId: assignedToId,
      preferences: {
        create: { marketingOptIn: payload.consentGiven ?? false },
      },
    },
  });

  const noteLines = [
    payload.developmentInterest && `Development interest: ${payload.developmentInterest}`,
    payload.purpose && `Purpose: ${payload.purpose}`,
    payload.purchaseTimeline && `Purchase timeline: ${payload.purchaseTimeline}`,
    payload.preferredContact && `Preferred contact time: ${payload.preferredContact}`,
    payload.notes && `Notes: ${payload.notes}`,
  ].filter(Boolean);

  const budgetBucket = payload.budgetRange ? BUDGET_RANGES[payload.budgetRange] : undefined;

  // Write-both: resolve the LEAD_NURTURE pipeline's NEW stage alongside the legacy `status` enum
  // (same pattern as createLead in src/lib/actions/leads.ts).
  const newStage = await getStageIdByKey("LEAD_NURTURE", "NEW");

  const lead = await prisma.lead.create({
    data: {
      customerId: customer.id,
      sourceId: siteSource.id,
      assignedToId,
      propertyTypeId,
      preferredLocation: payload.preferredLocation?.trim() || null,
      budgetMin: budgetBucket?.[0],
      budgetMax: budgetBucket?.[1],
      notes: noteLines.length ? noteLines.join("\n") : null,
      status: newStage.key as never,
      pipelineStageId: newStage.id,
      createdAt: capturedAt,
    },
  });

  if (assignedToId) {
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: "NOTE",
        description: `Captured via tablet lead-gen form${payload.sourceLocation ? ` at ${payload.sourceLocation}` : ""}.`,
        createdById: assignedToId,
        occurredAt: capturedAt,
      },
    });
  }

  return NextResponse.json({ success: true, leadId: lead.id, customerId: customer.id });
}
