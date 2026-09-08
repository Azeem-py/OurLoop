"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Gamepad2,
  Trophy,
  Plus,
  Play,
  Heart,
  Sparkles,
  Grid3X3,
  CircleDot,
  Clock,
  CheckCircle2,
  Lock,
  Flame,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { NewGameModal } from "./NewGameModal";
import { GameType } from "@/lib/games/types";

interface GameItem {
  id: string;
  gameType: GameType;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  initiatorId: string;
  currentTurnUserId: string;
  winnerId?: string | null;
  isDraw?: boolean;
  stakes?: string | null;
  lastMoveAt: string | Date;
  updatedAt: string | Date;
  initiator: { id: string; displayName: string; nickname?: string | null };
  currentTurnUser: { id: string; displayName: string; nickname?: string | null };
  winner?: { id: string; displayName: string; nickname?: string | null } | null;
}

interface GamesHubProps {
  initialActiveGames: GameItem[];
  initialCompletedGames: GameItem[];
  stats: {
    totalPlayed: number;
    winCounts: Record<string, number>;
    drawCount: number;
  };
  currentUserId: string;
  partnerName: string;
  partnerId: string;
}

export function GamesHub({
  initialActiveGames,
  initialCompletedGames,
  stats,
  currentUserId,
  partnerName,
  partnerId,
}: GamesHubProps) {
  const [activeGames] = useState<GameItem[]>(initialActiveGames);
  const [completedGames] = useState<GameItem[]>(initialCompletedGames);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const myWins = stats.winCounts[currentUserId] || 0;
  const partnerWins = stats.winCounts[partnerId] || 0;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-16">
      {/* Hero / Match Scorecard */}
      <div className="rounded-3xl bg-gradient-to-br from-[#1C182B] to-[#14121D] border border-[#2D273E] p-5 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#E26D54]/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#E26D54]/15 border border-[#E26D54]/30 text-[#E26D54] text-xs font-semibold mb-2">
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>OurLoop Arcade</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F6F3EE]">
              Couple Play & Rivalry
            </h1>
            <p className="text-xs sm:text-sm text-[#9992A8] mt-1">
              Challenge {partnerName} to quick mini-games, play live or turn-by-turn!
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="self-start sm:self-auto inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-[#E26D54] hover:bg-[#d05e46] text-white text-xs sm:text-sm font-semibold shadow-md shadow-[#E26D54]/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] touch-manipulation"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Match</span>
          </button>
        </div>

        {/* Scorecard Tally */}
        <div className="mt-6 pt-5 border-t border-[#292437] grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div className="p-3 sm:p-4 rounded-2xl bg-[#151320] border border-[#252033]">
            <div className="text-[11px] text-[#9992A8] font-medium">You</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#E26D54] mt-0.5">
              {myWins}
            </div>
            <div className="text-[10px] text-[#787189] mt-0.5">Victories</div>
          </div>

          <div className="p-3 sm:p-4 rounded-2xl bg-[#151320] border border-[#252033]">
            <div className="text-[11px] text-[#9992A8] font-medium">Draws</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#F6F3EE]/80 mt-0.5">
              {stats.drawCount}
            </div>
            <div className="text-[10px] text-[#787189] mt-0.5">Tied Games</div>
          </div>

          <div className="p-3 sm:p-4 rounded-2xl bg-[#151320] border border-[#252033]">
            <div className="text-[11px] text-[#9992A8] font-medium">{partnerName}</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-0.5">
              {partnerWins}
            </div>
            <div className="text-[10px] text-[#787189] mt-0.5">Victories</div>
          </div>
        </div>
      </div>

      {/* Active Games in Progress */}
      {activeGames.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#F6F3EE] uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#E26D54]" />
              <span>Active Battles ({activeGames.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {activeGames.map((game) => {
              const isMyTurn = game.currentTurnUserId === currentUserId;
              const gameLabel =
                game.gameType === "TIC_TAC_TOE" ? "Hearts & Kisses" : "Four in a Row";

              return (
                <Link
                  key={game.id}
                  href={`/games/${game.id}`}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 group relative overflow-hidden ${
                    isMyTurn
                      ? "bg-[#1E1929] border-[#E26D54]/50 shadow-[0_0_16px_rgba(226,109,84,0.15)] hover:border-[#E26D54]"
                      : "bg-[#16131F] border-[#292437] hover:border-[#3E3752]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#252033] flex items-center justify-center">
                        {game.gameType === "TIC_TAC_TOE" ? (
                          <Grid3X3 className="w-5 h-5 text-rose-400" />
                        ) : (
                          <CircleDot className="w-5 h-5 text-amber-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-[#F6F3EE] group-hover:text-[#E26D54] transition-colors">
                          {gameLabel}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#9992A8] mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatDistanceToNow(new Date(game.lastMoveAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Turn Badge */}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        isMyTurn
                          ? "bg-[#E26D54]/20 text-[#E26D54] border-[#E26D54]/40 animate-pulse"
                          : "bg-white/5 text-[#9992A8] border-white/10"
                      }`}
                    >
                      {isMyTurn ? "Your Turn ✨" : `Waiting for ${partnerName}`}
                    </span>
                  </div>

                  {game.stakes && (
                    <div className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 truncate">
                      🎯 {game.stakes}
                    </div>
                  )}

                  <div className="flex items-center justify-end text-xs font-semibold text-[#E26D54] group-hover:translate-x-0.5 transition-transform">
                    <span className="flex items-center gap-1">
                      <span>Jump In</span>
                      <Play className="w-3 h-3 fill-current" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Game Catalog */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-[#F6F3EE] uppercase tracking-wider">
          Choose a Game
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Hearts & Kisses */}
          <div
            onClick={() => setIsModalOpen(true)}
            className="p-5 rounded-3xl bg-[#171422] border border-[#2B253B] hover:border-[#E26D54]/60 transition-all flex flex-col justify-between gap-4 cursor-pointer group hover:scale-[1.01]"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3 group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6 fill-rose-500 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-bold text-[#F6F3EE]">Hearts & Kisses</h3>
              <p className="text-xs text-[#9992A8] mt-1 line-clamp-2">
                Classic 3x3 Tic-Tac-Toe customized with hearts and kisses tokens.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#262035] text-xs font-semibold text-[#E26D54]">
              <span>Play Now</span>
              <Play className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>

          {/* 2. Four in a Row */}
          <div
            onClick={() => setIsModalOpen(true)}
            className="p-5 rounded-3xl bg-[#171422] border border-[#2B253B] hover:border-[#E26D54]/60 transition-all flex flex-col justify-between gap-4 cursor-pointer group hover:scale-[1.01]"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition-transform">
                <CircleDot className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-sm font-bold text-[#F6F3EE]">Four in a Row</h3>
              <p className="text-xs text-[#9992A8] mt-1 line-clamp-2">
                Drop gravity tokens in 7 columns. First to line up 4 wins!
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#262035] text-xs font-semibold text-[#E26D54]">
              <span>Play Now</span>
              <Play className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>

          {/* 3. Wordle for Two (Teaser) */}
          <div className="p-5 rounded-3xl bg-[#14121D]/70 border border-[#242031] opacity-75 flex flex-col justify-between gap-4">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400/80 mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#F6F3EE]/80">Couple Wordle</h3>
              <p className="text-xs text-[#766F85] mt-1">
                Pick secret 5-letter inside jokes or keywords for your partner to guess.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#766F85]">
              <Lock className="w-3 h-3" />
              <span>Coming Soon</span>
            </div>
          </div>

          {/* 4. Compatibility Quiz (Teaser) */}
          <div className="p-5 rounded-3xl bg-[#14121D]/70 border border-[#242031] opacity-75 flex flex-col justify-between gap-4">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400/80 mb-3">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#F6F3EE]/80">Who&apos;s Most Likely</h3>
              <p className="text-xs text-[#766F85] mt-1">
                Answer simultaneous questions to see how aligned you both are!
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#766F85]">
              <Lock className="w-3 h-3" />
              <span>Coming Soon</span>
            </div>
          </div>
        </div>
      </section>

      {/* Completed Matches History */}
      {completedGames.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#F6F3EE] uppercase tracking-wider">
            Match History
          </h2>

          <div className="rounded-3xl bg-[#16131F] border border-[#262135] divide-y divide-[#221D30] overflow-hidden">
            {completedGames.map((game) => {
              const amIWinner = game.winnerId === currentUserId;
              const isDraw = game.isDraw;
              const gameLabel =
                game.gameType === "TIC_TAC_TOE" ? "Hearts & Kisses" : "Four in a Row";

              return (
                <div
                  key={game.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#1C1827] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isDraw
                          ? "bg-slate-800 text-slate-400"
                          : amIWinner
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                          : "bg-rose-950/60 text-rose-400 border border-rose-800/40"
                      }`}
                    >
                      {isDraw ? (
                        <span className="text-xs font-bold">DRAW</span>
                      ) : (
                        <Trophy className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[#F6F3EE]">
                        {gameLabel}
                      </div>
                      <div className="text-[11px] text-[#9992A8]">
                        {isDraw
                          ? "Ended in a draw"
                          : amIWinner
                          ? "You won"
                          : `${partnerName} won`}
                        {game.stakes && ` • Stakes: ${game.stakes}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 text-[11px] text-[#766F85]">
                    <span>
                      {formatDistanceToNow(new Date(game.updatedAt), {
                        addSuffix: true,
                      })}
                    </span>
                    <Link
                      href={`/games/${game.id}`}
                      className="px-2.5 py-1 rounded-lg bg-[#252033] hover:bg-[#322B45] text-[#F6F3EE] transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* New Game Modal */}
      <NewGameModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        partnerName={partnerName}
      />
    </div>
  );
}
