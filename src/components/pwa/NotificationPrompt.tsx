"use client";

import { useState, useEffect } from "react";
import { isPushSupported, isIOS, isStandalone, subscribeToPush } from "@/lib/pushClient";
import { Bell, Sparkles, X, CheckCircle } from "lucide-react";

interface NotificationPromptProps {
  partnerName?: string | null;
}

export function NotificationPrompt({ partnerName = "your partner" }: NotificationPromptProps) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if push is supported
    if (!isPushSupported()) return;

    // On iOS, push ONLY works in standalone mode. Don't prompt in Safari tab.
    if (isIOS() && !isStandalone()) return;

    // Check if already granted or denied
    if (typeof Notification === "undefined" || Notification.permission !== "default") return;

    // Check if dismissed in this session or recently
    const dismissed = sessionStorage.getItem("ourloop_notif_prompt_dismissed");
    if (dismissed) return;

    // Show prompt after a slight delay so the user settles in
    const timer = setTimeout(() => {
      setShow(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  async function handleEnable() {
    setLoading(true);
    setErrorMessage(null);

    const res = await subscribeToPush();

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        setShow(false);
      }, 2500);
    } else {
      setErrorMessage(res.error || "Could not enable notifications.");
      setLoading(false);
    }
  }

  function handleDismiss() {
    setShow(false);
    sessionStorage.setItem("ourloop_notif_prompt_dismissed", "true");
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-8 md:max-w-sm animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-[#181524]/95 backdrop-blur-xl border border-[#302A44] p-4 rounded-2xl shadow-2xl text-[#F6F3EE] relative">
        <button
          onClick={handleDismiss}
          aria-label="Dismiss notification prompt"
          className="absolute top-3 right-3 text-[#9992A8] hover:text-[#F6F3EE] transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>

        {success ? (
          <div className="flex items-center gap-3 py-1 text-[#E5B268]">
            <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#F6F3EE]">Notifications Active!</p>
              <p className="text-xs text-[#A6A0B8]">You&apos;ll be notified whenever {partnerName} connects.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E26D54] to-[#E5B268] flex items-center justify-center text-[#0E0D13] font-bold shadow-md shrink-0 mt-0.5">
                <Bell className="w-4 h-4" />
              </div>
              <div className="pr-4">
                <h4 className="text-sm font-semibold tracking-tight text-[#F6F3EE] flex items-center gap-1.5">
                  Stay in each other&apos;s loop <Sparkles className="w-3.5 h-3.5 text-[#E5B268]" />
                </h4>
                <p className="text-xs text-[#A6A0B8] mt-0.5 leading-relaxed">
                  Enable push notifications to receive love notes, instant chat messages, and memory alerts from {partnerName}.
                </p>
              </div>
            </div>

            {errorMessage && (
              <p className="text-[11px] text-rose-400 bg-rose-950/40 border border-rose-800/50 p-2 rounded-lg mb-2.5">
                {errorMessage}
              </p>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleEnable}
                disabled={loading}
                className="flex-1 py-2 px-3 bg-[#E26D54] hover:bg-[#eb7d65] text-[#0E0D13] font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-[#0E0D13] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    Turn on Notifications
                  </>
                )}
              </button>
              <button
                onClick={handleDismiss}
                disabled={loading}
                className="py-2 px-3 bg-[#252035] hover:bg-[#2e2840] text-[#DDD8E8] text-xs font-medium rounded-xl transition-all"
              >
                Maybe Later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
