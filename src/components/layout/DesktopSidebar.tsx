"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Heart,
  Sparkles,
  BookOpen,
  MessageCircle,
  Gamepad2,
  LogOut,
  Copy,
  Check,
  Bell,
} from "lucide-react";
import { NotificationSettingsModal } from "../pwa/NotificationSettingsModal";
import { copyToClipboard } from "@/lib/clipboard";

interface DesktopSidebarProps {
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

export function DesktopSidebar({ user, partner, inviteCode }: DesktopSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifModalOpen, setNotifModalOpen] = useState(false);

  useEffect(() => {
    async function checkUnread() {
      try {
        const res = await fetch("/api/messages");
        if (res.ok) {
          // If unread messages count is available
        }
      } catch {}
    }
    checkUnread();
    const interval = setInterval(checkUnread, 12000);
    return () => clearInterval(interval);
  }, []);

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

  const navItems = [
    { name: "Home", href: "/", icon: Heart },
    { name: "Memories", href: "/memories", icon: Sparkles },
    { name: "Games", href: "/games", icon: Gamepad2 },
    { name: "Diary", href: "/diary", icon: BookOpen },
    { name: "Chat", href: "/chat", icon: MessageCircle, badge: unreadCount },
  ];

  return (
    <aside className="hidden md:flex w-64 lg:w-72 h-screen flex-col justify-between border-r border-[#242031] bg-[#121018] p-5 shrink-0 select-none">
      {/* Top Brand & Couple Info */}
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E26D54] flex items-center justify-center text-[#0E0D13]">
              <Heart className="w-4 h-4 fill-[#0E0D13]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#F6F3EE] font-serif">
                OurLoop
              </h1>
              <p className="text-[10px] text-[#9992A8] tracking-wide">A private world for two</p>
            </div>
          </div>
        </div>

        {/* Couple Card */}
        <div className="p-3.5 rounded-2xl bg-[#171520] border border-[#292536]">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <div className="w-9 h-9 rounded-full bg-[#E26D54] flex items-center justify-center text-[#0E0D13] font-bold text-xs shadow-sm z-10">
                {youName.charAt(0)}
              </div>
              {partner ? (
                <div className="w-9 h-9 -ml-3.5 rounded-full bg-[#201D2B] border-2 border-[#171520] flex items-center justify-center text-[#F6F3EE] font-bold text-xs">
                  {partnerName.charAt(0)}
                </div>
              ) : (
                <div className="w-9 h-9 -ml-3.5 rounded-full bg-[#201D2B]/80 border-2 border-dashed border-[#9992A8]/30 flex items-center justify-center text-[#9992A8] text-xs">
                  +
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#F6F3EE] truncate">
                {youName} & {partnerName}
              </p>
              <p className="text-[11px] text-[#9992A8] flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="truncate">
                  {partner ? "Together in our world" : "Waiting for partner"}
                </span>
              </p>
            </div>
          </div>

          {inviteCode && (
            <button
              onClick={handleCopyInvite}
              className="mt-3 w-full py-1.5 px-2.5 rounded-xl bg-[#201D2B] hover:bg-[#282436] border border-white/[0.05] flex items-center justify-between text-[11px] text-[#9992A8] transition-colors"
            >
              <span className="flex items-center gap-1.5 truncate">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#9992A8]" />}
                <span className="truncate">Code: <strong className="text-[#E5B268]">{inviteCode}</strong></span>
              </span>
              <span className="text-[10px] text-[#E5B268] font-medium shrink-0 ml-1">
                {copied ? "Copied" : "Copy"}
              </span>
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#201D2B] text-[#F6F3EE] border border-white/[0.08] shadow-sm"
                    : "text-[#9992A8] hover:text-[#F6F3EE] hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-[#E26D54]" : "text-[#9992A8]"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {Boolean(item.badge && item.badge > 0) && (
                  <span className="bg-[#E26D54] text-[#0E0D13] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Controls */}
      <div className="pt-4 border-t border-[#242031] space-y-1">
        <button
          onClick={() => setNotifModalOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#9992A8] hover:text-[#F6F3EE] hover:bg-white/[0.04] transition-colors"
        >
          <Bell className="w-4 h-4 text-[#E26D54]" />
          <span>Notifications</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#9992A8] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Log out</span>
        </button>
      </div>

      <NotificationSettingsModal
        isOpen={notifModalOpen}
        onClose={() => setNotifModalOpen(false)}
        partnerName={partner?.nickname || partner?.displayName || "Partner"}
      />
    </aside>
  );
}
