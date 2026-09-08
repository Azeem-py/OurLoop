import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { processGameMove } from "@/lib/db/games";
import { sendPushToUser } from "@/lib/push";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: Props) {
  const user = await getCurrentUser();
  if (!user || !user.coupleId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { game, moveResult, partnerId } = await processGameMove(
      id,
      user.coupleId,
      user.id,
      body
    );

    // Send push notification to partner
    if (partnerId && partnerId !== user.id) {
      const senderName = user.nickname || user.displayName;
      const gameLabel = game.gameType === "TIC_TAC_TOE" ? "Hearts & Kisses" : "Four in a Row";

      if (moveResult.isWon) {
        sendPushToUser(partnerId, {
          title: `Game Over! 🏆`,
          body: `${senderName} won the match in ${gameLabel}!`,
          url: `/games/${id}`,
        }).catch((e) => console.error("Push notify error:", e));
      } else if (moveResult.isDraw) {
        sendPushToUser(partnerId, {
          title: `It's a Draw! 🤝`,
          body: `The match in ${gameLabel} ended in a tie!`,
          url: `/games/${id}`,
        }).catch((e) => console.error("Push notify error:", e));
      } else {
        sendPushToUser(partnerId, {
          title: `Your Turn! 🎮`,
          body: `${senderName} played a move in ${gameLabel}.`,
          url: `/games/${id}`,
        }).catch((e) => console.error("Push notify error:", e));
      }
    }

    return NextResponse.json({ game, moveResult });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process move" },
      { status: 400 }
    );
  }
}
