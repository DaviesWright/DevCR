// On-demand Outlook mail + calendar sync via Microsoft Graph. Same pull-based, capped design
// as gmail-sync.ts (see that file's header comment for why — no public URL, no cron).
import { prisma } from "@/lib/prisma";
import { encryptToken, decryptToken } from "@/lib/crypto";
import { microsoftTenant } from "@/lib/integrations/config";
import type { EmailAccountConnection } from "@prisma/client";

const MAX_RESULTS = 50;

async function ensureFreshAccessToken(connection: EmailAccountConnection): Promise<string> {
  if (connection.tokenExpiresAt.getTime() > Date.now() + 60_000) {
    return decryptToken(connection.accessToken);
  }

  const refreshToken = decryptToken(connection.refreshToken);
  const res = await fetch(`https://login.microsoftonline.com/${microsoftTenant()}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Microsoft token refresh failed (${res.status})`);
  const tokens = (await res.json()) as { access_token: string; expires_in: number };

  await prisma.emailAccountConnection.update({
    where: { id: connection.id },
    data: {
      accessToken: encryptToken(tokens.access_token),
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });
  return tokens.access_token;
}

async function matchCustomerId(emails: string[]): Promise<string | null> {
  const clean = emails.filter(Boolean).map((e) => e.toLowerCase());
  if (clean.length === 0) return null;
  const match = await prisma.customer.findFirst({
    where: { email: { in: clean, mode: "insensitive" } },
    select: { id: true },
  });
  return match?.id ?? null;
}

export async function syncMicrosoftAccount(connectionId: string): Promise<{ emailCount: number; eventCount: number }> {
  const connection = await prisma.emailAccountConnection.findUniqueOrThrow({ where: { id: connectionId } });
  if (connection.provider !== "MICROSOFT") throw new Error("Not a Microsoft connection.");

  try {
    const accessToken = await ensureFreshAccessToken(connection);
    const since = connection.lastSyncedAt ?? new Date(Date.now() - 30 * 86400000);
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // --- Emails ---
    const filter = `receivedDateTime ge ${since.toISOString()}`;
    const messagesRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages?$filter=${encodeURIComponent(filter)}&$top=${MAX_RESULTS}&$select=id,subject,bodyPreview,from,toRecipients,receivedDateTime`,
      { headers: authHeader }
    );
    let emailCount = 0;
    if (messagesRes.ok) {
      const messages = (await messagesRes.json()) as {
        value?: {
          id: string;
          subject?: string;
          bodyPreview?: string;
          from?: { emailAddress?: { address?: string } };
          toRecipients?: { emailAddress?: { address?: string } }[];
          receivedDateTime?: string;
        }[];
      };
      for (const m of messages.value ?? []) {
        const fromEmail = (m.from?.emailAddress?.address || "unknown").toLowerCase();
        const toEmails = (m.toRecipients ?? []).map((r) => (r.emailAddress?.address || "").toLowerCase()).filter(Boolean);
        const direction = fromEmail === connection.email.toLowerCase() ? "OUTBOUND" : "INBOUND";
        const matchedCustomerId = await matchCustomerId([fromEmail, ...toEmails]);

        await prisma.syncedEmail.upsert({
          where: { connectionId_providerMessageId: { connectionId: connection.id, providerMessageId: m.id } },
          create: {
            connectionId: connection.id,
            providerMessageId: m.id,
            subject: m.subject ?? null,
            snippet: m.bodyPreview ?? null,
            fromEmail,
            toEmails,
            direction,
            occurredAt: m.receivedDateTime ? new Date(m.receivedDateTime) : new Date(),
            matchedCustomerId,
          },
          update: { matchedCustomerId },
        });
        emailCount++;
      }
    }

    // --- Calendar ---
    const eventsRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${since.toISOString()}&endDateTime=${new Date(Date.now() + 365 * 86400000).toISOString()}&$top=${MAX_RESULTS}&$select=id,subject,bodyPreview,start,end,attendees`,
      { headers: authHeader }
    );
    let eventCount = 0;
    if (eventsRes.ok) {
      const events = (await eventsRes.json()) as {
        value?: {
          id: string;
          subject?: string;
          bodyPreview?: string;
          start?: { dateTime?: string };
          end?: { dateTime?: string };
          attendees?: { emailAddress?: { address?: string } }[];
        }[];
      };
      for (const ev of events.value ?? []) {
        if (!ev.start?.dateTime) continue;
        const attendeeEmails = (ev.attendees ?? []).map((a) => (a.emailAddress?.address || "").toLowerCase()).filter(Boolean);
        const matchedCustomerId = await matchCustomerId(attendeeEmails);

        await prisma.syncedCalendarEvent.upsert({
          where: { connectionId_providerEventId: { connectionId: connection.id, providerEventId: ev.id } },
          create: {
            connectionId: connection.id,
            providerEventId: ev.id,
            title: ev.subject ?? null,
            description: ev.bodyPreview ?? null,
            startAt: new Date(ev.start.dateTime),
            endAt: ev.end?.dateTime ? new Date(ev.end.dateTime) : null,
            attendeeEmails,
            matchedCustomerId,
          },
          update: { matchedCustomerId },
        });
        eventCount++;
      }
    }

    await prisma.emailAccountConnection.update({
      where: { id: connection.id },
      data: { lastSyncedAt: new Date(), status: "CONNECTED", lastSyncError: null },
    });

    return { emailCount, eventCount };
  } catch (err) {
    await prisma.emailAccountConnection.update({
      where: { id: connection.id },
      data: { status: "ERROR", lastSyncError: err instanceof Error ? err.message : "Sync failed." },
    });
    throw err;
  }
}
