"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { ConnectFourState } from "@/lib/games/types";
import { ROWS, COLS } from "@/lib/games/connectFour";

interface ConnectFourBoardProps {
  gameState: ConnectFourState;
  currentUserId: string;
  initiatorId: string;
  isMyTurn: boolean;
  isGameOver: boolean;
  onMove: (col: number) => void;
  disabled?: boolean;
}

export function ConnectFourBoard({
  gameState,
  currentUserId,
  initiatorId,
  isMyTurn,
  isGameOver,
  onMove,
  disabled,
}: ConnectFourBoardProps) {
  const { grid, winningCells } = gameState;
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  function isColumnFull(col: number): boolean {
    return grid[0][col] !== null;
  }

  function handleColClick(col: number) {
    if (!isMyTurn || isGameOver || isColumnFull(col) || disabled) return;
    onMove(col);
  }

  function checkIsWinningCell(r: number, c: number): boolean {
    if (!winningCells) return false;
    return winningCells.some(([wr, wc]) => wr === r && wc === c);
  }

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto flex flex-col items-center select-none touch-manipulation">
      {/* Column Hover Dropper Bar */}
      <div className="w-full grid grid-cols-7 gap-1.5 sm:gap-2 px-2 sm:px-3 mb-1.5 h-6">
        {Array.from({ length: COLS }).map((_, col) => {
          const canDrop = isMyTurn && !isGameOver && !isColumnFull(col) && !disabled;
          const isHovered = hoveredCol === col && canDrop;

          return (
            <div
              key={col}
              className="flex justify-center items-center cursor-pointer"
              onClick={() => handleColClick(col)}
              onMouseEnter={() => setHoveredCol(col)}
              onMouseLeave={() => setHoveredCol(null)}
            >
              {isHovered && (
                <motion.div
                  initial={{ y: -6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <ChevronDown className="w-4 h-4 text-[#E26D54] animate-bounce" />
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Board - iOS 12 resilient grid layout */}
      <div className="w-full bg-[#1C1829] border-2 border-[#362F47] p-2 sm:p-3.5 rounded-2xl sm:rounded-3xl shadow-xl shadow-black/50 relative">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {Array.from({ length: COLS }).map((_, col) => {
            const canDrop = isMyTurn && !isGameOver && !isColumnFull(col) && !disabled;

            return (
              <div
                key={col}
                onClick={() => handleColClick(col)}
                onMouseEnter={() => setHoveredCol(col)}
                onMouseLeave={() => setHoveredCol(null)}
                className={`flex flex-col space-y-1 sm:space-y-2 rounded-xl py-0.5 transition-colors cursor-pointer ${
                  canDrop ? "hover:bg-white/[0.05] active:bg-white/[0.08]" : ""
                }`}
              >
                {Array.from({ length: ROWS }).map((_, row) => {
                  const cellValue = grid[row][col];
                  const isWinning = checkIsWinningCell(row, col);
                  const isInitiatorCell = cellValue === initiatorId;

                  return (
                    /* 
                      iOS 12 Fallback Trick:
                      Older WebKit (iOS 12 / iPhone 6) doesn't support `aspect-ratio: 1/1`.
                      Using `pt-[100%]` (percentage padding) guarantees a 1:1 perfect square
                      and round circle on all legacy browsers without collapsing!
                    */
                    <div
                      key={row}
                      className="w-full pt-[100%] rounded-full bg-[#120F1C] border border-[#2B243B] relative overflow-hidden"
                    >
                      <div className="absolute inset-0 flex items-center justify-center p-[8%]">
                        {cellValue !== null && (
                          <motion.div
                            initial={{ y: -(row + 1) * 35, scale: 0.85 }}
                            animate={{ y: 0, scale: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 26,
                            }}
                            className={`w-full h-full rounded-full flex items-center justify-center transform-gpu will-change-transform ${
                              isInitiatorCell
                                ? "bg-gradient-to-tr from-rose-600 to-rose-400 border border-rose-300"
                                : "bg-gradient-to-tr from-amber-500 to-yellow-300 border border-amber-200"
                            } ${
                              isWinning
                                ? "ring-2 sm:ring-4 ring-white animate-pulse shadow-[0_0_12px_rgba(255,255,255,0.7)]"
                                : ""
                            }`}
                          >
                            <div className="w-2.5 h-2.5 rounded-full bg-white/30 -mt-1 -ml-1" />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
