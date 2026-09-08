"use client";

import Link from "next/link";
import { ArrowLeft, Flag, Heart, Sparkles, Trophy } from "lucide-react";
import { GameType, GameStatus } from "@/lib/games/types";

interface PlayerInfo {
  id: string;
  displayName: string;
  nickname?: string | null;
  avatarUrl?: string | null;
}

interface GameHeaderProps {
  gameType: GameType;
  status: GameStatus;
  isMyTurn: boolean;
  winnerId?: string | null;
  isDraw?: boolean;
  stakes?: string | null;
  currentUser: PlayerInfo;
  partner: PlayerInfo;
  initiatorId: string;
  onSurrender: () => void;
  isSurrendering?: boolean;
}

export function GameHeader({
  status,
  isMyTurn,
  winnerId,
  isDraw,
  stakes,
  currentUser,
  partner,
  initiatorId,
  onSurrender,
  isSurrendering,
}: GameHeaderProps) {
  const isGameOver = status === "COMPLETED" || status === "ABANDONED";
  const amIWinner = winnerId === currentUser.id;
  const partnerName = partner.nickname || partner.displayName;
  const myName = currentUser.nickname || currentUser.displayName;

  return (
    <div className="w-full space-y-3 select-none">
      {/* Top Bar: Back & Surrender */}
      <div className="flex items-center justify-between">
        <Link
          href="/games"
          className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-medium text-[#9992A8] hover:text-[#F6F3EE] bg-[#1B1824] hover:bg-[#252033] px-3 py-1.5 rounded-full border border-[#2B2639] transition-all touch-manipulation"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Games</span>
        </Link>

        {!isGameOver && (
          <button
            type="button"
            onClick={onSurrender}
            disabled={isSurrendering}
            className="inline-flex items-center space-x-1 text-xs text-[#9992A8] hover:text-rose-400 bg-[#171520] hover:bg-rose-950/20 px-3 py-1.5 rounded-full border border-[#2B2639] hover:border-rose-800/40 transition-all cursor-pointer touch-manipulation"
          >
            <Flag className="w-3 h-3" />
            <span>{isSurrendering ? "Resigning..." : "Resign"}</span>
          </button>
        )}
      </div>

      {/* Players Pill - iOS 12 flex fallback using space-x */}
      <div className="bg-[#171520] border border-[#292536] rounded-2xl p-3 flex items-center justify-between">
        {/* Current User */}
        <div className="flex items-center space-x-2.5">
          <div className="relative shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-[#E26D54] to-rose-400 flex items-center justify-center font-bold text-white text-xs border border-white/20">
              {myName.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#171520] flex items-center justify-center">
              {currentUser.id === initiatorId ? (
                <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
              ) : (
                <Sparkles className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
              )}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[#F6F3EE] truncate">{myName} (You)</div>
            <div className="text-[10px] text-[#9992A8]">
              {currentUser.id === initiatorId ? "Player 1" : "Player 2"}
            </div>
          </div>
        </div>

        <div className="text-[10px] sm:text-[11px] font-bold tracking-widest text-[#766F85] uppercase px-2 shrink-0">
          VS
        </div>

        {/* Partner */}
        <div className="flex items-center space-x-2.5 space-x-reverse text-right">
          <div className="relative shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-white text-xs border border-white/20">
              {partnerName.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-[#171520] flex items-center justify-center">
              {partner.id === initiatorId ? (
                <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
              ) : (
                <Sparkles className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
              )}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[#F6F3EE] truncate">{partnerName}</div>
            <div className="text-[10px] text-[#9992A8]">
              {partner.id === initiatorId ? "Player 1" : "Player 2"}
            </div>
          </div>
        </div>
      </div>

      {/* Stakes Ribbon if configured */}
      {stakes && (
        <div className="flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <span>🎯</span>
          <span className="font-semibold">Stakes:</span>
          <span className="truncate">{stakes}</span>
        </div>
      )}

      {/* Turn Banner */}
      <div
        className={`py-2 px-3 rounded-2xl text-center text-xs sm:text-sm font-semibold transition-all shadow-sm ${
          isGameOver
            ? amIWinner
              ? "bg-emerald-950/40 border border-emerald-500/40 text-emerald-300"
              : isDraw
              ? "bg-slate-800/50 border border-slate-600 text-slate-300"
              : "bg-rose-950/40 border border-rose-700/40 text-rose-300"
            : isMyTurn
            ? "bg-[#E26D54]/20 border border-[#E26D54]/60 text-[#F6F3EE] shadow-[0_0_12px_rgba(226,109,84,0.2)] animate-pulse"
            : "bg-[#181522] border border-[#2C273B] text-[#9992A8]"
        }`}
      >
        {isGameOver ? (
          amIWinner ? (
            <span className="inline-flex items-center space-x-1.5">
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>You won the match! 🎉</span>
            </span>
          ) : isDraw ? (
            <span>Good game! Match ended in a draw! 🤝</span>
          ) : (
            <span>{partnerName} won this match! Rematch?</span>
          )
        ) : isMyTurn ? (
          <span>Your turn! Place your move ✨</span>
        ) : (
          <span>Waiting for {partnerName}&apos;s move... ⏳</span>
        )}
      </div>
    </div>
  );
}
