"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Sparkles, BookOpen, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

export function BottomTabBar() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  // Periodic poll for unread badge
  useEffect(() => {
    async function checkUnread() {
      try {
        const res = await fetch("/api/messages");
        if (res.ok) {
          const data = await res.json();
          // Filter if needed
        }
      } catch {}
    }
    checkUnread();
    const interval = setInterval(checkUnread, 12000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { name: "Home", href: "/", icon: Heart },
    { name: "Memories", href: "/memories", icon: Sparkles },
    { name: "Diary", href: "/diary", icon: BookOpen },
    { name: "Chat", href: "/chat", icon: MessageCircle, badge: unreadCount },
  ];

  return (
    <nav className="h-16 border-t border-[#242031] bg-[#14121A]/95 backdrop-blur-md px-4 flex items-center justify-around z-30 shrink-0 select-none md:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 ${
              isActive
                ? "text-[#E26D54]"
                : "text-[#9992A8] hover:text-[#F6F3EE]"
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? "stroke-[2.2] fill-[#E26D54]/15" : "stroke-[1.75]"
                }`}
              />
              {Boolean(tab.badge && tab.badge > 0) && (
                <span className="absolute -top-1 -right-2 bg-[#E26D54] text-[#0E0D13] text-[10px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-[#14121A]">
                  {tab.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[11px] mt-1 font-medium transition-all ${
                isActive ? "font-semibold text-[#E26D54]" : "text-[#9992A8]"
              }`}
            >
              {tab.name}
            </span>
            {isActive && (
              <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#E26D54]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
