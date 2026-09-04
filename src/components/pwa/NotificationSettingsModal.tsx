"use client";

import { useState } from "react";
import {
  isPushSupported,
  isIOS,
  isStandalone,
  subscribeToPush,
  unsubscribeFromPush,
  triggerTestPush,
} from "@/lib/pushClient";
import { Bell, BellOff, Send, Smartphone, ShieldCheck, X, CheckCircle2, AlertCircle } from "lucide-react";

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName?: string | null;
}

export function NotificationSettingsModal({
  isOpen,
  onClose,
  partnerName = "your partner",
}: NotificationSettingsModalProps) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window === "undefined" || !isPushSupported()) {
      return "unsupported";
    }
    return Notification.permission;
  });

  const [loading, setLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState(false);

  if (!isOpen) return null;

  const standalone = isStandalone();
  const iosDevice = isIOS();

  async function handleToggle() {
    setLoading(true);
    setTestStatus(null);

    if (permission === "granted") {
      await unsubscribeFromPush();
      setPermission("default");
      setTestStatus("Notifications turned off for this device.");
      setTestSuccess(false);
    } else {
      const res = await subscribeToPush();
      if (res.success) {
        setPermission("granted");
        setTestStatus("Notifications enabled! Sending a quick test...");
        setTestSuccess(true);
        // Automatically send a welcome test notification!
        const testRes = await triggerTestPush();
        if (testRes.success) {
          setTestStatus("Test notification delivered! Check your notifications.");
        }
      } else {
        setTestStatus(res.error || "Failed to enable notifications.");
        setTestSuccess(false);
      }
    }
    setLoading(false);
  }

  async function handleTest() {
    setLoading(true);
    setTestStatus("Sending test notification...");
    const res = await triggerTestPush();
    setTestStatus(res.message);
    setTestSuccess(res.success);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#161420] border border-[#2D283E] rounded-3xl p-6 shadow-2xl text-[#F6F3EE] relative">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 text-[#9992A8] hover:text-[#F6F3EE] transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#E26D54] to-[#E5B268] flex items-center justify-center text-[#0E0D13] font-bold shadow-md shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#F6F3EE]">
              Push Notifications
            </h3>
            <p className="text-xs text-[#A6A0B8]">
              Stay connected with {partnerName} in real-time
            </p>
          </div>
        </div>

        {/* Device Status Pills */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0E0D13] border border-[#231E33] text-xs">
            <span className="text-[#A6A0B8] flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#E5B268]" /> Device Mode
            </span>
            <span className="font-medium text-[#F6F3EE]">
              {standalone ? "Installed App (PWA)" : "Web Browser"}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0E0D13] border border-[#231E33] text-xs">
            <span className="text-[#A6A0B8] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#E26D54]" /> Status
            </span>
            <span className="font-medium flex items-center gap-1.5">
              {permission === "granted" ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  <span className="text-emerald-400">Enabled</span>
                </>
              ) : permission === "denied" ? (
                <span className="text-rose-400">Blocked by Browser</span>
              ) : (
                <span className="text-amber-300">Not Enabled</span>
              )}
            </span>
          </div>
        </div>

        {/* iOS Warning if in Safari tab */}
        {iosDevice && !standalone && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-950/40 border border-amber-800/40 text-xs text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              On iPhone, Apple requires OurLoop to be added to your <strong>Home Screen</strong> before notifications can be delivered.
            </p>
          </div>
        )}

        {testStatus && (
          <div
            className={`mb-4 p-3 rounded-2xl text-xs flex items-center gap-2 ${
              testSuccess
                ? "bg-emerald-950/40 border border-emerald-800/40 text-emerald-300"
                : "bg-[#201B2E] border border-[#302A44] text-[#DDD8E8]"
            }`}
          >
            {testSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <p className="leading-relaxed">{testStatus}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2.5">
          {permission === "granted" ? (
            <>
              <button
                onClick={handleTest}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-[#E26D54] to-[#E5B268] hover:opacity-95 text-[#0E0D13] font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5" />
                Send Test Notification
              </button>
              <button
                onClick={handleToggle}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#231E33] hover:bg-[#2c2640] text-[#DDD8E8] text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <BellOff className="w-3.5 h-3.5 text-[#9992A8]" />
                Disable on this device
              </button>
            </>
          ) : (
            <button
              onClick={handleToggle}
              disabled={loading || permission === "denied"}
              className="w-full py-2.5 px-4 bg-[#E26D54] hover:bg-[#eb7d65] text-[#0E0D13] font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Bell className="w-3.5 h-3.5" />
              {loading ? "Enabling..." : "Enable Push Notifications"}
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 text-xs text-[#A6A0B8] hover:text-[#F6F3EE] font-medium transition-colors text-center"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
