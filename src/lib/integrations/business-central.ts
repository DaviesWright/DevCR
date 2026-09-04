// Real Dynamics 365 Business Central integration (client-credentials OAuth2 + BC's REST API),
// following the same pattern as gmail-sync.ts/microsoft-sync.ts: plain fetch(), no SDK, inert
// until BC_TENANT_ID/BC_CLIENT_ID/BC_CLIENT_SECRET/BC_ENVIRONMENT/BC_COMPANY_ID are set
// (isBCConfigured). Every call here is wrapped by its caller in src/lib/actions/payments.ts so a
// BC outage never blocks recording a payment in the CRM — it just leaves the mirror row PENDING
// for later retry.
import { bcConfig } from "@/lib/integrations/config";

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getBCAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.accessToken;

  const { tenantId, clientId, clientSecret } = bcConfig();
  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://api.businesscentral.dynamics.com/.default",
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) throw new Error(`BC token request failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

function bcApiBase(): string {
  const { tenantId, environment, companyId } = bcConfig();
  return `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/api/v2.0/companies(${companyId})`;
}

// customerPayments is BC's standard API entity for recording a payment against a customer's
// ledger — closer to how a real BC user would post this than hand-building general journal
// lines, and avoids needing to know the target company's journal-batch configuration.
export async function postPaymentToBC(input: {
  bcCustomerNo: string;
  amount: number;
  postingDate: Date;
  description: string;
  externalDocumentNumber: string;
}): Promise<{ bcJournalId: string }> {
  const token = await getBCAccessToken();
  const res = await fetch(`${bcApiBase()}/customerPayments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      customerNumber: input.bcCustomerNo,
      postingDate: input.postingDate.toISOString().slice(0, 10),
      amount: input.amount,
      description: input.description.slice(0, 100),
      externalDocumentNumber: input.externalDocumentNumber,
    }),
  });
  if (!res.ok) throw new Error(`BC customerPayments POST failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { id: string };
  return { bcJournalId: data.id };
}

export async function syncCustomerToBC(input: {
  displayName: string;
  email: string | null;
  phone: string | null;
}): Promise<{ bcCustomerNo: string }> {
  const token = await getBCAccessToken();
  const res = await fetch(`${bcApiBase()}/customers`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      displayName: input.displayName.slice(0, 100),
      email: input.email ?? undefined,
      phoneNumber: input.phone ?? undefined,
    }),
  });
  if (!res.ok) throw new Error(`BC customers POST failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { number: string };
  return { bcCustomerNo: data.number };
}
