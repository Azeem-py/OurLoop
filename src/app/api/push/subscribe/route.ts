import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { subscription, userAgent } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
    }

    const { endpoint, keys } = subscription;

    // Upsert subscription: if endpoint already exists, re-bind to current user and keys
    const saved = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || req.headers.get("user-agent") || null,
      },
      update: {
        userId: user.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || req.headers.get("user-agent") || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, id: saved.id });
  } catch (error: unknown) {
    console.error("Failed to save push subscription:", error);
    return NextResponse.json({ error: (error as Error)?.message || "Failed to save subscription" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint required" }, { status: 400 });
    }

    await prisma.pushSubscription.deleteMany({
      where: {
        userId: user.id,
        endpoint,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Failed to delete push subscription:", error);
    return NextResponse.json({ error: (error as Error)?.message || "Failed to remove subscription" }, { status: 500 });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await prisma.pushSubscription.count({
    where: { userId: user.id },
  });

  return NextResponse.json({
    subscribed: count > 0,
    deviceCount: count,
  });
}
