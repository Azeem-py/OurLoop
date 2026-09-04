import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listMessages, createMessage, markMessagesAsRead } from "@/lib/db/messages";
import { ContentType } from "@prisma/client";
import { sendPushToPartner } from "@/lib/push";

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

    const senderName = user.nickname || user.displayName || "Your love";
    let bodyPreview = text || "Sent you a message";
    if (validContentType === ContentType.IMAGE) bodyPreview = "📷 Sent a photo";
    if (validContentType === ContentType.VIDEO) bodyPreview = "🎥 Sent a video";
    if (validContentType === ContentType.VOICE_NOTE) bodyPreview = "🎙️ Sent a voice note";

    // Non-blocking push notification to partner
    sendPushToPartner(user.id, user.coupleId, {
      title: senderName,
      body: bodyPreview,
      url: "/chat",
      tag: "ourloop-chat",
    }).catch((err) => console.error("Message push failed:", err));

    return NextResponse.json({ message });
  } catch (error: any) {
    console.error("Create message error:", error);
    return NextResponse.json({ error: error.message || "Failed to send message" }, { status: 500 });
  }
}
