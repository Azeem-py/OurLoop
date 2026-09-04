import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listMemories, createMemory, getOnThisDayItem } from "@/lib/db/memories";
import { MediaType } from "@prisma/client";
import { sendPushToPartner } from "@/lib/push";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.coupleId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [memories, onThisDay] = await Promise.all([
    listMemories(user.coupleId),
    getOnThisDayItem(user.coupleId),
  ]);

  return NextResponse.json({ memories, onThisDay });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.coupleId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { mediaUrl, mediaType, caption, location, takenAt, momentGroupId } = await req.json();

    if (!mediaUrl) {
      return NextResponse.json({ error: "Media URL is required" }, { status: 400 });
    }

    const memory = await createMemory(user.coupleId, user.id, {
      mediaUrl,
      mediaType: mediaType === "VIDEO" ? MediaType.VIDEO : MediaType.IMAGE,
      caption,
      location,
      takenAt: takenAt ? new Date(takenAt) : undefined,
      momentGroupId,
    });

    const senderName = user.nickname || user.displayName || "Your partner";
    const mediaEmoji = mediaType === "VIDEO" ? "🎥" : "📸";
    sendPushToPartner(user.id, user.coupleId, {
      title: `${mediaEmoji} ${senderName} shared a memory`,
      body: caption || "Added a new memory to your shared gallery.",
      url: "/memories",
      image: mediaType === "VIDEO" ? undefined : mediaUrl,
      tag: "ourloop-memory",
    }).catch((err) => console.error("Memory push failed:", err));

    return NextResponse.json({ memory });
  } catch (error: any) {
    console.error("Create memory error:", error);
    return NextResponse.json({ error: error.message || "Failed to create memory" }, { status: 500 });
  }
}
