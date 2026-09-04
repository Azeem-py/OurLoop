"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { isIOS, isStandalone } from "@/lib/pushClient";
import { Share2, PlusSquare, X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const emptySubscribe = () => () => {};

export function InstallBanner() {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [userDismissed, setUserDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  if (!isClient) {
    return null;
  }

  const standalone = isStandalone();
  const iosDevice = isIOS();
  const storedDismissed = Boolean(localStorage.getItem("ourloop_pwa_install_dismissed"));

  if (standalone || userDismissed || storedDismissed) {
    return null;
  }

  function handleDismiss() {
    setUserDismissed(true);
    localStorage.setItem("ourloop_pwa_install_dismissed", "true");
  }

  async function handleAndroidInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setUserDismissed(true);
      localStorage.setItem("ourloop_pwa_install_dismissed", "true");
    }
    setDeferredPrompt(null);
  }

  // iOS Safari Install Guide
  if (iosDevice) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-40 md:left-auto md:right-8 md:bottom-8 md:max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="bg-[#181524]/95 backdrop-blur-xl border border-[#302A44] p-4 rounded-2xl shadow-2xl text-[#F6F3EE] relative">
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install guide"
            className="absolute top-3 right-3 text-[#9992A8] hover:text-[#F6F3EE] transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E26D54] to-[#E5B268] flex items-center justify-center text-[#0E0D13] font-bold shadow-md shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-tight text-[#F6F3EE]">
                Add OurLoop to Home Screen
              </h4>
              <p className="text-[11px] text-[#A6A0B8]">
                Required on iPhone to receive notifications
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-[#DDD8E8] bg-[#100E17]/60 p-2.5 rounded-xl border border-[#252035] mb-3">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#E26D54]/20 text-[#E26D54] flex items-center justify-center font-bold text-[10px]">
                1
              </span>
              <span>Tap the <strong className="text-[#F6F3EE] inline-flex items-center gap-1">Share button <Share2 className="w-3 h-3 text-[#E26D54] inline" /></strong> at bottom of Safari</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#E26D54]/20 text-[#E26D54] flex items-center justify-center font-bold text-[10px]">
                2
              </span>
              <span>Scroll down & tap <strong className="text-[#F6F3EE] inline-flex items-center gap-1">Add to Home Screen <PlusSquare className="w-3 h-3 text-[#E5B268] inline" /></strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#E26D54]/20 text-[#E26D54] flex items-center justify-center font-bold text-[10px]">
                3
              </span>
              <span>Open OurLoop from your Home Screen 💕</span>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full py-1.5 text-xs text-[#A6A0B8] hover:text-[#F6F3EE] transition-colors font-medium text-center"
          >
            I&apos;ll do this later
          </button>
        </div>
      </div>
    );
  }

  // Android / Desktop Install Prompt (when beforeinstallprompt is available)
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-40 md:left-auto md:right-8 md:bottom-8 md:max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="bg-[#181524]/95 backdrop-blur-xl border border-[#302A44] p-4 rounded-2xl shadow-2xl text-[#F6F3EE] relative">
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="absolute top-3 right-3 text-[#9992A8] hover:text-[#F6F3EE] transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E26D54] to-[#E5B268] flex items-center justify-center text-[#0E0D13] font-bold shadow-md shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-tight text-[#F6F3EE]">
                Install OurLoop App
              </h4>
              <p className="text-xs text-[#A6A0B8]">
                Get real-time push alerts & full-screen love notes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAndroidInstall}
              className="flex-1 py-2 px-3 bg-[#E26D54] hover:bg-[#eb7d65] text-[#0E0D13] font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Install Now
            </button>
            <button
              onClick={handleDismiss}
              className="py-2 px-3 bg-[#252035] hover:bg-[#2e2840] text-[#DDD8E8] text-xs font-medium rounded-xl transition-all"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
