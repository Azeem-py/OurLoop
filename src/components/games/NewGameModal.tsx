"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Heart, Sparkles, Trophy, Grid3X3, CircleDot, ArrowRight } from "lucide-react";
import { GameType } from "@/lib/games/types";

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
}

const STAKE_PRESETS = [
  "Winner picks tonight's movie 🍿",
  "15-minute back massage 💆",
  "Loser cooks breakfast tomorrow 🥞",
  "Winner gets an ice cream date 🍦",
  "Winner gets one wish grant ✨",
];

export function NewGameModal({ isOpen, onClose, partnerName }: NewGameModalProps) {
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<GameType>("TIC_TAC_TOE");
  const [whoStarts, setWhoStarts] = useState<"me" | "partner">("me");
  const [stakes, setStakes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleStartGame() {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: selectedGame,
          stakes: stakes.trim() || undefined,
          whoStarts,
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
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedGame("TIC_TAC_TOE")}
              className={`p-3.5 rounded-2xl border text-left flex flex-col transition-all cursor-pointer ${
                selectedGame === "TIC_TAC_TOE"
                  ? "bg-[#E26D54]/15 border-[#E26D54] shadow-[0_0_15px_rgba(226,109,84,0.2)]"
                  : "bg-[#1E1B29] border-[#2E283E] hover:border-[#423A57]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Grid3X3 className="w-5 h-5 text-rose-400" />
                <span className="text-xs">❤️💋</span>
              </div>
              <span className="text-xs font-bold text-[#F6F3EE]">Hearts & Kisses</span>
              <span className="text-[10px] text-[#9992A8] mt-0.5">Classic Tic-Tac-Toe</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedGame("CONNECT_FOUR")}
              className={`p-3.5 rounded-2xl border text-left flex flex-col transition-all cursor-pointer ${
                selectedGame === "CONNECT_FOUR"
                  ? "bg-[#E26D54]/15 border-[#E26D54] shadow-[0_0_15px_rgba(226,109,84,0.2)]"
                  : "bg-[#1E1B29] border-[#2E283E] hover:border-[#423A57]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <CircleDot className="w-5 h-5 text-amber-400" />
                <span className="text-xs">🔴🟡</span>
              </div>
              <span className="text-xs font-bold text-[#F6F3EE]">Four in a Row</span>
              <span className="text-[10px] text-[#9992A8] mt-0.5">Connect Four drops</span>
            </button>
          </div>
        </div>

        {/* 2. Who Starts */}
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

        {/* 3. Playful Stakes */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#F6F3EE] tracking-wide uppercase flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>3. Playful Stakes (Optional)</span>
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
