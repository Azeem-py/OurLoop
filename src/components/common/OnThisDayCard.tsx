"use client";

import { Sparkles, Calendar, Heart } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface OnThisDayCardProps {
  memory?: {
    id: string;
    mediaUrl: string;
    mediaType: "IMAGE" | "VIDEO";
    caption?: string | null;
    createdAt: string | Date;
    author: {
      displayName: string;
      nickname?: string | null;
    };
  } | null;
}

export function OnThisDayCard({ memory }: OnThisDayCardProps) {
  if (!memory) {
    return (
      <div className="rounded-2xl bg-[#171520] border border-[#292536] p-4 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-[#E5B268]/15 flex items-center justify-center text-[#E5B268] shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-[#F6F3EE]">On This Day</h4>
          <p className="text-[11px] text-[#9992A8] leading-tight mt-0.5">
            Keep capturing moments together — your shared memories will blossom right here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Link
      href="/memories"
      className="block relative rounded-2xl overflow-hidden border border-[#292536] bg-[#171520] hover:border-white/20 transition-all shadow-sm group"
    >
      <div className="relative h-44 w-full bg-black/40 overflow-hidden">
        {memory.mediaType === "IMAGE" ? (
          <img
            src={memory.mediaUrl}
            alt={memory.caption || "Memory"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <video
            src={memory.mediaUrl}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#171520] via-[#171520]/40 to-transparent" />

        <div className="absolute top-3 left-3 bg-[#100F17]/80 backdrop-blur-md border border-white/10 text-[#E5B268] text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
          <Sparkles className="w-3 h-3" />
          <span>On this day</span>
        </div>
      </div>

      <div className="p-4 -mt-4 relative z-10">
        <p className="text-xs font-medium text-[#F6F3EE] line-clamp-2 leading-relaxed">
          {memory.caption || "A moment frozen in time"}
        </p>
        <div className="flex items-center justify-between mt-2.5 text-[10px] text-[#9992A8]">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(new Date(memory.createdAt), "MMMM d, yyyy")}
          </span>
          <span>By {memory.author.nickname || memory.author.displayName}</span>
        </div>
      </div>
    </Link>
  );
}
