"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { RotateCcw, AlertCircle } from "lucide-react";
import { GameHeader } from "./GameHeader";
import { TicTacToeBoard } from "./TicTacToeBoard";
import { ConnectFourBoard } from "./ConnectFourBoard";
import { WordleBoard } from "./WordleBoard";
import { WhosMostLikelyBoard } from "./WhosMostLikelyBoard";
import {
  GameType,
  GameStatus,
  TicTacToeState,
  ConnectFourState,
  WordleState,
  WhosMostLikelyState,
} from "@/lib/games/types";

interface GameArenaProps {
  initialGame: {
    id: string;
    coupleId: string;
    gameType: GameType;
    status: GameStatus;
    initiatorId: string;
    currentTurnUserId: string;
    winnerId?: string | null;
    isDraw?: boolean;
    stakes?: string | null;
    gameState: any;
    updatedAt: string | Date;
    initiator: { id: string; displayName: string; nickname?: string | null; avatarUrl?: string | null };
    currentTurnUser: { id: string; displayName: string; nickname?: string | null; avatarUrl?: string | null };
    winner?: { id: string; displayName: string; nickname?: string | null; avatarUrl?: string | null } | null;
  };
  currentUserId: string;
  partner: { id: string; displayName: string; nickname?: string | null; avatarUrl?: string | null };
}

export function GameArena({ initialGame, currentUserId, partner }: GameArenaProps) {
  const router = useRouter();
  const [game, setGame] = useState(initialGame);
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);
  const [isSurrendering, setIsSurrendering] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRematching, setIsRematching] = useState(false);

  const prevStatusRef = useRef(game.status);
  const currentUserObj =
    game.initiatorId === currentUserId
      ? game.initiator
      : partner.id === currentUserId
      ? partner
      : { id: currentUserId, displayName: "You", nickname: "You" };

  const partnerUserObj =
    partner.id === currentUserId
      ? game.initiator
      : partner;

  const isMyTurn = game.currentTurnUserId === currentUserId && game.status === "IN_PROGRESS";
  const isGameOver = game.status === "COMPLETED" || game.status === "ABANDONED";

  // Trigger celebratory confetti on victory
  useEffect(() => {
    if (game.status === "COMPLETED" && (game.winnerId === currentUserId || (game.gameType === "WHOS_MOST_LIKELY" && game.isDraw))) {
      if (prevStatusRef.current !== "COMPLETED") {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ["#E26D54", "#F43F5E", "#FBBF24"],
          });
        } catch {
          // Ignore canvas errors on low-spec/legacy devices
        }
      }
    }
    prevStatusRef.current = game.status;
  }, [game.status, game.winnerId, currentUserId, game.gameType, game.isDraw]);

  // Real-time polling sync
  useEffect(() => {
    if (isGameOver) return;

    const interval = setInterval(async () => {
      if (typeof document !== "undefined" && document.hidden) return;

      try {
        const res = await fetch(`/api/games/${game.id}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.game) {
            setGame((prev) => {
              if (
                prev.status === data.game.status &&
                prev.currentTurnUserId === data.game.currentTurnUserId &&
                new Date(prev.updatedAt).getTime() === new Date(data.game.updatedAt).getTime()
              ) {
                return prev;
              }
              return data.game;
            });
          }
        }
      } catch (err) {
        // Silent background catch
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [game.id, isGameOver]);

  async function handleMove(movePayload: {
    index?: number;
    col?: number;
    guess?: string;
    questionIndex?: number;
    votedUserId?: string;
  }) {
    if (isGameOver || isSubmittingMove) return;

    setIsSubmittingMove(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/games/${game.id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movePayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to make move");
      }

      setGame(data.game);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process move");
    } finally {
      setIsSubmittingMove(false);
    }
  }

  async function handleSurrender() {
    if (isGameOver || isSurrendering) return;
    if (!confirm("Are you sure you want to resign this match?")) return;

    setIsSurrendering(true);
    try {
      const res = await fetch(`/api/games/${game.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.game) {
        setGame(data.game);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSurrendering(false);
    }
  }

  async function handleRematch() {
    setIsRematching(true);
    try {
      const nextStarter = game.initiatorId === currentUserId ? "partner" : "me";
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: game.gameType,
          stakes: game.stakes || undefined,
          whoStarts: nextStarter,
        }),
      });

      if (res.ok) {
        const { game: newGame } = await res.json();
        router.push(`/games/${newGame.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRematching(false);
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col space-y-4 py-2 pb-12">
      {/* Header Info */}
      <GameHeader
        gameType={game.gameType}
        status={game.status}
        isMyTurn={isMyTurn}
        winnerId={game.winnerId}
        isDraw={game.isDraw}
        stakes={game.stakes}
        currentUser={currentUserObj}
        partner={partnerUserObj}
        initiatorId={game.initiatorId}
        onSurrender={handleSurrender}
        isSurrendering={isSurrendering}
      />

      {/* Error Alert if any */}
      {errorMessage && (
        <div className="flex items-center space-x-2 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Game Board */}
      <div className="flex justify-center my-1">
        {game.gameType === "TIC_TAC_TOE" && (
          <TicTacToeBoard
            gameState={game.gameState as unknown as TicTacToeState}
            currentUserId={currentUserId}
            initiatorId={game.initiatorId}
            isMyTurn={isMyTurn}
            isGameOver={isGameOver}
            onMove={(index) => handleMove({ index })}
            disabled={isSubmittingMove}
          />
        )}

        {game.gameType === "CONNECT_FOUR" && (
          <ConnectFourBoard
            gameState={game.gameState as unknown as ConnectFourState}
            currentUserId={currentUserId}
            initiatorId={game.initiatorId}
            isMyTurn={isMyTurn}
            isGameOver={isGameOver}
            onMove={(col) => handleMove({ col })}
            disabled={isSubmittingMove}
          />
        )}

        {game.gameType === "WORDLE" && (
          <WordleBoard
            gameState={game.gameState as unknown as WordleState}
            currentUserId={currentUserId}
            initiatorId={game.initiatorId}
            isMyTurn={isMyTurn}
            isGameOver={isGameOver}
            onGuess={(guess) => handleMove({ guess })}
            disabled={isSubmittingMove}
          />
        )}

        {game.gameType === "WHOS_MOST_LIKELY" && (
          <WhosMostLikelyBoard
            gameState={game.gameState as unknown as WhosMostLikelyState}
            currentUserId={currentUserId}
            currentUser={currentUserObj}
            partner={partnerUserObj}
            isGameOver={isGameOver}
            onVote={(questionIndex, votedUserId) =>
              handleMove({ questionIndex, votedUserId })
            }
            disabled={isSubmittingMove}
          />
        )}
      </div>

      {/* Game Over Actions (Rematch) */}
      {isGameOver && (
        <div className="flex flex-col sm:flex-row items-center justify-center pt-2">
          <button
            type="button"
            onClick={handleRematch}
            disabled={isRematching}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#E26D54] hover:bg-[#cf5f47] active:scale-[0.98] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md shadow-[#E26D54]/25 transition-all cursor-pointer touch-manipulation"
          >
            <RotateCcw className={`w-4 h-4 ${isRematching ? "animate-spin" : ""}`} />
            <span>{isRematching ? "Starting rematch..." : "Play Rematch"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
