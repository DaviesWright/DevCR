import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { isGoogleConfigured, googleRedirectUri, GOOGLE_SCOPES } from "@/lib/integrations/config";

// Kicks off the Google OAuth consent flow for the current user's own mailbox/calendar.
// GET so it can be a plain link/redirect from the Admin > Integrations page.
export async function GET() {
  if (!isGoogleConfigured()) {
    return NextResponse.json({ error: "Google integration is not configured (missing GOOGLE_CLIENT_ID/SECRET or TOKEN_ENCRYPTION_KEY)." }, { status: 400 });
  }

  const state = randomBytes(16).toString("hex");
  cookies().set("google_oauth_state", state, { httpOnly: true, maxAge: 600, sameSite: "lax", path: "/" });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
