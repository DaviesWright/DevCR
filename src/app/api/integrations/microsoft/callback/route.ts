import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/crypto";
import { getCurrentUser } from "@/lib/queries/reference";
import { microsoftRedirectUri, microsoftTenant } from "@/lib/integrations/config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = cookies().get("microsoft_oauth_state")?.value;
  cookies().delete("microsoft_oauth_state");

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/admin?integration_error=microsoft_state", request.url));
  }

  const tokenRes = await fetch(`https://login.microsoftonline.com/${microsoftTenant()}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      redirect_uri: microsoftRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/admin?integration_error=microsoft_token", request.url));
  }
  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
  };

  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = (await profileRes.json()) as { mail?: string; userPrincipalName?: string };
  const email = profile.mail || profile.userPrincipalName;
  if (!email) {
    return NextResponse.redirect(new URL("/admin?integration_error=microsoft_profile", request.url));
  }

  const currentUser = await getCurrentUser();

  await prisma.emailAccountConnection.upsert({
    where: { userId_provider: { userId: currentUser.id, provider: "MICROSOFT" } },
    create: {
      userId: currentUser.id,
      provider: "MICROSOFT",
      email,
      accessToken: encryptToken(tokens.access_token),
      refreshToken: encryptToken(tokens.refresh_token || ""),
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope,
      status: "CONNECTED",
    },
    update: {
      email,
      accessToken: encryptToken(tokens.access_token),
      refreshToken: tokens.refresh_token ? encryptToken(tokens.refresh_token) : undefined,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope,
      status: "CONNECTED",
      lastSyncError: null,
    },
  });

  return NextResponse.redirect(new URL("/admin?connected=microsoft", request.url));
}
