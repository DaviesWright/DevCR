// One-off seed: starter Workflow rules wiring the real Automations Module trigger points
// (src/lib/actions/sales.ts, commissions.ts, cx.ts, payments/schedule.ts, payments.ts, leads.ts)
// to the email templates seeded in prisma/seed-automation-templates.ts. These are ordinary DB
// rows — created here just to give the module a live starting state — fully editable, disable-
// able, or deletable afterward via Automations > Workflow Rules with zero code changes.
import { prisma } from "../src/lib/prisma";

type StepSpec = { templateName: string; recipient: "CUSTOMER" | "CONSULTANT" };
type WorkflowSpec = { name: string; description: string; triggerEvent: string; steps: StepSpec[] };

const WORKFLOWS: WorkflowSpec[] = [
  {
    name: "Reservation Form Received",
    description: "Notifies the consultant that a client's reservation form was received.",
    triggerEvent: "RESERVATION_CREATED",
    steps: [{ templateName: "Receipt of New Reservation Form", recipient: "CONSULTANT" }],
  },
  {
    name: "SPA Signed by Devtraco",
    description: "Notifies the consultant and shares the executed SPA with the client.",
    triggerEvent: "MILESTONE_SPA_SIGNED_DEVTRACO",
    steps: [
      { templateName: "SPA Signed and Executed", recipient: "CONSULTANT" },
      { templateName: "SPA Signed and Shared with Client", recipient: "CUSTOMER" },
    ],
  },
  {
    name: "Handover Scheduled - Invite Client",
    description: "Invites the client to book their inspection/handover slot.",
    triggerEvent: "HANDOVER_SCHEDULED",
    steps: [{ templateName: "Invitation to Inspection/Handover", recipient: "CUSTOMER" }],
  },
  {
    name: "Handover Completed - Welcome",
    description: "Congratulates the client and introduces property management post-handover.",
    triggerEvent: "HANDOVER_COMPLETED",
    steps: [{ templateName: "Acknowledgment of Successful Handover", recipient: "CUSTOMER" }],
  },
  {
    name: "Complaint Received - Acknowledge",
    description: "Acknowledges a new complaint immediately.",
    triggerEvent: "COMPLAINT_CREATED",
    steps: [{ templateName: "Acknowledgment of Complaint", recipient: "CUSTOMER" }],
  },
  {
    name: "Complaint Resolved - Confirm",
    description: "Confirms the resolution once a complaint is marked resolved.",
    triggerEvent: "COMPLAINT_RESOLVED",
    steps: [{ templateName: "Complaint Resolution Confirmation", recipient: "CUSTOMER" }],
  },
  {
    name: "Payment Received - Confirm",
    description: "Confirms receipt of a payment with the receipt number and balance.",
    triggerEvent: "PAYMENT_RECORDED",
    steps: [{ templateName: "Payment Received Confirmation", recipient: "CUSTOMER" }],
  },
  {
    name: "Payment Overdue - Remind",
    description: "Reminds the client the moment a schedule is flagged overdue.",
    triggerEvent: "PAYMENT_OVERDUE",
    steps: [{ templateName: "Payment Overdue Reminder", recipient: "CUSTOMER" }],
  },
  {
    name: "New Lead Assigned - Notify Consultant",
    description: "Notifies the consultant the moment a lead is assigned to them.",
    triggerEvent: "LEAD_ASSIGNED",
    steps: [{ templateName: "New Lead Assigned to Consultant", recipient: "CONSULTANT" }],
  },
];

async function main() {
  let created = 0;
  for (const w of WORKFLOWS) {
    const existing = await prisma.workflow.findFirst({ where: { name: w.name } });
    if (existing) continue;

    const stepConfigs = await Promise.all(
      w.steps.map(async (s) => {
        const template = await prisma.messageTemplate.findFirstOrThrow({ where: { name: s.templateName } });
        return { templateId: template.id, recipient: s.recipient };
      })
    );

    await prisma.workflow.create({
      data: {
        name: w.name,
        description: w.description,
        triggerEvent: w.triggerEvent as never,
        isActive: true,
        steps: {
          create: stepConfigs.map((config, i) => ({ stepOrder: i + 1, actionType: "SEND_EMAIL", actionConfig: config })),
        },
      },
    });
    created++;
  }
  console.log(`Created ${created} starter workflow(s) (${WORKFLOWS.length - created} already existed).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
