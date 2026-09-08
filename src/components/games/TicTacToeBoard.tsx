"use client";

import { motion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";
import { TicTacToeState } from "@/lib/games/types";

interface TicTacToeBoardProps {
  gameState: TicTacToeState;
  currentUserId: string;
  initiatorId: string;
  isMyTurn: boolean;
  isGameOver: boolean;
  onMove: (index: number) => void;
  disabled?: boolean;
}

export function TicTacToeBoard({
  gameState,
  currentUserId,
  initiatorId,
  isMyTurn,
  isGameOver,
  onMove,
  disabled,
}: TicTacToeBoardProps) {
  const { board, winningLine } = gameState;

  function renderToken(userId: string | null) {
    if (!userId) return null;
    const isInitiator = userId === initiatorId;

    if (isInitiator) {
      return (
        <motion.div
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 22 }}
          className="flex items-center justify-center text-rose-500 transform-gpu will-change-transform"
        >
          <Heart className="w-9 h-9 sm:w-12 sm:h-12 fill-rose-500 stroke-[1.5]" />
        </motion.div>
      );
    } else {
      return (
        <motion.div
          initial={{ scale: 0, rotate: 25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 22 }}
          className="flex items-center justify-center text-amber-400 transform-gpu will-change-transform"
        >
          <Sparkles className="w-9 h-9 sm:w-12 sm:h-12 fill-amber-400 stroke-[1.5]" />
        </motion.div>
      );
    }
  }

  return (
    <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-[#171520] border border-[#292536] shadow-xl shadow-black/40 grid grid-cols-3 gap-2 sm:gap-3 touch-manipulation select-none">
      {board.map((cellValue, index) => {
        const isWinningCell = winningLine?.includes(index);
        const canClick = isMyTurn && !isGameOver && cellValue === null && !disabled;

        return (
          <button
            key={index}
            type="button"
            disabled={!canClick}
            onClick={() => onMove(index)}
            className={`relative rounded-xl sm:rounded-2xl flex items-center justify-center h-20 sm:h-24 md:h-28 transition-all duration-150 select-none overflow-hidden touch-manipulation ${
              isWinningCell
                ? "bg-[#E26D54]/25 border-2 border-[#E26D54] shadow-[0_0_12px_rgba(226,109,84,0.4)] animate-pulse"
                : cellValue !== null
                ? "bg-[#1E1B29] border border-[#342F45]"
                : canClick
                ? "bg-[#1E1B29]/80 border border-[#2D283C] hover:bg-[#2A253A] hover:border-[#E26D54]/60 active:scale-[0.97] cursor-pointer"
                : "bg-[#1A1724]/40 border border-[#242031] cursor-not-allowed opacity-75"
            }`}
          >
            {renderToken(cellValue)}

            {/* Hover ghost preview for active player */}
            {canClick && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-20 transition-opacity pointer-events-none">
                {currentUserId === initiatorId ? (
                  <Heart className="w-7 h-7 fill-rose-500 text-rose-500" />
                ) : (
                  <Sparkles className="w-7 h-7 fill-amber-400 text-amber-400" />
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
