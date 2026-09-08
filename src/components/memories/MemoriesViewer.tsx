"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Heart,
  MapPin,
  Calendar,
  Plus,
  Sparkles,
  LayoutGrid,
  Film,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import confetti from "canvas-confetti";
import { UploadMemoryModal } from "./UploadMemoryModal";

export interface MemoryItem {
  id: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  caption?: string | null;
  location?: string | null;
  takenAt?: string | Date | null;
  heartsCount: number;
  author: {
    id: string;
    displayName: string;
    nickname?: string | null;
  };
}

interface MemoriesViewerProps {
  initialMemories: MemoryItem[];
}

export function MemoriesViewer({ initialMemories }: MemoriesViewerProps) {
  const [memories, setMemories] = useState<MemoryItem[]>(initialMemories);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [viewMode, setViewMode] = useState<"swipe" | "grid">("swipe");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [lightboxMemory, setLightboxMemory] = useState<MemoryItem | null>(null);
  const [burstingHeart, setBurstingHeart] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [lastTap, setLastTap] = useState<{ [id: string]: number }>({});

  async function reloadMemories() {
    try {
      const res = await fetch("/api/memories");
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories);
      }
    } catch (err) {
      console.error(err);
    }
  }

  const handleNext = useCallback(() => {
    if (currentIndex < memories.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
      setHasInteracted(true);
    }
  }, [currentIndex, memories.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
      setHasInteracted(true);
    }
  }, [currentIndex]);

  // Keyboard navigation support
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (viewMode !== "swipe") return;
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, viewMode]);

  function handleTap(memoryId: string) {
    const now = Date.now();
    const prev = lastTap[memoryId] || 0;

    if (now - prev < 350) {
      heartMemory(memoryId);
      triggerHeartBurst(memoryId);
    }
    setLastTap({ ...lastTap, [memoryId]: now });
  }

  async function heartMemory(memoryId: string) {
    try {
      setMemories((prev) =>
        prev.map((m) => (m.id === memoryId ? { ...m, heartsCount: m.heartsCount + 1 } : m))
      );
      if (lightboxMemory && lightboxMemory.id === memoryId) {
        setLightboxMemory((prev) =>
          prev ? { ...prev, heartsCount: prev.heartsCount + 1 } : null
        );
      }
      await fetch(`/api/memories/${memoryId}/heart`, { method: "POST" });
    } catch (err) {
      console.error(err);
    }
  }

  function triggerHeartBurst(memoryId: string) {
    setBurstingHeart(memoryId);
    setTimeout(() => setBurstingHeart(null), 900);

    try {
      confetti({
        particleCount: 32,
        spread: 65,
        origin: { y: 0.6 },
        colors: ["#E26D54", "#E5B268", "#F6F3EE"],
        ticks: 120,
        gravity: 1.2,
        shapes: ["circle"],
        scalar: 0.9,
      });
    } catch {
      // Ignore canvas errors on low-spec/legacy devices
    }
  }

  const currentMemory = memories[currentIndex] || null;
  const nextMemory = memories[currentIndex + 1] || null;
  const prevMemory = memories[currentIndex - 1] || null;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0E0D13] overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="px-3.5 sm:px-8 py-3 sm:py-3.5 border-b border-[#242031] flex items-center justify-between gap-2.5 sm:gap-4 shrink-0 bg-[#0E0D13] z-20">
        <div className="min-w-0 shrink">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[#F6F3EE] font-serif whitespace-nowrap">
              Our Memories
            </h2>
            {memories.length > 0 && viewMode === "swipe" && (
              <span className="text-[11px] font-mono text-[#9992A8] bg-[#171520] border border-[#292536] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                {currentIndex + 1} / {memories.length}
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-[#9992A8] mt-0.5 whitespace-nowrap truncate">
            {memories.length === 0
              ? "Your private story album"
              : `${memories.length} ${memories.length === 1 ? "moment" : "moments"} captured together`}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Mode Switcher */}
          <div className="flex items-center bg-[#171520] border border-[#292536] p-0.5 sm:p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode("swipe")}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                viewMode === "swipe"
                  ? "bg-[#221F2D] text-[#F6F3EE] font-medium shadow-sm"
                  : "text-[#9992A8] hover:text-[#F6F3EE]"
              }`}
              title="Interactive Card Deck"
            >
              <Film className="w-3.5 h-3.5 text-[#E26D54] shrink-0" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                viewMode === "grid"
                  ? "bg-[#221F2D] text-[#F6F3EE] font-medium shadow-sm"
                  : "text-[#9992A8] hover:text-[#F6F3EE]"
              }`}
              title="Gallery Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#E5B268] shrink-0" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 py-2 px-3 sm:px-3.5 rounded-xl bg-[#E26D54] hover:bg-[#D05E46] text-[#0E0D13] font-bold text-xs whitespace-nowrap shrink-0 shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span>
              Add<span className="hidden sm:inline"> memory</span>
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {memories.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#171520] border border-[#292536] flex items-center justify-center text-[#E5B268] mb-4 shadow-sm">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#F6F3EE] font-serif">No memories posted yet</h3>
          <p className="text-xs text-[#9992A8] max-w-xs mt-1 mb-6 leading-relaxed">
            This space is waiting for your very first photo or video together. Tap below to capture a moment.
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="py-2.5 px-5 rounded-xl bg-[#E26D54] hover:bg-[#D05E46] text-[#0E0D13] font-bold text-xs shadow-sm transition-all"
          >
            Post the first memory
          </button>
        </div>
      ) : viewMode === "swipe" ? (
        /* ==================== INTERACTIVE HORIZONTAL SWIPE DECK ==================== */
        <div className="flex-1 flex flex-col justify-between items-center p-3 sm:p-6 overflow-hidden relative">
          {/* Top Story Progress Pills */}
          <div className="w-full max-w-md sm:max-w-xl flex items-center gap-1.5 px-2 mb-2 z-10">
            {memories.map((m, idx) => (
              <button
                key={m.id}
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                  setHasInteracted(true);
                }}
                className="flex-1 h-1.5 rounded-full overflow-hidden transition-all duration-300 relative bg-white/10 hover:bg-white/20"
                title={`Jump to moment ${idx + 1}`}
              >
                {idx === currentIndex && (
                  <motion.div
                    layoutId="active-pill"
                    className="w-full h-full bg-[#E26D54]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                {idx < currentIndex && <div className="w-full h-full bg-white/30" />}
              </button>
            ))}
          </div>

          {/* Center Card Stage */}
          <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl flex-1 flex items-center justify-center min-h-[380px] max-h-[620px] my-auto">
            {/* Previous Ghost Card (shows behind when available) */}
            {prevMemory && (
              <div
                onClick={handlePrev}
                className="hidden sm:block absolute left-2 lg:-left-8 top-1/2 -translate-y-1/2 w-[85%] h-[88%] rounded-3xl bg-[#14121A] border border-[#242031] opacity-40 -rotate-3 scale-95 shadow-xl cursor-pointer pointer-events-auto transition-transform hover:-translate-x-2"
              >
                <div className="w-full h-full rounded-3xl overflow-hidden filter blur-[1px]">
                  {prevMemory.mediaType === "IMAGE" ? (
                    <img
                      src={prevMemory.mediaUrl}
                      alt="Previous"
                      className="w-full h-full object-cover opacity-60"
                    />
                  ) : (
                    <div className="w-full h-full bg-black/60" />
                  )}
                </div>
              </div>
            )}

            {/* Next Ghost Card (shows behind when available) */}
            {nextMemory && (
              <div
                onClick={handleNext}
                className="hidden sm:block absolute right-2 lg:-right-8 top-1/2 -translate-y-1/2 w-[85%] h-[88%] rounded-3xl bg-[#14121A] border border-[#242031] opacity-40 rotate-3 scale-95 shadow-xl cursor-pointer pointer-events-auto transition-transform hover:translate-x-2"
              >
                <div className="w-full h-full rounded-3xl overflow-hidden filter blur-[1px]">
                  {nextMemory.mediaType === "IMAGE" ? (
                    <img
                      src={nextMemory.mediaUrl}
                      alt="Next"
                      className="w-full h-full object-cover opacity-60"
                    />
                  ) : (
                    <div className="w-full h-full bg-black/60" />
                  )}
                </div>
              </div>
            )}

            {/* Main Active Swipeable Card */}
            <AnimatePresence custom={direction} mode="wait">
              {currentMemory && (
                <motion.div
                  key={currentMemory.id}
                  custom={direction}
                  initial={{
                    x: direction * 260,
                    opacity: 0,
                    scale: 0.92,
                    rotate: direction * 8,
                  }}
                  animate={{
                    x: 0,
                    opacity: 1,
                    scale: 1,
                    rotate: 0,
                  }}
                  exit={{
                    x: -direction * 260,
                    opacity: 0,
                    scale: 0.92,
                    rotate: -direction * 8,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 24,
                  }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.7}
                  onDragEnd={(e, { offset, velocity }) => {
                    const swipeThreshold = 60;
                    if (offset.x < -swipeThreshold || velocity.x < -300) {
                      handleNext();
                    } else if (offset.x > swipeThreshold || velocity.x > 300) {
                      handlePrev();
                    }
                  }}
                  onClick={() => handleTap(currentMemory.id)}
                  className="relative w-full h-full rounded-3xl overflow-hidden bg-[#171520] border border-[#292536] shadow-2xl flex flex-col cursor-grab active:cursor-grabbing z-10 select-none group"
                >
                  {/* Media Content */}
                  <div className="relative w-full flex-1 bg-black overflow-hidden flex items-center justify-center">
                    {currentMemory.mediaType === "IMAGE" ? (
                      <img
                        src={currentMemory.mediaUrl}
                        alt={currentMemory.caption || "Memory"}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    ) : (
                      <video
                        src={currentMemory.mediaUrl}
                        className="w-full h-full object-cover pointer-events-none"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    )}

                    {/* Gradient Overlay for bottom text legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />

                    {/* Ping burst animation when double-tapped */}
                    {burstingHeart === currentMemory.id && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                        <Heart className="w-24 h-24 text-[#E26D54] fill-[#E26D54] animate-ping" />
                      </div>
                    )}

                    {/* Top Corner Controls */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
                      {/* Media badge */}
                      <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/90 text-[10px] font-medium flex items-center gap-1">
                        {currentMemory.mediaType === "VIDEO" ? "Video Reel" : "Photograph"}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Lightbox button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxMemory(currentMemory);
                          }}
                          className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-black/80 transition-colors"
                          title="Full Screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Heart Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            heartMemory(currentMemory.id);
                            triggerHeartBurst(currentMemory.id);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs hover:bg-black/80 transition-colors"
                        >
                          <Heart
                            className={`w-4 h-4 transition-colors ${
                              currentMemory.heartsCount > 0
                                ? "text-[#E26D54] fill-[#E26D54]"
                                : "text-white"
                            }`}
                          />
                          <span className="font-semibold text-xs">{currentMemory.heartsCount}</span>
                        </button>
                      </div>
                    </div>

                    {/* Bottom Info Overlay */}
                    <div className="absolute bottom-0 inset-x-0 p-5 z-20 text-left pointer-events-none">
                      {currentMemory.caption && (
                        <p className="text-sm sm:text-base font-medium text-[#F6F3EE] drop-shadow-md leading-snug mb-2.5">
                          {currentMemory.caption}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#F6F3EE]/90">
                        <span className="bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 font-medium">
                          By {currentMemory.author.nickname || currentMemory.author.displayName}
                        </span>

                        {currentMemory.takenAt && (
                          <span className="bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#E5B268]" />
                            {format(new Date(currentMemory.takenAt), "MMM d, yyyy")}
                          </span>
                        )}

                        {currentMemory.location && (
                          <span className="bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#E26D54]" />
                            {currentMemory.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Desktop Left Nav Button */}
            {currentIndex > 0 && (
              <button
                onClick={handlePrev}
                className="hidden sm:flex absolute -left-5 lg:-left-7 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#171520] border border-[#292536] text-[#F6F3EE] hover:bg-[#E26D54] hover:text-[#0E0D13] items-center justify-center shadow-2xl transition-all z-20 hover:scale-110"
                title="Previous Memory (Left Arrow)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Desktop Right Nav Button */}
            {currentIndex < memories.length - 1 && (
              <button
                onClick={handleNext}
                className="hidden sm:flex absolute -right-5 lg:-right-7 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#171520] border border-[#292536] text-[#F6F3EE] hover:bg-[#E26D54] hover:text-[#0E0D13] items-center justify-center shadow-2xl transition-all z-20 hover:scale-110"
                title="Next Memory (Right Arrow)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* ==================== PLAYFUL ANIMATED SWIPE INDICATOR ==================== */}
          <div className="w-full max-w-sm flex flex-col items-center justify-center pt-3 pb-1 z-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-2 select-none"
            >
              {/* Dynamic Animated Gliding Indicator */}
              <div className="relative px-4 py-1.5 rounded-full bg-[#171520]/90 border border-white/10 backdrop-blur-md shadow-xl flex items-center gap-3">
                {/* Left oscillating chevron */}
                <motion.span
                  animate={{ x: [-2, -6, -2], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className={`text-xs font-bold ${
                    currentIndex > 0 ? "text-[#E5B268]" : "text-white/20"
                  }`}
                >
                  ‹
                </motion.span>

                {/* Gliding Heart Puck on Dash Track */}
                <div className="relative w-20 h-5 flex items-center justify-center">
                  <div className="absolute inset-x-0 h-[2px] bg-white/10 rounded-full" />
                  <motion.div
                    animate={{
                      x: [-24, 24, -24],
                      scale: [1, 1.15, 1],
                      rotate: [-8, 8, -8],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.4,
                      ease: "easeInOut",
                    }}
                    className="relative z-10 w-5 h-5 rounded-full bg-[#E26D54] flex items-center justify-center shadow-[0_0_14px_rgba(226,109,84,0.7)]"
                  >
                    <Heart className="w-2.5 h-2.5 text-[#0E0D13] fill-[#0E0D13]" />
                  </motion.div>
                </div>

                {/* Right oscillating chevron */}
                <motion.span
                  animate={{ x: [2, 6, 2], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className={`text-xs font-bold ${
                    currentIndex < memories.length - 1 ? "text-[#E5B268]" : "text-white/20"
                  }`}
                >
                  ›
                </motion.span>
              </div>

              {/* Helpful hint text */}
              <div className="flex items-center gap-2 text-[11px] text-[#9992A8] font-medium">
                <span>{hasInteracted ? "Swipe to turn memories" : "Swipe left / right to explore"}</span>
                <span className="text-white/30">•</span>
                <span className="text-[#E5B268]">Double tap to ❤️</span>
              </div>
            </motion.div>
          </div>
        </div>
      ) : (
        /* ==================== GALLERY GRID VIEW ==================== */
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 no-scrollbar">
          <div className="max-w-6xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {memories.map((mem, idx) => {
              const isBursting = burstingHeart === mem.id;
              return (
                <div
                  key={mem.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setViewMode("swipe");
                  }}
                  className="group relative rounded-2xl overflow-hidden bg-[#171520] border border-[#292536] hover:border-white/25 transition-all shadow-sm flex flex-col cursor-pointer"
                >
                  <div className="relative aspect-[4/3] w-full bg-black/50 overflow-hidden">
                    {mem.mediaType === "IMAGE" ? (
                      <img
                        src={mem.mediaUrl}
                        alt={mem.caption || "Memory"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <video
                        src={mem.mediaUrl}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                      />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 opacity-80 group-hover:opacity-95 transition-opacity" />

                    {isBursting && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                        <Heart className="w-16 h-16 text-[#E26D54] fill-[#E26D54] animate-ping" />
                      </div>
                    )}

                    <div className="absolute top-3 right-3 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          heartMemory(mem.id);
                          triggerHeartBurst(mem.id);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white text-xs hover:bg-black/80 transition-colors"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 transition-colors ${
                            mem.heartsCount > 0
                              ? "text-[#E26D54] fill-[#E26D54]"
                              : "text-white/80"
                          }`}
                        />
                        <span className="text-[11px] font-medium">{mem.heartsCount}</span>
                      </button>
                    </div>

                    {mem.mediaType === "VIDEO" && (
                      <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white/90 text-[10px] font-medium">
                        Video
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <p className="text-xs sm:text-sm font-medium text-[#F6F3EE] line-clamp-2 leading-relaxed">
                      {mem.caption || "A cherished moment"}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#242031] text-[11px] text-[#9992A8]">
                      <span className="truncate">
                        By {mem.author.nickname || mem.author.displayName}
                      </span>
                      {mem.takenAt && (
                        <span className="shrink-0 ml-2">
                          {format(new Date(mem.takenAt), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxMemory && (
        <div
          onClick={() => setLightboxMemory(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <button
            onClick={() => setLightboxMemory(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-50"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[90vh] bg-[#171520] border border-[#292536] rounded-3xl overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="relative max-h-[65vh] bg-black flex items-center justify-center overflow-hidden">
              {lightboxMemory.mediaType === "IMAGE" ? (
                <img
                  src={lightboxMemory.mediaUrl}
                  alt={lightboxMemory.caption || "Memory"}
                  className="max-h-[65vh] w-auto object-contain"
                />
              ) : (
                <video
                  src={lightboxMemory.mediaUrl}
                  controls
                  autoPlay
                  className="max-h-[65vh] w-auto object-contain"
                />
              )}
            </div>

            <div className="p-5 flex items-center justify-between border-t border-[#242031]">
              <div className="space-y-1 max-w-lg">
                <p className="text-sm font-medium text-[#F6F3EE]">
                  {lightboxMemory.caption || "A cherished moment"}
                </p>
                <div className="flex items-center gap-3 text-xs text-[#9992A8]">
                  <span>By {lightboxMemory.author.nickname || lightboxMemory.author.displayName}</span>
                  {lightboxMemory.takenAt && (
                    <span>{format(new Date(lightboxMemory.takenAt), "MMMM d, yyyy")}</span>
                  )}
                  {lightboxMemory.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#E26D54]" />
                      {lightboxMemory.location}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  heartMemory(lightboxMemory.id);
                  triggerHeartBurst(lightboxMemory.id);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#201D2B] border border-white/[0.08] hover:bg-[#282436] text-[#F6F3EE] transition-colors"
              >
                <Heart
                  className={`w-4 h-4 ${
                    lightboxMemory.heartsCount > 0
                      ? "text-[#E26D54] fill-[#E26D54]"
                      : "text-white"
                  }`}
                />
                <span className="text-xs font-semibold">{lightboxMemory.heartsCount}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <UploadMemoryModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={reloadMemories}
      />
    </div>
  );
}
