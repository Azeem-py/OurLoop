import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listMessages, createMessage, markMessagesAsRead } from "@/lib/db/messages";
import { ContentType } from "@prisma/client";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.coupleId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await listMessages(user.coupleId);
  // Mark partner messages as read
  await markMessagesAsRead(user.coupleId, user.id);

  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.coupleId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { contentType, text, contentUrl, replyToId, durationSec } = await req.json();

    let validContentType: ContentType = ContentType.TEXT;
    if (contentType === "IMAGE") validContentType = ContentType.IMAGE;
    if (contentType === "VIDEO") validContentType = ContentType.VIDEO;
    if (contentType === "VOICE_NOTE") validContentType = ContentType.VOICE_NOTE;

    const message = await createMessage(user.coupleId, user.id, {
      contentType: validContentType,
      text,
      contentUrl,
      replyToId,
      durationSec,
    });

    return NextResponse.json({ message });
  } catch (error: any) {
    console.error("Create message error:", error);
    return NextResponse.json({ error: error.message || "Failed to send message" }, { status: 500 });
  }
}
