// Real outbound SMTP email — the Automations Module's SEND_EMAIL workflow step
// (src/lib/workflow-engine.ts) calls this. Uses nodemailer (Node has no built-in SMTP client)
// against whatever mailbox is configured in .env; inert (throws a clear error, caught by the
// caller) until isSmtpConfigured() is true — same "real but inert" pattern as Google/Microsoft/
// Business Central.
import nodemailer from "nodemailer";
import { isSmtpConfigured, smtpConfig } from "@/lib/integrations/config";

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const { host, port, user, password } = smtpConfig();
  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
  });
  return cachedTransporter;
}

export async function sendEmail(input: { to: string; subject: string; text: string; cc?: string[] }): Promise<{ messageId: string }> {
  if (!isSmtpConfigured()) throw new Error("SMTP is not configured (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD/SMTP_FROM_EMAIL).");
  const { fromEmail, fromName } = smtpConfig();
  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: input.to,
    cc: input.cc?.join(", "),
    subject: input.subject,
    text: input.text,
  });
  return { messageId: info.messageId };
}
