import { prisma } from "@/lib/prisma";
import { GameType, GameStatus } from "@prisma/client";
import { createInitialTicTacToeState, makeTicTacToeMove } from "../games/ticTacToe";
import { createInitialConnectFourState, makeConnectFourMove } from "../games/connectFour";
import { TicTacToeState, ConnectFourState } from "../games/types";

export interface CreateGameParams {
  coupleId: string;
  initiatorId: string;
  partnerId: string;
  gameType: GameType;
  stakes?: string;
  whoStarts?: "me" | "partner";
}

export async function createGameSession({
  coupleId,
  initiatorId,
  partnerId,
  gameType,
  stakes,
  whoStarts = "me",
}: CreateGameParams) {
  let initialGameState: any;
  if (gameType === "TIC_TAC_TOE") {
    initialGameState = createInitialTicTacToeState();
  } else if (gameType === "CONNECT_FOUR") {
    initialGameState = createInitialConnectFourState();
  } else {
    throw new Error(`Unsupported game type: ${gameType}`);
  }

  const currentTurnUserId = whoStarts === "me" ? initiatorId : partnerId;

  return await prisma.gameSession.create({
    data: {
      coupleId,
      gameType,
      initiatorId,
      currentTurnUserId,
      stakes: stakes?.trim() || null,
      gameState: initialGameState,
      status: "IN_PROGRESS",
    },
    include: {
      initiator: {
        select: { id: true, displayName: true, nickname: true, avatarUrl: true },
      },
      currentTurnUser: {
        select: { id: true, displayName: true, nickname: true, avatarUrl: true },
      },
      winner: {
        select: { id: true, displayName: true, nickname: true, avatarUrl: true },
      },
    },
  });
}

export async function getGameSession(gameId: string, coupleId: string) {
  return await prisma.gameSession.findFirst({
    where: {
      id: gameId,
      coupleId,
    },
    include: {
      initiator: {
        select: { id: true, displayName: true, nickname: true, avatarUrl: true },
      },
      currentTurnUser: {
        select: { id: true, displayName: true, nickname: true, avatarUrl: true },
      },
      winner: {
        select: { id: true, displayName: true, nickname: true, avatarUrl: true },
      },
      couple: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, displayName: true, nickname: true, avatarUrl: true },
              },
            },
          },
        },
      },
    },
  });
}

export async function listCoupleGames(coupleId: string) {
  const [activeGames, completedGames, allFinished] = await Promise.all([
    prisma.gameSession.findMany({
      where: { coupleId, status: "IN_PROGRESS" },
      orderBy: { updatedAt: "desc" },
      include: {
        initiator: { select: { id: true, displayName: true, nickname: true, avatarUrl: true } },
        currentTurnUser: { select: { id: true, displayName: true, nickname: true, avatarUrl: true } },
        winner: { select: { id: true, displayName: true, nickname: true, avatarUrl: true } },
      },
    }),
    prisma.gameSession.findMany({
      where: { coupleId, status: { in: ["COMPLETED", "ABANDONED"] } },
      orderBy: { updatedAt: "desc" },
      take: 15,
      include: {
        initiator: { select: { id: true, displayName: true, nickname: true, avatarUrl: true } },
        currentTurnUser: { select: { id: true, displayName: true, nickname: true, avatarUrl: true } },
        winner: { select: { id: true, displayName: true, nickname: true, avatarUrl: true } },
      },
    }),
    prisma.gameSession.findMany({
      where: { coupleId, status: "COMPLETED" },
      select: { winnerId: true, isDraw: true },
    }),
  ]);

  const winCounts: Record<string, number> = {};
  let drawCount = 0;

  for (const g of allFinished) {
    if (g.isDraw) {
      drawCount++;
    } else if (g.winnerId) {
      winCounts[g.winnerId] = (winCounts[g.winnerId] || 0) + 1;
    }
  }

  return {
    activeGames,
    completedGames,
    stats: {
      totalPlayed: allFinished.length,
      winCounts,
      drawCount,
    },
  };
}

export async function processGameMove(
  gameId: string,
  coupleId: string,
  userId: string,
  moveData: { index?: number; col?: number }
) {
  const game = await getGameSession(gameId, coupleId);
  if (!game) {
    throw new Error("Game not found");
  }

  if (game.status !== "IN_PROGRESS") {
    throw new Error("Game is no longer in progress");
  }

  if (game.currentTurnUserId !== userId) {
    throw new Error("It is not your turn");
  }

  // Find partner ID in couple
  const partnerMember = game.couple.members.find((m) => m.userId !== userId);
  const partnerId = partnerMember ? partnerMember.userId : userId;

  let moveResult: any;

  if (game.gameType === "TIC_TAC_TOE") {
    if (typeof moveData.index !== "number") {
      throw new Error("Missing cell index for Tic-Tac-Toe");
    }
    const state = game.gameState as unknown as TicTacToeState;
    moveResult = makeTicTacToeMove(state, moveData.index, userId);
  } else if (game.gameType === "CONNECT_FOUR") {
    if (typeof moveData.col !== "number") {
      throw new Error("Missing column for Connect Four");
    }
    const state = game.gameState as unknown as ConnectFourState;
    moveResult = makeConnectFourMove(state, moveData.col, userId);
  } else {
    throw new Error(`Unsupported game: ${game.gameType}`);
  }

  if (!moveResult.isValid) {
    throw new Error(moveResult.error || "Invalid move");
  }

  const nextTurnUserId = moveResult.isWon || moveResult.isDraw ? userId : partnerId;
  const newStatus: GameStatus = moveResult.isWon || moveResult.isDraw ? "COMPLETED" : "IN_PROGRESS";

  const updated = await prisma.gameSession.update({
    where: { id: gameId },
    data: {
      gameState: moveResult.newState,
      status: newStatus,
      winnerId: moveResult.winnerId || null,
      isDraw: moveResult.isDraw,
      currentTurnUserId: nextTurnUserId,
      lastMoveAt: new Date(),
    },
    include: {
      initiator: { select: { id: true, displayName: true, nickname: true, avatarUrl: true } },
      currentTurnUser: { select: { id: true, displayName: true, nickname: true, avatarUrl: true } },
      winner: { select: { id: true, displayName: true, nickname: true, avatarUrl: true } },
    },
  });

  return {
    game: updated,
    moveResult,
    partnerId,
  };
}

export async function surrenderGame(gameId: string, coupleId: string, userId: string) {
  const game = await getGameSession(gameId, coupleId);
  if (!game) throw new Error("Game not found");
  if (game.status !== "IN_PROGRESS") throw new Error("Game is not in progress");

  const partnerMember = game.couple.members.find((m) => m.userId !== userId);
  const partnerId = partnerMember ? partnerMember.userId : null;

  return await prisma.gameSession.update({
    where: { id: gameId },
    data: {
      status: "ABANDONED",
      winnerId: partnerId,
    },
  });
}
