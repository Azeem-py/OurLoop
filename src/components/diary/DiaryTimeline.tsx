"use client";

import { useState } from "react";
import { Plus, Calendar, Lock, BookOpen, X, Maximize2 } from "lucide-react";
import { format } from "date-fns";
import { DiaryComposeModal } from "./DiaryComposeModal";

export interface DiaryEntryItem {
  id: string;
  title?: string | null;
  content: string;
  mood?: string | null;
  imageUrl?: string | null;
  visibility: "SHARED" | "PRIVATE_UNTIL";
  revealAt?: string | Date | null;
  createdAt: string | Date;
  isLocked?: boolean;
  author: {
    id: string;
    displayName: string;
    nickname?: string | null;
  };
}

interface DiaryTimelineProps {
  initialEntries: DiaryEntryItem[];
  currentUserId: string;
}

export function DiaryTimeline({ initialEntries, currentUserId }: DiaryTimelineProps) {
  const [entries, setEntries] = useState<DiaryEntryItem[]>(initialEntries);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  async function reloadEntries() {
    try {
      const res = await fetch("/api/diary");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#0E0D13]">
      {/* Top action header */}
      <div className="p-4 sm:px-8 py-5 flex items-center justify-between border-b border-[#242031] max-w-5xl mx-auto w-full shrink-0">
        <div>
          <h2 className="text-lg font-bold text-[#F6F3EE] font-serif">Our Joint Diary</h2>
          <p className="text-xs text-[#9992A8] mt-0.5">Our shared thoughts, reflections and milestones</p>
        </div>

        <button
          onClick={() => setIsComposeOpen(true)}
          className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-[#E26D54] hover:bg-[#D05E46] text-[#0E0D13] font-bold text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Write note</span>
        </button>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 no-scrollbar max-w-5xl mx-auto w-full">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#171520] border border-[#292536] flex items-center justify-center text-[#E26D54] mb-3 shadow-sm">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#F6F3EE]">Nothing written yet</h4>
            <p className="text-xs text-[#9992A8] max-w-xs mt-1 mb-5 leading-relaxed">
              Start today’s entry — tell your partner what you did today or what you love about them.
            </p>
            <button
              onClick={() => setIsComposeOpen(true)}
              className="py-2.5 px-5 rounded-xl bg-[#E26D54] hover:bg-[#D05E46] text-[#0E0D13] text-xs font-bold shadow-sm transition-all"
            >
              Write today’s entry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {entries.map((entry) => {
              const isAuthor = entry.author.id === currentUserId;
              return (
                <article
                  key={entry.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    entry.isLocked
                      ? "bg-[#171520] border-[#E5B268]/40 shadow-sm"
                      : "bg-[#171520] border-[#292536] hover:border-white/20 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      {entry.mood && (
                        <span className="text-base bg-[#100F17] w-8 h-8 rounded-xl flex items-center justify-center border border-[#292536]">
                          {entry.mood}
                        </span>
                      )}
                      <div>
                        <h4 className="text-xs font-semibold text-[#F6F3EE]">
                          {entry.title || (isAuthor ? "Journal entry" : `${entry.author.nickname || entry.author.displayName}'s entry`)}
                        </h4>
                        <p className="text-[10px] text-[#9992A8] flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-[#9992A8]" />
                          {format(new Date(entry.createdAt), "EEEE, MMM d, yyyy")}
                        </p>
                      </div>
                    </div>

                    {entry.isLocked ? (
                      <span className="text-[10px] bg-[#E5B268]/15 text-[#E5B268] px-2.5 py-0.5 rounded-full border border-[#E5B268]/30 flex items-center gap-1 font-medium">
                        <Lock className="w-3 h-3" />
                        Secret lock
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#9992A8] bg-[#100F17] border border-white/[0.05] px-2 py-0.5 rounded-full">
                        {isAuthor ? "You" : entry.author.nickname || entry.author.displayName}
                      </span>
                    )}
                  </div>

                  {/* Attached Image */}
                  {entry.imageUrl && !entry.isLocked && (
                    <div
                      onClick={() => setZoomedImage(entry.imageUrl!)}
                      className="mt-3 mb-3 relative rounded-xl overflow-hidden border border-[#292536] bg-black/40 group cursor-pointer"
                    >
                      <img
                        src={entry.imageUrl}
                        alt={entry.title || "Diary attachment"}
                        className="w-full max-h-72 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                      <div className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )}

                  <div className="mt-2">
                    <p className="text-xs sm:text-sm text-[#F6F3EE]/90 leading-relaxed whitespace-pre-wrap">
                      {entry.content}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Full-Screen Zoom Modal */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={zoomedImage}
            alt="Enlarged view"
            className="max-w-full max-h-[88vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}

      {/* Compose Modal */}
      <DiaryComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSuccess={reloadEntries}
      />
    </div>
  );
}
