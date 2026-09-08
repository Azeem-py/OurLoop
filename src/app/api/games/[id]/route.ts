import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getGameSession, surrenderGame } from "@/lib/db/games";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Props) {
  const user = await getCurrentUser();
  if (!user || !user.coupleId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const game = await getGameSession(id, user.coupleId);
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json({ game });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load game" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Props) {
  const user = await getCurrentUser();
  if (!user || !user.coupleId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const updated = await surrenderGame(id, user.coupleId, user.id);
    return NextResponse.json({ game: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to surrender game" }, { status: 500 });
  }
}
