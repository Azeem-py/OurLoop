import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getGameSession } from "@/lib/db/games";
import { AppShell } from "@/components/layout/AppShell";
import { GameArena } from "@/components/games/GameArena";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GameDetailPage({ params }: Props) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.coupleId) {
    redirect("/pair");
  }

  const { id } = await params;
  const game = await getGameSession(id, user.coupleId);

  if (!game) {
    notFound();
  }

  const partner = user.partner || {
    id: "partner-placeholder",
    displayName: "Partner",
    nickname: "Partner",
    avatarUrl: null,
  };

  return (
    <AppShell
      user={{
        displayName: user.displayName,
        nickname: user.nickname,
      }}
      partner={user.partner}
      inviteCode={user.couple?.inviteCode}
    >
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 no-scrollbar flex flex-col items-center">
        <GameArena
          initialGame={game as any}
          currentUserId={user.id}
          partner={partner}
        />
      </main>
    </AppShell>
  );
}
