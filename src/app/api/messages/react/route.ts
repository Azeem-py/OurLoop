import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { toggleReaction } from "@/lib/db/messages";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.coupleId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { messageId, emoji } = await req.json();
    if (!messageId || !emoji) {
      return NextResponse.json({ error: "Message ID and emoji are required" }, { status: 400 });
    }

    const result = await toggleReaction(messageId, user.id, emoji);
    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to react" }, { status: 400 });
  }
}
