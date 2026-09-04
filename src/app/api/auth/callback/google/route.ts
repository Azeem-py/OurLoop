import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const redirectUri = `${baseUrl}/api/auth/callback/google`;

  const searchParams = req.nextUrl.searchParams;
  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // Handle Google OAuth errors (e.g., access_denied)
  if (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, baseUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", baseUrl));
  }

  // Validate state against stored cookie to prevent CSRF
  const storedState = req.cookies.get("oauth_state")?.value;
  if (!state || !storedState || state !== storedState) {
    console.error("OAuth state mismatch or missing state cookie");
    return NextResponse.redirect(new URL("/login?error=invalid_state", baseUrl));
  }

  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Google OAuth credentials missing on server");
    return NextResponse.redirect(new URL("/login?error=oauth_configuration_error", baseUrl));
  }

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Failed to exchange code for token:", tokenData);
      return NextResponse.redirect(new URL("/login?error=token_exchange_failed", baseUrl));
    }

    // 2. Fetch user profile from Google
    const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userInfo = await userinfoRes.json();
    if (!userinfoRes.ok || !userInfo.email) {
      console.error("Failed to fetch user info from Google:", userInfo);
      return NextResponse.redirect(new URL("/login?error=userinfo_fetch_failed", baseUrl));
    }

    const cleanEmail = userInfo.email.trim().toLowerCase();

    // 3. Find or create user in database
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        memberships: true,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          displayName: userInfo.name || userInfo.given_name || cleanEmail.split("@")[0],
          avatarUrl: userInfo.picture || null,
        },
        include: {
          memberships: true,
        },
      });
    } else if (!user.avatarUrl && userInfo.picture) {
      // Sync avatar if user doesn't already have one
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: userInfo.picture },
        include: {
          memberships: true,
        },
      });
    }

    // 4. Create session token and set session cookie
    const coupleId = user.memberships[0]?.coupleId;
    const token = createToken({
      userId: user.id,
      email: user.email,
      coupleId,
    });

    const destination = coupleId ? "/" : "/pair";
    const response = NextResponse.redirect(new URL(destination, baseUrl));

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Clear the one-time oauth_state cookie
    response.cookies.delete("oauth_state");

    return response;
  } catch (err: unknown) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(new URL("/login?error=authentication_failed", baseUrl));
  }
}
