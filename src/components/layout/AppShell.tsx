"use client";

import { HeaderBar } from "./HeaderBar";
import { BottomTabBar } from "./BottomTabBar";
import { DesktopSidebar } from "./DesktopSidebar";
import { PwaManager } from "../pwa/PwaManager";
import { InAppNotifier } from "../notifications/InAppNotifier";

interface AppShellProps {
  children: React.ReactNode;
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

export function AppShell({ children, user, partner, inviteCode }: AppShellProps) {
  const partnerName = partner ? partner.nickname || partner.displayName : null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0E0D13] text-[#F6F3EE]">
      {/* PWA Service Worker, iOS Install Guide & Push Prompts */}
      <PwaManager partnerName={partnerName} />

      {/* In-app Notifications for incoming messages & game turns */}
      <InAppNotifier />

      {/* Desktop Sidebar (visible on md screens and above) */}
      <DesktopSidebar user={user} partner={partner} inviteCode={inviteCode} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header (hidden on md and above) */}
        <HeaderBar user={user} partner={partner} inviteCode={inviteCode} />

        {/* Dynamic Page View */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {children}
        </div>

        {/* Mobile Bottom Tab Bar (hidden on md and above) */}
        <BottomTabBar />
      </div>
    </div>
  );
}
