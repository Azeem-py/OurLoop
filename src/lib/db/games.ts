import { prisma } from "@/lib/prisma";
import { GameType, GameStatus } from "@prisma/client";
import { createInitialTicTacToeState, makeTicTacToeMove } from "../games/ticTacToe";
import { createInitialConnectFourState, makeConnectFourMove } from "../games/connectFour";
import { createInitialWordleState, makeWordleMove } from "../games/wordle";
import { createInitialWhosMostLikelyState, submitWhosMostLikelyVote } from "../games/whosMostLikely";
import {
  TicTacToeState,
  ConnectFourState,
  WordleState,
  WhosMostLikelyState,
} from "../games/types";

export interface CreateGameParams {
  coupleId: string;
  initiatorId: string;
  partnerId: string;
  gameType: GameType;
  stakes?: string;
  whoStarts?: "me" | "partner";
  targetWord?: string;
  hint?: string;
}

export async function createGameSession({
  coupleId,
  initiatorId,
  partnerId,
  gameType,
  stakes,
  whoStarts = "me",
  targetWord,
  hint,
}: CreateGameParams) {
  let initialGameState: any;
  let currentTurnUserId = whoStarts === "me" ? initiatorId : partnerId;

  if (gameType === "TIC_TAC_TOE") {
    initialGameState = createInitialTicTacToeState();
  } else if (gameType === "CONNECT_FOUR") {
    initialGameState = createInitialConnectFourState();
  } else if (gameType === "WORDLE") {
    // In Wordle, initiator creates word, partner guesses
    initialGameState = createInitialWordleState({
      targetWord: targetWord || "HEART",
      hint: hint || null,
      guesserId: partnerId,
    });
    currentTurnUserId = partnerId; // The guesser starts
  } else if (gameType === "WHOS_MOST_LIKELY") {
    initialGameState = createInitialWhosMostLikelyState();
    currentTurnUserId = whoStarts === "me" ? initiatorId : partnerId;
  } else {
    throw new Error(`Unsupported game type: ${gameType}`);
  }

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
      take: 20,
      include: {
        initiator: { select: { id: true, displayName: true, nickname: true, avatarUrl: true } },
        currentTurnUser: { select: { id: true, displayName: true, nickname: true, avatarUrl: true } },
        winner: { select: { id: true, displayName: true, nickname: true, avatarUrl: true } },
      },
    }),
    prisma.gameSession.findMany({
      where: { coupleId, status: { in: ["COMPLETED", "ABANDONED"] } },
      select: { winnerId: true, isDraw: true },
    }),
  ]);

  const winCounts: Record<string, number> = {};
  let drawCount = 0;

  for (const g of allFinished) {
    if (g.isDraw) {
      drawCount += 1;
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
  moveData: {
    index?: number;
    col?: number;
    guess?: string;
    questionIndex?: number;
    votedUserId?: string;
  }
) {
  const game = await getGameSession(gameId, coupleId);
  if (!game) {
    throw new Error("Game not found");
  }

  if (game.status !== "IN_PROGRESS") {
    throw new Error("Game is no longer in progress");
  }

  // Find partner ID in couple
  const partnerMember = game.couple.members.find((m) => m.userId !== userId);
  const partnerId = partnerMember ? partnerMember.userId : userId;

  let moveResult: any;
  let nextTurnUserId = partnerId;

  if (game.gameType === "TIC_TAC_TOE") {
    if (game.currentTurnUserId !== userId) {
      throw new Error("It is not your turn");
    }
    if (typeof moveData.index !== "number") {
      throw new Error("Missing cell index for Tic-Tac-Toe");
    }
    const state = game.gameState as unknown as TicTacToeState;
    moveResult = makeTicTacToeMove(state, moveData.index, userId);
    nextTurnUserId = moveResult.isWon || moveResult.isDraw ? userId : partnerId;
  } else if (game.gameType === "CONNECT_FOUR") {
    if (game.currentTurnUserId !== userId) {
      throw new Error("It is not your turn");
    }
    if (typeof moveData.col !== "number") {
      throw new Error("Missing column for Connect Four");
    }
    const state = game.gameState as unknown as ConnectFourState;
    moveResult = makeConnectFourMove(state, moveData.col, userId);
    nextTurnUserId = moveResult.isWon || moveResult.isDraw ? userId : partnerId;
  } else if (game.gameType === "WORDLE") {
    if (typeof moveData.guess !== "string") {
      throw new Error("Missing guess for Wordle");
    }
    const state = game.gameState as unknown as WordleState;
    moveResult = makeWordleMove(state, moveData.guess, userId, game.initiatorId);
    // Guesser keeps guessing until solved or out of attempts
    nextTurnUserId = moveResult.isWon || moveResult.isDraw ? userId : state.guesserId;
  } else if (game.gameType === "WHOS_MOST_LIKELY") {
    if (typeof moveData.questionIndex !== "number" || !moveData.votedUserId) {
      throw new Error("Missing questionIndex or votedUserId for Who's Most Likely");
    }
    const state = game.gameState as unknown as WhosMostLikelyState;
    moveResult = submitWhosMostLikelyVote(
      state,
      moveData.questionIndex,
      moveData.votedUserId,
      userId,
      partnerId
    );
    // If partner has not answered this question yet, switch turn to partner!
    const questionVotes = moveResult.newState.votes[moveData.questionIndex] || {};
    nextTurnUserId = questionVotes[partnerId] ? userId : partnerId;
  } else {
    throw new Error(`Unsupported game: ${game.gameType}`);
  }

  if (!moveResult.isValid) {
    throw new Error(moveResult.error || "Invalid move");
  }

  const newStatus: GameStatus =
    moveResult.isWon || moveResult.isDraw ? "COMPLETED" : "IN_PROGRESS";

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
