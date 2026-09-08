"use client";

import { WhosMostLikelyState } from "@/lib/games/types";
import { Check, Heart, Sparkles, User, HelpCircle } from "lucide-react";

interface WhosMostLikelyBoardProps {
  gameState: WhosMostLikelyState;
  currentUserId: string;
  currentUser: { id: string; displayName: string; nickname?: string | null; avatarUrl?: string | null };
  partner: { id: string; displayName: string; nickname?: string | null; avatarUrl?: string | null };
  isGameOver: boolean;
  onVote: (questionIndex: number, votedUserId: string) => void;
  disabled?: boolean;
}

export function WhosMostLikelyBoard({
  gameState,
  currentUserId,
  currentUser,
  partner,
  isGameOver,
  onVote,
  disabled,
}: WhosMostLikelyBoardProps) {
  const currentQIndex = gameState.currentQuestionIndex;
  const currentQuestion = gameState.questions[currentQIndex];
  const votesForCurrentQ = gameState.votes[currentQIndex] || {};

  const myVote = votesForCurrentQ[currentUserId];
  const partnerVote = votesForCurrentQ[partner.id];
  const isQuestionRevealed = Boolean(myVote && partnerVote);

  const myName = currentUser.nickname || currentUser.displayName || "You";
  const partnerName = partner.nickname || partner.displayName || "Partner";

  // Score calculations
  const totalQuestions = gameState.questions.length;
  const matchCount = gameState.agreementCount;
  const synergyPercent = Math.round((matchCount / Math.max(totalQuestions, 1)) * 100);

  // If game is completed, show the full celebration & review screen
  if (isGameOver || gameState.isComplete) {
    return (
      <div className="w-full max-w-md mx-auto space-y-5 animate-in fade-in">
        {/* Synergy Result Card */}
        <div className="rounded-3xl bg-gradient-to-br from-[#1F192C] to-[#151221] border border-[#342A4B] p-6 text-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-3 shadow-lg">
            <Heart className="w-8 h-8 fill-rose-500" />
          </div>

          <span className="text-[11px] uppercase tracking-wider font-bold text-rose-400">
            Compatibility Result
          </span>
          <h3 className="text-3xl font-extrabold text-[#F6F3EE] mt-1">
            {synergyPercent}% Synergy
          </h3>
          <p className="text-xs text-[#9992A8] mt-1 font-medium">
            {matchCount} out of {totalQuestions} identical answers!
          </p>

          <p className="text-xs text-amber-300 font-medium mt-3 bg-amber-500/10 border border-amber-500/20 py-2 px-3 rounded-xl inline-block">
            {synergyPercent >= 80
              ? "✨ Deeply in sync! You two read each other like an open book."
              : synergyPercent >= 60
              ? "💛 Beautiful harmony! Great minds think alike."
              : "😂 Playful contrasts! Opposites attract in the best ways."}
          </p>
        </div>

        {/* Question by question breakdown */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-[#F6F3EE] uppercase tracking-wider px-1">
            Question Breakdown
          </h4>
          {gameState.questions.map((q, idx) => {
            const votes = gameState.votes[idx] || {};
            const userVoted = votes[currentUserId];
            const partnerVoted = votes[partner.id];
            const isMatch = userVoted && partnerVoted && userVoted === partnerVoted;

            const userPickedName = userVoted === currentUserId ? myName : partnerName;
            const partnerPickedName = partnerVoted === partner.id ? partnerName : myName;

            return (
              <div
                key={q.id}
                className="p-3.5 rounded-2xl bg-[#171422] border border-[#272136] text-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-[#F6F3EE] leading-snug">
                    {idx + 1}. {q.prompt}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      isMatch
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                        : "bg-white/5 text-[#9992A8] border border-white/10"
                    }`}
                  >
                    {isMatch ? "Match 💕" : "Mismatch"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#9992A8] pt-1 border-t border-[#231E30]">
                  <span>
                    You: <strong className="text-[#F6F3EE]">{userPickedName}</strong>
                  </span>
                  <span>
                    {partnerName}: <strong className="text-[#F6F3EE]">{partnerPickedName}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-5">
      {/* Question Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-[#9992A8]">
          <span>
            Question {currentQIndex + 1} of {totalQuestions}
          </span>
          <span className="text-[#E26D54] font-bold">Who&apos;s Most Likely</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 h-1.5">
          {Array.from({ length: totalQuestions }).map((_, idx) => (
            <div
              key={idx}
              className={`h-full rounded-full transition-all ${
                idx < currentQIndex
                  ? "bg-[#E26D54]"
                  : idx === currentQIndex
                  ? "bg-[#E26D54]/50"
                  : "bg-[#252033]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Question Card */}
      <div className="rounded-3xl bg-[#171422] border border-[#2B243B] p-5 sm:p-6 text-center shadow-xl space-y-3 relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E26D54]/10 text-[#E26D54] text-[11px] font-semibold">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Tap who you think fits best</span>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-[#F6F3EE] leading-relaxed">
          &ldquo;{currentQuestion.prompt}&rdquo;
        </h3>

        {/* Voting Options: Left Card (You) vs Right Card (Partner) */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Pick User */}
          <button
            type="button"
            disabled={disabled || Boolean(myVote)}
            onClick={() => onVote(currentQIndex, currentUserId)}
            className={`p-4 rounded-2xl border flex flex-col items-center gap-2.5 transition-all cursor-pointer ${
              myVote === currentUserId
                ? "bg-[#E26D54]/20 border-[#E26D54] shadow-[0_0_15px_rgba(226,109,84,0.2)]"
                : myVote
                ? "bg-[#14121D] border-[#221D2E] opacity-50 cursor-not-allowed"
                : "bg-[#1E1A29] border-[#2E273F] hover:border-[#E26D54] hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-[#272136] border border-white/10 flex items-center justify-center text-sm font-bold text-[#F6F3EE] overflow-hidden">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={myName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-[#9992A8]" />
              )}
            </div>
            <span className="text-xs font-bold text-[#F6F3EE]">{myName}</span>
            {myVote === currentUserId && (
              <span className="text-[10px] text-[#E26D54] font-semibold flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" /> Your Pick
              </span>
            )}
          </button>

          {/* Pick Partner */}
          <button
            type="button"
            disabled={disabled || Boolean(myVote)}
            onClick={() => onVote(currentQIndex, partner.id)}
            className={`p-4 rounded-2xl border flex flex-col items-center gap-2.5 transition-all cursor-pointer ${
              myVote === partner.id
                ? "bg-[#E26D54]/20 border-[#E26D54] shadow-[0_0_15px_rgba(226,109,84,0.2)]"
                : myVote
                ? "bg-[#14121D] border-[#221D2E] opacity-50 cursor-not-allowed"
                : "bg-[#1E1A29] border-[#2E273F] hover:border-[#E26D54] hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-[#272136] border border-white/10 flex items-center justify-center text-sm font-bold text-amber-400 overflow-hidden">
              {partner.avatarUrl ? (
                <img src={partner.avatarUrl} alt={partnerName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-[#9992A8]" />
              )}
            </div>
            <span className="text-xs font-bold text-[#F6F3EE]">{partnerName}</span>
            {myVote === partner.id && (
              <span className="text-[10px] text-[#E26D54] font-semibold flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" /> Your Pick
              </span>
            )}
          </button>
        </div>

        {/* Real-time Status below buttons */}
        <div className="pt-2">
          {myVote && !partnerVote ? (
            <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 py-2 px-3 rounded-xl inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>You voted! Waiting for {partnerName} to vote...</span>
            </div>
          ) : !myVote && partnerVote ? (
            <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 py-2 px-3 rounded-xl inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{partnerName} has voted! Cast your vote to see the match!</span>
            </div>
          ) : isQuestionRevealed ? (
            <div className="text-xs text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 py-2 px-3 rounded-xl inline-flex items-center gap-1.5 animate-in zoom-in-95">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {myVote === partnerVote
                  ? "It's a Match! You both chose the same! 🎉"
                  : "Votes locked in! Moving to next question..."}
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-[#7E778E]">Both of your answers are hidden until you both vote!</p>
          )}
        </div>
      </div>
    </div>
  );
}
