// Whether each OAuth provider has real credentials configured — gates the "Connect" buttons in
// the Admin > Integrations UI and the /api/integrations/* routes. Matches this app's existing
// pattern of building real logic but clearly labeling a feature as unconfigured when the
// external credentials it needs (an ESP, an SMS/WhatsApp provider) aren't present.
export function isGoogleConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.TOKEN_ENCRYPTION_KEY);
}

export function isMicrosoftConfigured(): boolean {
  return !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET && process.env.TOKEN_ENCRYPTION_KEY);
}

export function googleRedirectUri(): string {
  return process.env.GOOGLE_REDIRECT_URI || "http://localhost:3010/api/integrations/google/callback";
}

export function microsoftRedirectUri(): string {
  return process.env.MICROSOFT_REDIRECT_URI || "http://localhost:3010/api/integrations/microsoft/callback";
}

export function microsoftTenant(): string {
  return process.env.MICROSOFT_TENANT_ID || "common";
}

// Gmail readonly (list/read messages) + Calendar readonly (list events) + basic profile/email
// to identify which mailbox was connected.
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
].join(" ");

// Microsoft Graph equivalents.
export const MICROSOFT_SCOPES = ["Mail.Read", "Calendars.Read", "User.Read", "offline_access"].join(" ");

// Dynamics 365 Business Central (Finance module reconciliation) — same "real but inert until
// configured" pattern as Google/Microsoft above. BC_TENANT_ID is the Azure AD tenant the BC
// environment lives in; BC_CLIENT_ID/SECRET is an Azure AD app registration granted the
// Business Central API's Financials.ReadWrite.All application permission (client-credentials
// flow — no user sign-in, matches a server-to-server finance integration).
export function isBCConfigured(): boolean {
  return !!(
    process.env.BC_TENANT_ID &&
    process.env.BC_CLIENT_ID &&
    process.env.BC_CLIENT_SECRET &&
    process.env.BC_ENVIRONMENT &&
    process.env.BC_COMPANY_ID
  );
}

export function bcConfig() {
  return {
    tenantId: process.env.BC_TENANT_ID ?? "",
    clientId: process.env.BC_CLIENT_ID ?? "",
    clientSecret: process.env.BC_CLIENT_SECRET ?? "",
    environment: process.env.BC_ENVIRONMENT ?? "production",
    companyId: process.env.BC_COMPANY_ID ?? "",
  };
}

// Automations Module — outbound email (SEND_EMAIL workflow steps). Same "real but inert until
// configured" pattern: a workflow still runs and its send attempt is still logged as a
// MarketingMessage without these set, it just can't reach a real mailbox yet.
export function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.SMTP_FROM_EMAIL);
}

export function smtpConfig() {
  return {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? "",
    password: process.env.SMTP_PASSWORD ?? "",
    fromEmail: process.env.SMTP_FROM_EMAIL ?? "",
    fromName: process.env.SMTP_FROM_NAME || "Devtraco Plus",
  };
}
