import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listCoupleGames } from "@/lib/db/games";
import { AppShell } from "@/components/layout/AppShell";
import { GamesHub } from "@/components/games/GamesHub";

export default async function GamesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.coupleId) {
    redirect("/pair");
  }

  const { activeGames, completedGames, stats } = await listCoupleGames(user.coupleId);

  const partner = user.partner || {
    id: "partner-placeholder",
    displayName: "Partner",
    nickname: "Partner",
  };

  const partnerName = partner.nickname || partner.displayName;

  return (
    <AppShell
      user={{
        displayName: user.displayName,
        nickname: user.nickname,
      }}
      partner={user.partner}
      inviteCode={user.couple?.inviteCode}
    >
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 no-scrollbar">
        <GamesHub
          initialActiveGames={activeGames as any}
          initialCompletedGames={completedGames as any}
          stats={stats}
          currentUserId={user.id}
          partnerName={partnerName}
          partnerId={partner.id}
        />
      </main>
    </AppShell>
  );
}
