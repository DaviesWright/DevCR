// On-demand Gmail + Google Calendar sync for one connected account. Pull-based (triggered by
// "Sync now" or an Admin page load) since this app has no public URL for Google to push to and
// no scheduler/cron (same constraint as everywhere else in this codebase). Caps each sync at
// 50 messages/events per call — enough for a rep's recent activity, not a full mailbox
// backfill; re-running "Sync now" catches up incrementally via lastSyncedAt.
import { prisma } from "@/lib/prisma";
import { encryptToken, decryptToken } from "@/lib/crypto";
import type { EmailAccountConnection } from "@prisma/client";

const MAX_RESULTS = 50;

async function ensureFreshAccessToken(connection: EmailAccountConnection): Promise<string> {
  if (connection.tokenExpiresAt.getTime() > Date.now() + 60_000) {
    return decryptToken(connection.accessToken);
  }

  const refreshToken = decryptToken(connection.refreshToken);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google token refresh failed (${res.status})`);
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

function headerValue(headers: { name: string; value: string }[], name: string): string | null {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? null;
}

function extractEmails(headerVal: string | null): string[] {
  if (!headerVal) return [];
  const matches = headerVal.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g);
  return matches ? matches.map((e) => e.toLowerCase()) : [];
}

async function matchCustomerId(emails: string[]): Promise<string | null> {
  if (emails.length === 0) return null;
  const match = await prisma.customer.findFirst({
    where: { email: { in: emails, mode: "insensitive" } },
    select: { id: true },
  });
  return match?.id ?? null;
}

export async function syncGoogleAccount(connectionId: string): Promise<{ emailCount: number; eventCount: number }> {
  const connection = await prisma.emailAccountConnection.findUniqueOrThrow({ where: { id: connectionId } });
  if (connection.provider !== "GOOGLE") throw new Error("Not a Google connection.");

  try {
    const accessToken = await ensureFreshAccessToken(connection);
    const since = connection.lastSyncedAt ?? new Date(Date.now() - 30 * 86400000);
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // --- Emails ---
    const query = `after:${Math.floor(since.getTime() / 1000)}`;
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${MAX_RESULTS}`,
      { headers: authHeader }
    );
    if (!listRes.ok) throw new Error(`Gmail list failed (${listRes.status})`);
    const list = (await listRes.json()) as { messages?: { id: string }[] };

    let emailCount = 0;
    for (const msg of list.messages ?? []) {
      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: authHeader }
      );
      if (!detailRes.ok) continue;
      const detail = (await detailRes.json()) as {
        id: string;
        snippet?: string;
        internalDate?: string;
        payload?: { headers?: { name: string; value: string }[] };
      };
      const headers = detail.payload?.headers ?? [];
      const fromEmails = extractEmails(headerValue(headers, "From"));
      const toEmails = extractEmails(headerValue(headers, "To"));
      const fromEmail = fromEmails[0] ?? "unknown";
      const direction = fromEmail === connection.email.toLowerCase() ? "OUTBOUND" : "INBOUND";
      const matchedCustomerId = await matchCustomerId([...fromEmails, ...toEmails]);

      await prisma.syncedEmail.upsert({
        where: { connectionId_providerMessageId: { connectionId: connection.id, providerMessageId: detail.id } },
        create: {
          connectionId: connection.id,
          providerMessageId: detail.id,
          subject: headerValue(headers, "Subject"),
          snippet: detail.snippet ?? null,
          fromEmail,
          toEmails,
          direction,
          occurredAt: detail.internalDate ? new Date(Number(detail.internalDate)) : new Date(),
          matchedCustomerId,
        },
        update: { matchedCustomerId },
      });
      emailCount++;
    }

    // --- Calendar ---
    const eventsRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${since.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=${MAX_RESULTS}`,
      { headers: authHeader }
    );
    let eventCount = 0;
    if (eventsRes.ok) {
      const events = (await eventsRes.json()) as {
        items?: {
          id: string;
          summary?: string;
          description?: string;
          start?: { dateTime?: string; date?: string };
          end?: { dateTime?: string; date?: string };
          attendees?: { email: string }[];
        }[];
      };
      for (const ev of events.items ?? []) {
        const startAt = ev.start?.dateTime || ev.start?.date;
        if (!startAt) continue;
        const attendeeEmails = (ev.attendees ?? []).map((a) => a.email.toLowerCase());
        const matchedCustomerId = await matchCustomerId(attendeeEmails);

        await prisma.syncedCalendarEvent.upsert({
          where: { connectionId_providerEventId: { connectionId: connection.id, providerEventId: ev.id } },
          create: {
            connectionId: connection.id,
            providerEventId: ev.id,
            title: ev.summary ?? null,
            description: ev.description ?? null,
            startAt: new Date(startAt),
            endAt: ev.end?.dateTime || ev.end?.date ? new Date(ev.end.dateTime || ev.end.date!) : null,
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
