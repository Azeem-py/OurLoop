"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Gamepad2, MessageCircle, X, ChevronRight } from "lucide-react";

interface ActiveNotification {
  id: string;
  type: "CHAT" | "GAME_TURN";
  title: string;
  subtitle: string;
  linkUrl: string;
  badge?: string;
}

export function InAppNotifier() {
  const router = useRouter();
  const pathname = usePathname();

  const [notification, setNotification] = useState<ActiveNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Baseline tracking to prevent re-notifying already acknowledged items
  const isFirstPollRef = useRef(true);
  const lastSeenMessageIdRef = useRef<string | null>(null);
  const lastSeenGameTurnKeyRef = useRef<string | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = (notif: ActiveNotification) => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    setNotification(notif);
    setIsVisible(true);

    // Auto dismiss after 6.5s
    dismissTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setNotification(null), 300);
    }, 6500);
  };

  const handleDismiss = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    setIsVisible(false);
    setTimeout(() => setNotification(null), 300);
  };

  const handleClickNotification = () => {
    if (!notification) return;
    const targetUrl = notification.linkUrl;
    handleDismiss();
    router.push(targetUrl);
  };

  useEffect(() => {
    async function checkNotifications() {
      try {
        const res = await fetch("/api/notifications/poll");
        if (!res.ok) return;
        const data = await res.json();

        const { latestMessage, activeTurnGame } = data;

        // On very first poll, initialize baseline without annoying popups
        if (isFirstPollRef.current) {
          isFirstPollRef.current = false;
          if (latestMessage) lastSeenMessageIdRef.current = latestMessage.id;
          if (activeTurnGame) {
            lastSeenGameTurnKeyRef.current = `${activeTurnGame.id}-${activeTurnGame.lastMoveAt}`;
          }
          return;
        }

        // 1. Check Game Turn
        if (activeTurnGame) {
          const gameTurnKey = `${activeTurnGame.id}-${activeTurnGame.lastMoveAt}`;
          const isCurrentlyInThisGame = pathname === `/games/${activeTurnGame.id}`;

          if (gameTurnKey !== lastSeenGameTurnKeyRef.current) {
            lastSeenGameTurnKeyRef.current = gameTurnKey;

            if (!isCurrentlyInThisGame) {
              const gameLabel =
                activeTurnGame.gameType === "TIC_TAC_TOE"
                  ? "Hearts & Kisses"
                  : "Four in a Row";

              showNotification({
                id: `game-${activeTurnGame.id}-${Date.now()}`,
                type: "GAME_TURN",
                title: "It's Your Turn! 🎮",
                subtitle: `${activeTurnGame.initiatorName} is waiting in ${gameLabel}. Tap to play!`,
                linkUrl: `/games/${activeTurnGame.id}`,
                badge: gameLabel,
              });
              return; // Show game turn first
            }
          }
        }

        // 2. Check Chat Message
        if (latestMessage) {
          const isCurrentlyInChat = pathname === "/chat" || pathname.startsWith("/chat/");

          if (latestMessage.id !== lastSeenMessageIdRef.current) {
            lastSeenMessageIdRef.current = latestMessage.id;

            if (!isCurrentlyInChat) {
              let preview = latestMessage.text || "Sent you a message";
              if (latestMessage.contentType === "IMAGE") preview = "📷 Sent a photo";
              if (latestMessage.contentType === "VIDEO") preview = "🎥 Sent a video";
              if (latestMessage.contentType === "VOICE_NOTE") preview = "🎙️ Sent a voice note";

              showNotification({
                id: `msg-${latestMessage.id}`,
                type: "CHAT",
                title: latestMessage.senderName,
                subtitle: preview,
                linkUrl: "/chat",
                badge: "Message",
              });
            }
          }
        }
      } catch (err) {
        // Silently catch polling issues
      }
    }

    // Poll every 4.5 seconds
    const interval = setInterval(checkNotifications, 4500);
    checkNotifications();

    return () => clearInterval(interval);
  }, [pathname]);

  if (!notification) return null;

  const isGame = notification.type === "GAME_TURN";

  return (
    <aside
      aria-label="In-app notification"
      className={`fixed top-3 sm:top-5 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-sm z-50 transition-all duration-300 transform ${
        isVisible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 -translate-y-5 pointer-events-none"
      }`}
    >
      <div
        onClick={handleClickNotification}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleClickNotification();
          }
        }}
        className={`w-full p-3.5 rounded-2xl border shadow-2xl cursor-pointer backdrop-blur-xl flex items-center gap-3 select-none transition-all active:scale-[0.98] ${
          isGame
            ? "bg-[#16141F]/95 border-[#E5B268]/40 hover:border-[#E5B268]/70"
            : "bg-[#14121A]/95 border-[#E26D54]/40 hover:border-[#E26D54]/70"
        }`}
      >
        {/* Icon Avatar */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            isGame
              ? "bg-[#E5B268]/15 border-[#E5B268]/30 text-[#E5B268]"
              : "bg-[#E26D54]/15 border-[#E26D54]/30 text-[#E26D54]"
          }`}
        >
          {isGame ? <Gamepad2 className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-1">
            <span
              className={`text-xs font-bold tracking-tight truncate ${
                isGame ? "text-[#E5B268]" : "text-[#F6F3EE]"
              }`}
            >
              {notification.title}
            </span>
            {notification.badge && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.08] text-[#9992A8] shrink-0 font-medium">
                {notification.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-[#C4BFD0] truncate mt-0.5 leading-tight">
            {notification.subtitle}
          </p>
        </div>

        {/* Arrow action */}
        <div className="flex items-center gap-1 shrink-0">
          <ChevronRight className="w-4 h-4 text-[#9992A8]" />
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-lg text-[#9992A8] hover:text-[#F6F3EE] hover:bg-white/10 transition-colors"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
