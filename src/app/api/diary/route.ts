import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listDiaryEntries, createDiaryEntry } from "@/lib/db/diary";
import { Visibility } from "@prisma/client";
import { sendPushToPartner } from "@/lib/push";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.coupleId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await listDiaryEntries(user.coupleId, user.id);
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.coupleId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, content, mood, imageUrl, visibility, revealAt, linkedMemoryId } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const entry = await createDiaryEntry(user.coupleId, user.id, {
      title,
      content,
      mood,
      imageUrl: imageUrl || null,
      visibility: visibility === "PRIVATE_UNTIL" ? Visibility.PRIVATE_UNTIL : Visibility.SHARED,
      revealAt: revealAt ? new Date(revealAt) : null,
      linkedMemoryId,
    });

    const isShared = visibility !== "PRIVATE_UNTIL";
    if (isShared) {
      const senderName = user.nickname || user.displayName || "Your partner";
      sendPushToPartner(user.id, user.coupleId, {
        title: `📖 ${senderName} wrote in your diary`,
        body: title || content.slice(0, 80) || "A new page was added to your story.",
        url: "/diary",
        tag: "ourloop-diary",
      }).catch((err) => console.error("Diary push failed:", err));
    }

    return NextResponse.json({ entry });
  } catch (error: any) {
    console.error("Diary entry error:", error);
    return NextResponse.json({ error: error.message || "Failed to create entry" }, { status: 500 });
  }
}
