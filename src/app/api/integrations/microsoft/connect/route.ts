import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { isMicrosoftConfigured, microsoftRedirectUri, microsoftTenant, MICROSOFT_SCOPES } from "@/lib/integrations/config";

// Kicks off the Microsoft identity platform OAuth consent flow for the current user's own
// Outlook mailbox/calendar (Microsoft Graph).
export async function GET() {
  if (!isMicrosoftConfigured()) {
    return NextResponse.json({ error: "Microsoft integration is not configured (missing MICROSOFT_CLIENT_ID/SECRET or TOKEN_ENCRYPTION_KEY)." }, { status: 400 });
  }

  const state = randomBytes(16).toString("hex");
  cookies().set("microsoft_oauth_state", state, { httpOnly: true, maxAge: 600, sameSite: "lax", path: "/" });

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    redirect_uri: microsoftRedirectUri(),
    response_type: "code",
    response_mode: "query",
    scope: MICROSOFT_SCOPES,
    state,
  });

  return NextResponse.redirect(`https://login.microsoftonline.com/${microsoftTenant()}/oauth2/v2.0/authorize?${params.toString()}`);
}
