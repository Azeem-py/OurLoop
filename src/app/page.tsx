import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { CountdownWidget } from "@/components/common/CountdownWidget";
import { OnThisDayCard } from "@/components/common/OnThisDayCard";
import { listMemories, getOnThisDayItem } from "@/lib/db/memories";
import { listDiaryEntries } from "@/lib/db/diary";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Sparkles, BookOpen, ArrowRight, Camera, Gamepad2 } from "lucide-react";
import { format } from "date-fns";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.coupleId) {
    redirect("/pair");
  }

  const [memories, onThisDay, diaryEntries, pendingTurnGame] = await Promise.all([
    listMemories(user.coupleId),
    getOnThisDayItem(user.coupleId),
    listDiaryEntries(user.coupleId, user.id),
    prisma.gameSession.findFirst({
      where: {
        coupleId: user.coupleId,
        status: "IN_PROGRESS",
        currentTurnUserId: user.id,
      },
      orderBy: { lastMoveAt: "desc" },
    }),
  ]);

  const latestMemory = memories[0] || null;
  const latestDiary = diaryEntries[0] || null;

  return (
    <AppShell
      user={{
        displayName: user.displayName,
        nickname: user.nickname,
      }}
      partner={user.partner}
      inviteCode={user.couple?.inviteCode}
    >
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 no-scrollbar">
        <div className="max-w-5xl xl:max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Hero Milestone & Key Countdown */}
          <div className="lg:col-span-7 space-y-6">
            <CountdownWidget
              anniversaryDate={user.couple?.anniversaryDate?.toISOString()}
              nextVisitDate={user.couple?.nextVisitDate?.toISOString()}
            />

            {pendingTurnGame && (
              <Link
                href={`/games/${pendingTurnGame.id}`}
                className="block p-4 rounded-3xl bg-gradient-to-r from-[#E26D54]/20 via-[#1E1929] to-[#171520] border border-[#E26D54]/50 hover:border-[#E26D54] shadow-[0_0_20px_rgba(226,109,84,0.2)] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#E26D54] text-white flex items-center justify-center shadow-md shadow-[#E26D54]/30 animate-pulse">
                      <Gamepad2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#F6F3EE]">
                          It&apos;s Your Turn!
                        </span>
                        <span className="text-[10px] bg-[#E26D54]/30 text-[#E26D54] font-bold px-2 py-0.5 rounded-full border border-[#E26D54]/40">
                          Active Match
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9992A8] mt-0.5">
                        {pendingTurnGame.gameType === "TIC_TAC_TOE" ? "Hearts & Kisses" : "Four in a Row"}
                        {pendingTurnGame.stakes && ` • Stakes: ${pendingTurnGame.stakes}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-[#E26D54] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Play Move</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            )}

            {/* Latest Diary Entry Excerpt */}
            <div className="rounded-3xl bg-[#171520] border border-[#292536] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#E5B268]" />
                  <h3 className="text-xs font-bold text-[#F6F3EE] uppercase tracking-wider">
                    From Our Diary
                  </h3>
                </div>
                <Link
                  href="/diary"
                  className="text-xs text-[#E5B268] hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Open diary</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {latestDiary ? (
                <Link
                  href="/diary"
                  className="block p-4 rounded-2xl bg-[#121018] border border-[#292536] hover:border-[#E5B268]/40 transition-all"
                >
                  <div className="flex items-center justify-between text-[11px] text-[#9992A8] mb-2">
                    <span className="font-medium text-[#F6F3EE]/80">
                      By {latestDiary.author.nickname || latestDiary.author.displayName}
                    </span>
                    <span>{format(new Date(latestDiary.createdAt), "MMM d, yyyy")}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#F6F3EE]/90 line-clamp-3 leading-relaxed">
                    {latestDiary.content}
                  </p>
                </Link>
              ) : (
                <Link
                  href="/diary"
                  className="py-6 border-2 border-dashed border-[#292536] rounded-2xl flex flex-col items-center justify-center text-center text-[#9992A8] hover:border-[#E5B268]/40 transition-colors"
                >
                  <span className="text-xs font-medium">Nothing written yet — start today&apos;s entry</span>
                </Link>
              )}
            </div>
          </div>

          {/* Right Column: Visual Nostalgia & Latest Moments */}
          <div className="lg:col-span-5 space-y-6">
            {/* On This Day Nostalgia Card */}
            <OnThisDayCard memory={onThisDay as any} />

            {/* Latest Memories Preview */}
            <div className="rounded-3xl bg-[#171520] border border-[#292536] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#E26D54]" />
                  <h3 className="text-xs font-bold text-[#F6F3EE] uppercase tracking-wider">
                    Latest Memory
                  </h3>
                </div>
                <Link
                  href="/memories"
                  className="text-xs text-[#E26D54] hover:underline flex items-center gap-1 font-medium"
                >
                  <span>View gallery</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {latestMemory ? (
                <Link
                  href="/memories"
                  className="block relative rounded-2xl overflow-hidden aspect-[16/10] bg-black group shadow-sm"
                >
                  {latestMemory.mediaType === "IMAGE" ? (
                    <img
                      src={latestMemory.mediaUrl}
                      alt={latestMemory.caption || "Memory"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <video
                      src={latestMemory.mediaUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                    <p className="text-xs sm:text-sm font-medium text-white line-clamp-1">
                      {latestMemory.caption || "A cherished moment"}
                    </p>
                  </div>
                </Link>
              ) : (
                <Link
                  href="/memories"
                  className="py-8 border-2 border-dashed border-[#292536] rounded-2xl flex flex-col items-center justify-center text-center text-[#9992A8] hover:border-[#E26D54]/40 transition-colors"
                >
                  <Camera className="w-6 h-6 mb-1.5 text-[#E26D54]" />
                  <span className="text-xs font-medium">Add your first photo together</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
