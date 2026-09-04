import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const AUTH_COOKIE_NAME = "us_auth_token";
const SECRET = process.env.AUTH_SECRET || "fallback-secret-for-dev-only-change-in-prod";

export interface SessionPayload {
  userId: string;
  email: string;
  coupleId?: string;
  iat: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(payload: Omit<SessionPayload, "iat">): string {
  const data = JSON.stringify({ ...payload, iat: Date.now() });
  const hmac = crypto.createHmac("sha256", SECRET).update(data).digest("hex");
  return Buffer.from(data).toString("base64url") + "." + hmac;
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const [encodedData, signature] = token.split(".");
    if (!encodedData || !signature) return null;

    const data = Buffer.from(encodedData, "base64url").toString("utf8");
    const expectedSig = crypto.createHmac("sha256", SECRET).update(data).digest("hex");

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return JSON.parse(data) as SessionPayload;
    }
  } catch {
    return null;
  }
  return null;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = verifyToken(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      memberships: {
        include: {
          couple: {
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      displayName: true,
                      nickname: true,
                      avatarUrl: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  const activeMembership = user.memberships[0] || null;
  const couple = activeMembership?.couple || null;
  const partner = couple?.members.find((m) => m.userId !== user.id)?.user || null;

  return {
    ...user,
    coupleId: couple?.id || null,
    couple,
    partner,
  };
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}
