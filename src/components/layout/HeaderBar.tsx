"use client";

import { useState } from "react";
import { LogOut, Copy, Check, HeartHandshake, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { NotificationSettingsModal } from "../pwa/NotificationSettingsModal";
import { copyToClipboard } from "@/lib/clipboard";

interface HeaderBarProps {
  user: {
    displayName: string;
    nickname?: string | null;
  };
  partner?: {
    displayName: string;
    nickname?: string | null;
  } | null;
  inviteCode?: string | null;
}

export function HeaderBar({ user, partner, inviteCode }: HeaderBarProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifModalOpen, setNotifModalOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handleCopyInvite() {
    if (!inviteCode) return;
    const ok = await copyToClipboard(inviteCode);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const youName = user.nickname || user.displayName;
  const partnerName = partner ? partner.nickname || partner.displayName : "Partner";

  return (
    <header className="h-14 px-4 bg-[#14121A]/95 backdrop-blur-md border-b border-[#242031] flex items-center justify-between shrink-0 z-20 md:hidden">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-[#E26D54] flex items-center justify-center text-[#0E0D13] font-bold text-xs shadow-sm">
          {youName.charAt(0)}
        </div>
        {partner ? (
          <div className="w-8 h-8 -ml-3 rounded-full bg-[#201D2B] border-2 border-[#14121A] flex items-center justify-center text-[#F6F3EE] font-bold text-xs">
            {partnerName.charAt(0)}
          </div>
        ) : (
          <div className="w-8 h-8 -ml-3 rounded-full bg-[#201D2B]/70 border-2 border-dashed border-[#9992A8]/30 flex items-center justify-center text-[#9992A8] text-xs">
            +
          </div>
        )}
        <div className="ml-1">
          <h1 className="text-sm font-semibold tracking-tight text-[#F6F3EE] leading-tight">
            {youName} & {partnerName}
          </h1>
          <p className="text-[10px] text-[#9992A8] font-light flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            {partner ? "Together in our world" : "Waiting for partner"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 relative">
        <button
          onClick={() => setNotifModalOpen(true)}
          className="p-2 rounded-xl text-[#9992A8] hover:text-[#F6F3EE] hover:bg-[#201D2B] transition-colors"
          title="Push Notifications"
          aria-label="Push Notifications"
        >
          <Bell className="w-4.5 h-4.5 text-[#E26D54]" />
        </button>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-xl text-[#9992A8] hover:text-[#F6F3EE] hover:bg-[#201D2B] transition-colors"
          title="Menu & Settings"
        >
          <HeartHandshake className="w-5 h-5 text-[#E5B268]" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 mt-2 top-10 w-56 bg-[#171520] border border-[#292536] rounded-2xl shadow-2xl p-2 z-50 text-xs">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setNotifModalOpen(true);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#221F2D] flex items-center gap-2 text-[#F6F3EE] transition-colors"
              >
                <Bell className="w-4 h-4 text-[#E26D54]" />
                <span>Push Notifications</span>
              </button>

              {inviteCode && (
                <button
                  onClick={handleCopyInvite}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#221F2D] flex items-center justify-between text-[#F6F3EE] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#9992A8]" />}
                    <span>Invite: <strong className="text-[#E5B268]">{inviteCode}</strong></span>
                  </span>
                  <span className="text-[10px] text-[#9992A8]">{copied ? "Copied!" : "Copy"}</span>
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-rose-500/10 text-rose-400 flex items-center gap-2 transition-colors mt-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          </>
        )}
      </div>

      <NotificationSettingsModal
        isOpen={notifModalOpen}
        onClose={() => setNotifModalOpen(false)}
        partnerName={partnerName}
      />
    </header>
  );
}
