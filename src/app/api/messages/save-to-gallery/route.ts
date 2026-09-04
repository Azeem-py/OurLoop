import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createMemory } from "@/lib/db/memories";
import { MediaType } from "@prisma/client";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.coupleId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { mediaUrl, mediaType, caption } = await req.json();
    if (!mediaUrl) {
      return NextResponse.json({ error: "Media URL is required" }, { status: 400 });
    }

    const memory = await createMemory(user.coupleId, user.id, {
      mediaUrl,
      mediaType: mediaType === "VIDEO" ? MediaType.VIDEO : MediaType.IMAGE,
      caption: caption || "Saved from chat 💛",
    });

    return NextResponse.json({ success: true, memory });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save memory" }, { status: 400 });
  }
}
