import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/crypto";
import { getCurrentUser } from "@/lib/queries/reference";
import { googleRedirectUri } from "@/lib/integrations/config";

// Exchanges the Google OAuth authorization code for tokens and stores the connection encrypted.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = cookies().get("google_oauth_state")?.value;
  cookies().delete("google_oauth_state");

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/admin?integration_error=google_state", request.url));
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/admin?integration_error=google_token", request.url));
  }
  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
  };

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = (await profileRes.json()) as { email?: string };
  if (!profile.email) {
    return NextResponse.redirect(new URL("/admin?integration_error=google_profile", request.url));
  }

  const currentUser = await getCurrentUser();

  // A re-connect after revoking access won't return a refresh_token (Google only issues one
  // the first time consent is granted) — keep the existing one rather than nulling it out.
  const existing = await prisma.emailAccountConnection.findUnique({
    where: { userId_provider: { userId: currentUser.id, provider: "GOOGLE" } },
  });

  await prisma.emailAccountConnection.upsert({
    where: { userId_provider: { userId: currentUser.id, provider: "GOOGLE" } },
    create: {
      userId: currentUser.id,
      provider: "GOOGLE",
      email: profile.email,
      accessToken: encryptToken(tokens.access_token),
      refreshToken: encryptToken(tokens.refresh_token || ""),
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope,
      status: "CONNECTED",
    },
    update: {
      email: profile.email,
      accessToken: encryptToken(tokens.access_token),
      refreshToken: tokens.refresh_token ? encryptToken(tokens.refresh_token) : existing?.refreshToken,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope,
      status: "CONNECTED",
      lastSyncError: null,
    },
  });

  return NextResponse.redirect(new URL("/admin?connected=google", request.url));
}
