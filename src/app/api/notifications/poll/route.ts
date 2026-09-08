import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.coupleId) {
    return NextResponse.json(
      { latestMessage: null, activeTurnGame: null },
      { status: 401 }
    );
  }

  try {
    const [latestUnreadMessage, activeTurnGame] = await Promise.all([
      // Most recent unread message from partner
      prisma.message.findFirst({
        where: {
          coupleId: user.coupleId,
          senderId: { not: user.id },
          readAt: null,
        },
        orderBy: { createdAt: "desc" },
        include: {
          sender: {
            select: {
              id: true,
              displayName: true,
              nickname: true,
            },
          },
        },
      }),

      // Most recent game where it is currently this user's turn
      prisma.gameSession.findFirst({
        where: {
          coupleId: user.coupleId,
          status: "IN_PROGRESS",
          currentTurnUserId: user.id,
        },
        orderBy: { lastMoveAt: "desc" },
        include: {
          initiator: {
            select: {
              id: true,
              displayName: true,
              nickname: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      latestMessage: latestUnreadMessage
        ? {
            id: latestUnreadMessage.id,
            contentType: latestUnreadMessage.contentType,
            text: latestUnreadMessage.text,
            createdAt: latestUnreadMessage.createdAt,
            senderName:
              latestUnreadMessage.sender.nickname ||
              latestUnreadMessage.sender.displayName ||
              "Your partner",
          }
        : null,
      activeTurnGame: activeTurnGame
        ? {
            id: activeTurnGame.id,
            gameType: activeTurnGame.gameType,
            stakes: activeTurnGame.stakes,
            lastMoveAt: activeTurnGame.lastMoveAt,
            initiatorName:
              activeTurnGame.initiator.nickname ||
              activeTurnGame.initiator.displayName ||
              "Your partner",
          }
        : null,
    });
  } catch (error: any) {
    console.error("In-app notifications poll error:", error);
    return NextResponse.json(
      { latestMessage: null, activeTurnGame: null, error: error.message },
      { status: 500 }
    );
  }
}
