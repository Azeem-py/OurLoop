import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const youName = user.nickname || user.displayName || "You";
    const result = await sendPushToUser(user.id, {
      title: "OurLoop Connected! ✨",
      body: `Hello ${youName}! Notifications are working beautifully on this device.`,
      url: "/",
      tag: "ourloop-test",
    });

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      message: result.sent > 0 ? "Test notification sent!" : "No active subscriptions found for this device.",
    });
  } catch (error: unknown) {
    console.error("Test push error:", error);
    return NextResponse.json({ error: (error as Error)?.message || "Failed to send test push" }, { status: 500 });
  }
}
