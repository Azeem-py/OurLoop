"use client";

import { useState, useEffect, useCallback } from "react";
import { WordleState, WordleLetterStatus } from "@/lib/games/types";
import { Sparkles, HelpCircle, Delete } from "lucide-react";

interface WordleBoardProps {
  gameState: WordleState;
  currentUserId: string;
  initiatorId: string;
  isMyTurn: boolean;
  isGameOver: boolean;
  onGuess: (guess: string) => void;
  disabled?: boolean;
}

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACK"],
];

export function WordleBoard({
  gameState,
  currentUserId,
  initiatorId,
  isMyTurn,
  isGameOver,
  onGuess,
  disabled,
}: WordleBoardProps) {
  const [currentInput, setCurrentInput] = useState("");
  const isGuesser = currentUserId === gameState.guesserId;

  // Build keyboard letter color map
  const letterStatuses: Record<string, WordleLetterStatus> = {};
  for (const guess of gameState.guesses) {
    for (let i = 0; i < guess.word.length; i++) {
      const char = guess.word[i];
      const status = guess.evaluation[i];
      if (status === "correct") {
        letterStatuses[char] = "correct";
      } else if (status === "present" && letterStatuses[char] !== "correct") {
        letterStatuses[char] = "present";
      } else if (status === "absent" && !letterStatuses[char]) {
        letterStatuses[char] = "absent";
      }
    }
  }

  const handleCharInput = useCallback(
    (char: string) => {
      if (!isGuesser || isGameOver || disabled) return;
      if (currentInput.length < 5) {
        setCurrentInput((prev) => prev + char);
      }
    },
    [isGuesser, isGameOver, disabled, currentInput.length]
  );

  const handleDelete = useCallback(() => {
    if (!isGuesser || isGameOver || disabled) return;
    setCurrentInput((prev) => prev.slice(0, -1));
  }, [isGuesser, isGameOver, disabled]);

  const handleSubmit = useCallback(() => {
    if (!isGuesser || isGameOver || disabled) return;
    if (currentInput.length === 5) {
      onGuess(currentInput);
      setCurrentInput("");
    }
  }, [isGuesser, isGameOver, disabled, currentInput, onGuess]);

  // Physical keyboard listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isGuesser || isGameOver || disabled) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "Enter") {
        handleSubmit();
      } else if (e.key === "Backspace") {
        handleDelete();
      } else {
        const key = e.key.toUpperCase();
        if (/^[A-Z]$/.test(key)) {
          handleCharInput(key);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGuesser, isGameOver, disabled, handleCharInput, handleDelete, handleSubmit]);

  const currentRowIndex = gameState.guesses.length;

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center space-y-4">
      {/* Creator Spectator Banner */}
      {!isGuesser && (
        <div className="w-full p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
          <p className="text-xs font-semibold text-amber-300">
            You created this secret word: <span className="font-mono tracking-widest uppercase font-bold text-white ml-1">{gameState.targetWord}</span>
          </p>
          <p className="text-[11px] text-[#9992A8] mt-0.5">
            Watching your partner guess in real-time...
          </p>
        </div>
      )}

      {/* Clue/Hint Pill */}
      {gameState.hint && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C182B] border border-[#2F2842] text-xs text-[#E26D54]">
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="text-[#9992A8]">Clue:</span>
          <span className="font-medium text-[#F6F3EE]">&ldquo;{gameState.hint}&rdquo;</span>
        </div>
      )}

      {/* Wordle 6-Row Grid */}
      <div className="grid grid-rows-6 gap-2 my-2">
        {Array.from({ length: 6 }).map((_, rowIndex) => {
          const isCurrentRow = rowIndex === currentRowIndex && !isGameOver;
          const guessObj = gameState.guesses[rowIndex];

          return (
            <div key={rowIndex} className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, colIndex) => {
                let letter = "";
                let status: WordleLetterStatus | "empty" | "typing" = "empty";

                if (guessObj) {
                  letter = guessObj.word[colIndex];
                  status = guessObj.evaluation[colIndex];
                } else if (isCurrentRow && isGuesser) {
                  letter = currentInput[colIndex] || "";
                  status = letter ? "typing" : "empty";
                }

                let tileStyle = "bg-[#181524] border-[#2B243B] text-[#F6F3EE]";
                if (status === "correct") {
                  tileStyle = "bg-emerald-600 border-emerald-500 text-white shadow-[0_0_12px_rgba(5,150,105,0.4)]";
                } else if (status === "present") {
                  tileStyle = "bg-amber-600 border-amber-500 text-white shadow-[0_0_12px_rgba(217,119,6,0.3)]";
                } else if (status === "absent") {
                  tileStyle = "bg-[#1E1A29] border-[#2A2338] text-[#696279]";
                } else if (status === "typing") {
                  tileStyle = "bg-[#1C182A] border-[#E26D54] text-white scale-[1.03]";
                }

                return (
                  <div
                    key={colIndex}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl border flex items-center justify-center text-xl sm:text-2xl font-black font-mono select-none transition-all duration-300 ${tileStyle}`}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Result Status Message */}
      {isGameOver && (
        <div className="w-full p-3 rounded-2xl bg-[#1C182B] border border-[#2F2842] text-center animate-in fade-in">
          {gameState.solved ? (
            <p className="text-sm font-bold text-emerald-400 flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Wordle Solved! &ldquo;{gameState.targetWord}&rdquo;</span>
            </p>
          ) : (
            <p className="text-sm font-semibold text-rose-400">
              The secret word was <span className="font-mono font-bold uppercase underline">{gameState.targetWord}</span>
            </p>
          )}
        </div>
      )}

      {/* Virtual On-Screen Keyboard */}
      {isGuesser && !isGameOver && (
        <div className="w-full pt-2 select-none space-y-1.5 touch-manipulation">
          {KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5">
              {row.map((key) => {
                const status = letterStatuses[key];
                let keyStyle = "bg-[#201C2E] text-[#F6F3EE] hover:bg-[#2B253E] border-[#2F2842]";
                if (status === "correct") {
                  keyStyle = "bg-emerald-600 text-white border-emerald-500";
                } else if (status === "present") {
                  keyStyle = "bg-amber-600 text-white border-amber-500";
                } else if (status === "absent") {
                  keyStyle = "bg-[#16131F] text-[#554E63] border-[#221D2E]";
                }

                const isWideKey = key === "ENTER" || key === "BACK";

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      if (key === "ENTER") handleSubmit();
                      else if (key === "BACK") handleDelete();
                      else handleCharInput(key);
                    }}
                    className={`h-11 rounded-lg font-bold text-xs sm:text-sm border transition-all active:scale-95 flex items-center justify-center ${
                      isWideKey ? "px-2.5 sm:px-3 text-[11px] bg-[#272138]" : "w-8 sm:w-9"
                    } ${keyStyle}`}
                  >
                    {key === "BACK" ? <Delete className="w-4 h-4" /> : key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
