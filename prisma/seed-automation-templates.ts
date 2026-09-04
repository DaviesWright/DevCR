// One-off seed: the 28 email templates from the Devtraco Email Template Specifications (Aug
// 2026) — real subject lines and body copy, upserted by name so re-running just updates wording.
// Bracket placeholders ([Client Name]) are converted to {{PascalCase}} tokens matching the
// Automations Module's merge engine (src/lib/workflow-engine.ts's mergeTemplate) and the exact
// context keys the real trigger call sites already pass (ClientName, PropertyName, UnitNumber,
// ConsultantName, Amount, ReceiptNumber, Balance, DaysOverdue, LeadName, LeadEmail, LeadPhone,
// LeadSource, PropertyInterest, ResolutionDetails). Configurable afterward via the Automations >
// Email Templates tab — this seed is a starting point, not a hardcoded rule.
import { prisma } from "../src/lib/prisma";

type Template = { name: string; subject: string; body: string; variables: string[] };

const TEMPLATES: Template[] = [
  {
    name: "Receipt of New Reservation Form",
    subject: "Congratulations on Your Sale - {{ClientName}} - {{UnitNumber}}",
    body: `Dear {{ConsultantName}},

Congratulations on your sale!

We acknowledge the receipt of {{ClientName}}'s Reservation Form.
We will review and share the SPA with you shortly.

Have a fantastic week.

[Signature]`,
    variables: ["ConsultantName", "ClientName", "UnitNumber", "DevelopmentName"],
  },
  {
    name: "SPA Prepared and Shared",
    subject: "SPA Ready - {{ClientName}} - {{UnitNumber}}",
    body: `Dear {{ConsultantName}},

I hope this email finds you well.

Please find attached the SPA for your client, {{ClientName}}.

Please review and share with the client for execution.

Thank you.

[Signature]`,
    variables: ["ConsultantName", "ClientName", "UnitNumber"],
  },
  {
    name: "SPA Signed and Executed",
    subject: "Executed SPA - {{ClientName}} - {{UnitNumber}}",
    body: `Dear {{ConsultantName}},

I hope this email finds you well.

Please find attached the signed SPA for your client, {{ClientName}}.
The hard copy is also available for collection.

Thank you.

[Signature]`,
    variables: ["ConsultantName", "ClientName", "UnitNumber"],
  },
  {
    name: "SPA Signed and Shared with Client",
    subject: "Executed SPA - {{PropertyName}} - {{UnitNumber}}",
    body: `Dear {{ClientName}},

I hope this email finds you well.

Please find attached the executed SPA for your property at {{PropertyName}}.

Kindly note that the overall documentation process takes approximately three months. The executed SPA marks the first stage, followed by Consent acquisition and plotting.

We will contact you shortly with the next steps.

Thank you for your cooperation.

[Signature]`,
    variables: ["ClientName", "PropertyName", "UnitNumber"],
  },
  {
    name: "Client Details Form Request",
    subject: "Action Required: Client Details Form - {{PropertyName}}",
    body: `Dear {{ClientName}},

I hope this email finds you well.

We are pleased to inform you that your property at {{PropertyName}} is ready for the documentation process. To begin, we require you to complete and sign the attached Client Details Form.

This form enables us to prepare your Sublease and Management Agreement documents.

Please complete and return the signed form within 7 days.

Thank you for your cooperation.

[Signature]`,
    variables: ["ClientName", "PropertyName", "UnitNumber"],
  },
  {
    name: "Sublease Documents Prepared and Shared",
    subject: "Sublease Documents for Review - {{PropertyName}}",
    body: `Dear {{ClientName}},

I trust this message finds you well.

I am pleased to attach the Sublease document for your {{PropertyName}} for your review and execution.

As per the requirements of the Lands Commission, sublease documents must be ink-signed. We are unable to accept scanned copies and kindly request original ink-signed copies.

To proceed, please find the following options:

1. If you are presently in Ghana, please provide your location, and we will arrange for all documents to be dispatched to your address.

2. If you are currently not in the country, please sign 6 copies of the signature page of the sublease. Subsequently, DHL only the signed pages to our office at No. 7 Noi Fetreke Street, Airport Residential Area.

3. If you wish to designate a proxy for signing, kindly provide us with an Executed Power of Attorney document.

Where to sign:
Sublease: On page 17, the Sublessee(s) should sign on the line(s) provided after the brackets.

Bylaws: The Sublessee should fill in the details on page 15 of the Sublease.

Please note: Provide 6 copies of signed Sublease documents.

If you have any questions, please do not hesitate to reach out.

[Signature]`,
    variables: ["ClientName", "PropertyName", "UnitNumber"],
  },
  {
    name: "Acknowledgment of Received Signed Sublease",
    subject: "Signed Sublease Documents Received - {{PropertyName}}",
    body: `Dear {{ClientName}},

I hope this email finds you well.

I am pleased to confirm receipt of your signed documents.

We are currently processing them for execution and will update you once completed.

Thank you, and have a wonderful day.

[Signature]`,
    variables: ["ClientName", "PropertyName"],
  },
  {
    name: "Sublease Follow-up Reminder (Unsigned)",
    subject: "Reminder: Sublease Signing - {{PropertyName}}",
    body: `Dear {{ClientName}},

I hope this email finds you well.

I am writing to remind you of our email below requesting you to review and sign your attached Sublease for {{PropertyName}}.

We are currently in the final stages of documentation and would greatly appreciate receiving your signed documents within 3 days.

Thank you very much for your cooperation.

[Signature]`,
    variables: ["ClientName", "PropertyName"],
  },
  {
    name: "Client Details Form Follow-up",
    subject: "Reminder: Client Details Form - {{PropertyName}}",
    body: `Dear {{ClientName}},

I hope this email finds you well.

I am writing to remind you of our email below requesting you to complete and sign the attached form to enable us to start processing your property documentation.

We are currently in the final stages of wrapping up this project and it is important that we conclude the documentation aspect as well.

We would therefore greatly appreciate receiving your signed form within 24 hours.

Thank you for your cooperation.

[Signature]`,
    variables: ["ClientName", "PropertyName"],
  },
  {
    name: "Consent Letter Ready for Collection",
    subject: "Consent Letter Ready - {{PropertyName}}",
    body: `Dear {{ClientName}},

I hope you are doing well.

We have received a letter from the Lands Commission confirming that the Consent Letter for your {{PropertyName}} is ready for collection. Kindly find the letter attached for your reference.

Please note that the amount stated on the letter should be disregarded, as this will be settled by Devtraco Plus once the stamp duty payment and plotting processes have been completed by you.

As previously advised, we have made arrangements with our third-party Service Providers to assist with the processing of the stamp duty at a fee of GHS 1,500, and the plotting at a fee.

To proceed with us, kindly make payment using the details below:
Payment Method: Mobile Money
Network: MTN
Number: 059 166 0411
Reference Name: Queendale Asante

Kindly notify us once payment has been made.

[Signature]`,
    variables: ["ClientName", "PropertyName"],
  },
  {
    name: "Stamp Duty Payment Request",
    subject: "Stamp Duty Invoice - {{PropertyName}}",
    body: `Dear {{ClientName}},

I hope this email finds you well.

Please find attached the invoice from Lands Commission for the stamping of your Sublease document for your {{PropertyName}}.

Additionally, I have included below our Bank Details to receive the amount stated for payments to be made to the Lands Commission.

Bank: GCB
Name of Account: Archgate Developers Limited
Account Number: 1801130007849
Branch: Martey Tsuru

Once payment is completed, the documents would be stamped with the receipt from the Lands Commission delivered for the next process.

Thank you and have a blissful day.

[Signature]`,
    variables: ["ClientName", "PropertyName"],
  },
  {
    name: "Final Executed Documents",
    subject: "Executed Sublease Documents - {{PropertyName}}",
    body: `Dear {{ClientName}},

I hope this email finds you well.

Please find attached the executed Sublease document for your {{PropertyName}}.

Kindly note that the overall documentation process per the attached takes approximately three months.

The executed Sublease document you received marks the first stage, followed by the Consent acquisition which requires the payment of the stamp duty on your property, and the plotting of your property by our third-party Service Provider at a fee.

If you would prefer us to handle this process for you, we would need to submit your Sublease documents to the Lands Commission to obtain the invoice for the stamp duty. The facilitation fee for the stamp duty processing is GHS 1,500.

Kindly notify us if you would like us to proceed.

Thank you for your understanding, and have a wonderful day.

[Signature]`,
    variables: ["ClientName", "PropertyName"],
  },
  {
    name: "Invitation to Inspection/Handover",
    subject: "Your Unit is Ready for Inspection - {{PropertyName}}",
    body: `Dear {{ClientName}},

We are delighted to inform you that your unit at {{PropertyName}} is ready for inspection and handover.

Kindly click this link for your preferred date and time for the inspection: {{BookingLink}}

We will confirm availability promptly.

We kindly request your prompt feedback to facilitate the inspection and handover process. If you are unable to attend, you may appoint a proxy to act on your behalf by providing us with their details in advance. Alternatively, we can arrange a virtual inspection at your convenience.

Thank you for your cooperation.
We look forward to hearing from you.

[Signature]`,
    variables: ["ClientName", "PropertyName", "UnitNumber", "BookingLink"],
  },
  {
    name: "Acknowledgment of Successful Handover",
    subject: "Congratulations on Your New Property - {{PropertyName}}",
    body: `Dear {{ClientName}},

Congratulations on the successful handover of your new property!

We are excited to welcome you to your new home and to ensure you feel supported as you settle in.

To help you navigate your property, we would like to introduce you to Elan Property Solutions, our property management partner. Attached is their Welcome Pack with further details on how they can support you.

We have also copied Elan Client Services and Hussen Salameh, General Manager of ELAN, who will always be ready to assist you with the use and management of your property.

Please do not hesitate to reach out to them if you have any questions.

We wish you a seamless start and a wonderful experience in your new home!

Warm regards,

[Signature]`,
    variables: ["ClientName", "PropertyName", "UnitNumber", "ELANWelcomePack"],
  },
  {
    name: "Handover Follow-up - Welcome Pack",
    subject: "Welcome to Your New Property - {{PropertyName}}",
    body: `Dear {{ClientName}},

Welcome to your new property at {{PropertyName}}!

We are delighted to have you as part of the Devtraco family. Please find attached your Welcome Pack, which includes important information about your property, community guidelines, and contact details for support.

Should you have any questions, please do not hesitate to contact:

- Client Experience Team: {{CXEmail}}
- ELAN Property Management: {{ELANEmail}}

We wish you many happy years in your new home!

Warm regards,

[Signature]`,
    variables: ["ClientName", "PropertyName", "WelcomePack"],
  },
  {
    name: "Snag Resolution Confirmation",
    subject: "Snag Resolution Complete - {{PropertyName}}",
    body: `Dear {{ClientName}},

We are pleased to inform you that all identified snags at your property have been resolved.

We kindly request you to schedule a re-inspection at your earliest convenience to confirm that all works have been completed to your satisfaction.

Please reply to this email or contact our CX team to arrange a convenient time.

Thank you for your patience.

[Signature]`,
    variables: ["ClientName", "PropertyName", "UnitNumber"],
  },
  {
    name: "Acknowledgment of Complaint",
    subject: "Acknowledgment of Your Concern - {{PropertyName}}",
    body: `Dear {{ClientName}},

Thank you for bringing your concerns to our attention. We truly appreciate you taking the time to share this feedback with us.

At Devtraco Plus, we value your custom and your experience is very important to us.

Please be assured that we are reviewing the issues you highlighted with the relevant teams. Our goal is to understand the details thoroughly and work towards a resolution that meets your expectations.

We will provide you with an update as soon as possible.

Thank you once again for your patience and for giving us the opportunity to address your concerns.

Warm regards,

[Signature]`,
    variables: ["ClientName", "PropertyName", "ComplaintID"],
  },
  {
    name: "Complaint Resolution Confirmation",
    subject: "Resolution of Your Concern - {{PropertyName}}",
    body: `Dear {{ClientName}},

We are pleased to inform you that the issue you raised has been resolved.

Details of the resolution:
{{ResolutionDetails}}

We kindly request you to confirm that you are satisfied with the resolution. Please reply to this email or contact our CX team if you have any further questions.

Thank you for your patience throughout this process.

Warm regards,

[Signature]`,
    variables: ["ClientName", "PropertyName", "ResolutionDetails"],
  },
  {
    name: "Payment Received Confirmation",
    subject: "Payment Received - {{PropertyName}}",
    body: `Dear {{ClientName}},

We acknowledge receipt of your payment of {{Amount}} for your property at {{PropertyName}}.

Receipt Number: {{ReceiptNumber}}
Payment Date: {{PaymentDate}}
Balance Outstanding: {{Balance}}

A copy of the official receipt is attached for your records.

Thank you for your prompt payment.

[Signature]`,
    variables: ["ClientName", "PropertyName", "Amount", "ReceiptNumber", "Balance"],
  },
  {
    name: "Payment Overdue Reminder",
    subject: "Reminder: Payment Due - {{PropertyName}}",
    body: `Dear {{ClientName}},

We hope this email finds you well.

This is a reminder that a payment of {{Amount}} for your property at {{PropertyName}} is now overdue by {{DaysOverdue}} days.

Please arrange payment as soon as possible to avoid any disruption to your documentation process.

Payment Details:
Bank: [Bank Name]
Account Name: [Account Name]
Account Number: [Account Number]
Reference: {{ClientName}} - {{UnitNumber}}

If you have already made the payment, please disregard this message.

Please contact us if you have any questions.

[Signature]`,
    variables: ["ClientName", "PropertyName", "Amount", "DaysOverdue", "UnitNumber"],
  },
  {
    name: "Payment Receipt Issued",
    subject: "Official Receipt - {{PropertyName}}",
    body: `Dear {{ClientName}},

Please find attached the official receipt for your payment of {{Amount}} for your property at {{PropertyName}}.

Receipt Number: {{ReceiptNumber}}
Date: {{ReceiptDate}}
Description: {{PaymentDescription}}

Please keep this receipt for your records.

[Signature]`,
    variables: ["ClientName", "PropertyName", "Amount", "ReceiptNumber", "ReceiptDate"],
  },
  {
    name: "Birthday Greeting",
    subject: "Happy Birthday, {{ClientName}}!",
    body: `Dear {{ClientName}},

On behalf of the entire Devtraco Plus team, we wish you a very happy birthday!

We are honored to have you as part of the Devtraco family and hope you have a wonderful day filled with joy and celebration.

Warm regards,

[Signature]`,
    variables: ["ClientName"],
  },
  {
    name: "Referral Program Invitation",
    subject: "Refer and Earn - Devtraco Plus Loyalty Program",
    body: `Dear {{ClientName}},

Thank you for being a valued member of the Devtraco Plus family. We hope you are enjoying your new property at {{PropertyName}}.

Did you know that you can earn {{Reward}} for every successful referral you make?

Our referral program offers:

- [Reward Description 1]
- [Reward Description 2]
- [Reward Description 3]

To refer a friend, simply share this link: {{ReferralLink}}

Thank you for helping us grow the Devtraco community!

[Signature]`,
    variables: ["ClientName", "PropertyName", "Reward", "ReferralLink"],
  },
  {
    name: "Client Satisfaction Survey",
    subject: "We Value Your Feedback - {{PropertyName}}",
    body: `Dear {{ClientName}},

We hope you are settling in well to your new property at {{PropertyName}}.

As part of our commitment to delivering exceptional client experiences, we would be grateful if you could take a few minutes to complete our satisfaction survey.

{{SurveyLink}}

Your feedback helps us improve and serve you better.

Thank you for being a valued member of the Devtraco Plus family.

Warm regards,

[Signature]`,
    variables: ["ClientName", "PropertyName", "SurveyLink"],
  },
  {
    name: "New Lead Assigned to Consultant",
    subject: "New Lead Assigned - {{LeadName}}",
    body: `Dear {{ConsultantName}},

A new lead has been assigned to you:

Lead Name: {{LeadName}}
Contact: {{LeadEmail}} / {{LeadPhone}}
Lead Source: {{LeadSource}}
Property Interest: {{PropertyInterest}}

Please contact the lead within 24 hours.

Lead Details: {{LeadLink}}

[Signature]`,
    variables: ["ConsultantName", "LeadName", "LeadEmail", "LeadPhone", "LeadSource", "PropertyInterest"],
  },
  {
    name: "New Document Uploaded to CRM",
    subject: "Document Uploaded - {{ClientName}} - {{DocumentType}}",
    body: `Team,

The following document has been uploaded to the CRM:

Client: {{ClientName}}
Unit: {{UnitNumber}}
Document Type: {{DocumentType}}
Uploaded By: {{UploadedBy}}
Date Uploaded: {{UploadDate}}

{{DocumentLink}}

[Signature]`,
    variables: ["ClientName", "UnitNumber", "DocumentType", "UploadedBy", "UploadDate"],
  },
  {
    name: "Handover Ready Notification",
    subject: "Unit Ready for Handover - {{UnitNumber}}",
    body: `Team,

The following unit is now ready for handover:

Development: {{DevelopmentName}}
Unit Number: {{UnitNumber}}
Unit Type: {{UnitType}}
Client: {{ClientName}}
Date Ready: {{Date}}

Action Required: Schedule inspection and handover with client.

[Signature]`,
    variables: ["DevelopmentName", "UnitNumber", "UnitType", "ClientName", "Date"],
  },
  {
    name: "Overdue Task Reminder",
    subject: "REMINDER: Task Overdue - {{TaskName}}",
    body: `Dear {{AssignedUser}},

The following task is now overdue:

Task: {{TaskName}}
Client: {{ClientName}}
Due Date: {{DueDate}}
Days Overdue: {{DaysOverdue}}

Please take action immediately.

{{TaskLink}}

[Signature]`,
    variables: ["AssignedUser", "TaskName", "ClientName", "DueDate", "DaysOverdue"],
  },
];

async function main() {
  for (const t of TEMPLATES) {
    const id = `seed-${t.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    await prisma.messageTemplate.upsert({
      where: { id },
      update: { subject: t.subject, bodyText: t.body, variables: t.variables, channel: "EMAIL" },
      create: { id, name: t.name, channel: "EMAIL", subject: t.subject, bodyText: t.body, variables: t.variables },
    });
  }
  console.log(`Seeded ${TEMPLATES.length} email templates.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
