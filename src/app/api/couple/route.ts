import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createCoupleSpace, joinCoupleSpace, updateCoupleSettings } from "@/lib/db/couple";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.coupleId) {
    return NextResponse.json({ couple: null });
  }

  const couple = await prisma.couple.findUnique({
    where: { id: user.coupleId },
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
  });

  return NextResponse.json({ couple });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, inviteCode, anniversaryDate, nextVisitDate } = await req.json();

    if (action === "create") {
      const couple = await createCoupleSpace(
        user.id,
        anniversaryDate ? new Date(anniversaryDate) : null,
        nextVisitDate ? new Date(nextVisitDate) : null
      );
      return NextResponse.json({ couple });
    }

    if (action === "join") {
      if (!inviteCode) {
        return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
      }
      const couple = await joinCoupleSpace(user.id, inviteCode);
      return NextResponse.json({ couple });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Couple action error:", error);
    return NextResponse.json({ error: error.message || "Failed to process couple action" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.coupleId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updated = await updateCoupleSettings(user.coupleId, {
      anniversaryDate: body.anniversaryDate !== undefined ? (body.anniversaryDate ? new Date(body.anniversaryDate) : null) : undefined,
      nextVisitDate: body.nextVisitDate !== undefined ? (body.nextVisitDate ? new Date(body.nextVisitDate) : null) : undefined,
      themeSettings: body.themeSettings,
    });
    return NextResponse.json({ couple: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 400 });
  }
}
