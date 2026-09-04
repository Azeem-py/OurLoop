import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { toggleHeartMemory } from "@/lib/db/memories";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !user.coupleId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const memory = await toggleHeartMemory(user.coupleId, id);
    return NextResponse.json({ heartsCount: memory.heartsCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to heart memory" }, { status: 400 });
  }
}
