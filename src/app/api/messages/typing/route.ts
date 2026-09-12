import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { recordTyping, clearTyping } from "@/lib/typingTracker";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.coupleId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { isTyping } = await req.json().catch(() => ({ isTyping: true }));

    if (isTyping) {
      recordTyping(user.coupleId, user.id);
    } else {
      clearTyping(user.coupleId, user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Typing update error" }, { status: 500 });
  }
}
