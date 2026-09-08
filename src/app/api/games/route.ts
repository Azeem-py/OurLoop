import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listCoupleGames, createGameSession } from "@/lib/db/games";
import { sendPushToUser } from "@/lib/push";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.coupleId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await listCoupleGames(user.coupleId);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to list games" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.coupleId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { gameType, stakes, whoStarts, targetWord, hint } = body;

    const validGameTypes = ["TIC_TAC_TOE", "CONNECT_FOUR", "WORDLE", "WHOS_MOST_LIKELY"];
    if (!gameType || !validGameTypes.includes(gameType)) {
      return NextResponse.json({ error: "Valid gameType is required" }, { status: 400 });
    }

    // Find partner in couple
    const coupleMembers = await prisma.coupleMember.findMany({
      where: { coupleId: user.coupleId },
    });
    const partnerMember = coupleMembers.find((m) => m.userId !== user.id);
    const partnerId = partnerMember ? partnerMember.userId : user.id;

    const game = await createGameSession({
      coupleId: user.coupleId,
      initiatorId: user.id,
      partnerId,
      gameType,
      stakes,
      whoStarts: whoStarts === "partner" ? "partner" : "me",
      targetWord,
      hint,
    });

    // Notify partner of game challenge if partner exists and isn't self
    if (partnerId !== user.id) {
      const senderName = user.nickname || user.displayName;
      let gameLabel = "Mini-Game";
      if (gameType === "TIC_TAC_TOE") gameLabel = "Hearts & Kisses";
      if (gameType === "CONNECT_FOUR") gameLabel = "Four in a Row";
      if (gameType === "WORDLE") gameLabel = "Couple Wordle";
      if (gameType === "WHOS_MOST_LIKELY") gameLabel = "Who's Most Likely";

      const bodyText = stakes
        ? `${senderName} challenged you to ${gameLabel}! Stakes: ${stakes}`
        : `${senderName} challenged you to a game of ${gameLabel}!`;

      sendPushToUser(partnerId, {
        title: "New Game Challenge! 🎮",
        body: bodyText,
        url: `/games/${game.id}`,
      }).catch((e) => console.error("Push notify error:", e));
    }

    return NextResponse.json({ game }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create game" }, { status: 500 });
  }
}
