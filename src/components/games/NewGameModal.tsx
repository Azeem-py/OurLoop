"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Trophy,
  Grid3X3,
  CircleDot,
  ArrowRight,
  Sparkles,
  HelpCircle,
  HeartHandshake,
} from "lucide-react";
import { GameType } from "@/lib/games/types";

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  defaultGameType?: GameType;
}

const STAKE_PRESETS = [
  "Winner picks tonight's movie 🍿",
  "15-minute back massage 💆",
  "Loser cooks breakfast tomorrow 🥞",
  "Winner gets an ice cream date 🍦",
  "Winner gets one wish grant ✨",
];

const WORDLE_WORD_PRESETS = [
  "HEART",
  "SMILE",
  "SWEET",
  "HONEY",
  "DREAM",
  "KISSY",
  "ANGEL",
  "BABYY",
  "CUDDL",
  "LOVER",
];

export function NewGameModal({
  isOpen,
  onClose,
  partnerName,
  defaultGameType = "TIC_TAC_TOE",
}: NewGameModalProps) {
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<GameType>(defaultGameType);
  const [whoStarts, setWhoStarts] = useState<"me" | "partner">("me");
  const [stakes, setStakes] = useState<string>("");
  const [targetWord, setTargetWord] = useState<string>("HEART");
  const [hint, setHint] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultGameType) {
      setSelectedGame(defaultGameType);
    }
  }, [defaultGameType, isOpen]);

  if (!isOpen) return null;

  async function handleStartGame() {
    setIsSubmitting(true);
    setError(null);

    // Validation for Wordle
    if (selectedGame === "WORDLE") {
      const clean = targetWord.trim().toUpperCase().replace(/[^A-Z]/g, "");
      if (clean.length !== 5) {
        setError("Secret word must be exactly 5 letters.");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: selectedGame,
          stakes: stakes.trim() || undefined,
          whoStarts,
          targetWord: selectedGame === "WORDLE" ? targetWord.trim().toUpperCase() : undefined,
          hint: selectedGame === "WORDLE" && hint.trim() ? hint.trim() : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start game");
      }

      const { game } = await res.json();
      onClose();
      router.push(`/games/${game.id}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#16141F] border border-[#2B2639] rounded-3xl p-5 sm:p-6 shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9992A8] hover:text-[#F6F3EE] p-1.5 rounded-full hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <h2 className="text-lg font-bold text-[#F6F3EE] flex items-center gap-2">
            <span>Challenge {partnerName}</span>
            <span className="text-xl">🎮</span>
          </h2>
          <p className="text-xs text-[#9992A8] mt-1">
            Pick a mini-game and set fun playful stakes!
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* 1. Choose Game */}
        <div className="space-y-2 mb-5">
          <label className="text-xs font-semibold text-[#F6F3EE] tracking-wide uppercase">
            1. Select Game
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Hearts & Kisses */}
            <button
              type="button"
              onClick={() => setSelectedGame("TIC_TAC_TOE")}
              className={`p-3 rounded-2xl border text-left flex flex-col transition-all cursor-pointer ${
                selectedGame === "TIC_TAC_TOE"
                  ? "bg-[#E26D54]/15 border-[#E26D54] shadow-[0_0_15px_rgba(226,109,84,0.2)]"
                  : "bg-[#1E1B29] border-[#2E283E] hover:border-[#423A57]"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Grid3X3 className="w-4 h-4 text-rose-400" />
                <span className="text-xs">❤️💋</span>
              </div>
              <span className="text-xs font-bold text-[#F6F3EE]">Hearts & Kisses</span>
              <span className="text-[10px] text-[#9992A8]">Classic Tic-Tac-Toe</span>
            </button>

            {/* Four in a Row */}
            <button
              type="button"
              onClick={() => setSelectedGame("CONNECT_FOUR")}
              className={`p-3 rounded-2xl border text-left flex flex-col transition-all cursor-pointer ${
                selectedGame === "CONNECT_FOUR"
                  ? "bg-[#E26D54]/15 border-[#E26D54] shadow-[0_0_15px_rgba(226,109,84,0.2)]"
                  : "bg-[#1E1B29] border-[#2E283E] hover:border-[#423A57]"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <CircleDot className="w-4 h-4 text-amber-400" />
                <span className="text-xs">🔴🟡</span>
              </div>
              <span className="text-xs font-bold text-[#F6F3EE]">Four in a Row</span>
              <span className="text-[10px] text-[#9992A8]">Connect 4 drops</span>
            </button>

            {/* Couple Wordle */}
            <button
              type="button"
              onClick={() => setSelectedGame("WORDLE")}
              className={`p-3 rounded-2xl border text-left flex flex-col transition-all cursor-pointer ${
                selectedGame === "WORDLE"
                  ? "bg-[#E26D54]/15 border-[#E26D54] shadow-[0_0_15px_rgba(226,109,84,0.2)]"
                  : "bg-[#1E1B29] border-[#2E283E] hover:border-[#423A57]"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs">🔤💚</span>
              </div>
              <span className="text-xs font-bold text-[#F6F3EE]">Couple Wordle</span>
              <span className="text-[10px] text-[#9992A8]">Secret 5-letter word</span>
            </button>

            {/* Who's Most Likely */}
            <button
              type="button"
              onClick={() => setSelectedGame("WHOS_MOST_LIKELY")}
              className={`p-3 rounded-2xl border text-left flex flex-col transition-all cursor-pointer ${
                selectedGame === "WHOS_MOST_LIKELY"
                  ? "bg-[#E26D54]/15 border-[#E26D54] shadow-[0_0_15px_rgba(226,109,84,0.2)]"
                  : "bg-[#1E1B29] border-[#2E283E] hover:border-[#423A57]"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <HeartHandshake className="w-4 h-4 text-purple-400" />
                <span className="text-xs">💭💕</span>
              </div>
              <span className="text-xs font-bold text-[#F6F3EE]">Who&apos;s Most Likely</span>
              <span className="text-[10px] text-[#9992A8]">5 compatibility questions</span>
            </button>
          </div>
        </div>

        {/* Wordle Specific Settings: Word picker and hint */}
        {selectedGame === "WORDLE" && (
          <div className="p-3.5 rounded-2xl bg-[#1A1726] border border-[#2E283E] space-y-3 mb-5 animate-in fade-in">
            <div>
              <label className="text-xs font-semibold text-[#F6F3EE] flex items-center justify-between">
                <span>Secret 5-Letter Word for {partnerName}</span>
                <span className="text-[10px] text-emerald-400 font-mono">5 LETTERS</span>
              </label>
              <input
                type="text"
                maxLength={5}
                value={targetWord}
                onChange={(e) =>
                  setTargetWord(
                    e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5)
                  )
                }
                placeholder="e.g. HEART"
                className="w-full mt-1.5 bg-[#14121D] border border-[#342D45] focus:border-emerald-500 text-sm font-mono font-bold tracking-widest text-center uppercase text-[#F6F3EE] px-3 py-2 rounded-xl outline-none"
              />
            </div>

            {/* Quick Word Presets */}
            <div>
              <span className="text-[10px] text-[#9992A8] block mb-1">Quick Picks:</span>
              <div className="flex flex-wrap gap-1">
                {WORDLE_WORD_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTargetWord(preset)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all ${
                      targetWord === preset
                        ? "bg-emerald-600 text-white border-emerald-500"
                        : "bg-[#1E1B2B] text-[#9992A8] border-[#2E283E] hover:text-[#F6F3EE]"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Hint */}
            <div>
              <label className="text-[11px] font-semibold text-[#9992A8] flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-[#E26D54]" />
                <span>Optional Clue / Hint</span>
              </label>
              <input
                type="text"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="e.g. Our favorite late night snack"
                className="w-full mt-1 bg-[#14121D] border border-[#342D45] focus:border-[#E26D54] text-xs text-[#F6F3EE] px-3 py-1.5 rounded-xl outline-none placeholder:text-[#5E5770]"
              />
            </div>
          </div>
        )}

        {/* 2. Who Starts (Hidden for Wordle since partner always guesses) */}
        {selectedGame !== "WORDLE" && (
          <div className="space-y-2 mb-5">
            <label className="text-xs font-semibold text-[#F6F3EE] tracking-wide uppercase">
              2. First Move
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWhoStarts("me")}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  whoStarts === "me"
                    ? "bg-[#E26D54] text-white border-[#E26D54]"
                    : "bg-[#1E1B29] text-[#9992A8] border-[#2E283E] hover:text-[#F6F3EE]"
                }`}
              >
                I will start
              </button>
              <button
                type="button"
                onClick={() => setWhoStarts("partner")}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  whoStarts === "partner"
                    ? "bg-[#E26D54] text-white border-[#E26D54]"
                    : "bg-[#1E1B29] text-[#9992A8] border-[#2E283E] hover:text-[#F6F3EE]"
                }`}
              >
                {partnerName} starts
              </button>
            </div>
          </div>
        )}

        {/* 3. Playful Stakes */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#F6F3EE] tracking-wide uppercase flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {selectedGame === "WORDLE" ? "2. Playful Stakes" : "3. Playful Stakes"} (Optional)
              </span>
            </label>
            {stakes && (
              <button
                type="button"
                onClick={() => setStakes("")}
                className="text-[10px] text-[#9992A8] hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {STAKE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setStakes(preset)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  stakes === preset
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                    : "bg-[#1A1726] text-[#9992A8] border-[#2C273B] hover:text-[#F6F3EE] hover:border-[#3D3750]"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Or write custom reward / forfeit..."
            value={stakes}
            onChange={(e) => setStakes(e.target.value)}
            className="w-full bg-[#1A1726] border border-[#2E283E] focus:border-[#E26D54] text-xs text-[#F6F3EE] px-3 py-2.5 rounded-xl outline-none transition-all placeholder:text-[#645E75]"
          />
        </div>

        {/* Submit Button */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleStartGame}
          className="w-full py-3 px-4 rounded-2xl bg-[#E26D54] hover:bg-[#d05d45] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#E26D54]/25 transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <span>Starting match...</span>
          ) : (
            <>
              <span>Launch Match</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
