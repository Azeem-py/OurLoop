import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { MemoriesViewer } from "@/components/memories/MemoriesViewer";
import { listMemories } from "@/lib/db/memories";

export default async function MemoriesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.coupleId) {
    redirect("/pair");
  }

  const memories = await listMemories(user.coupleId);

  return (
    <AppShell
      user={{
        displayName: user.displayName,
        nickname: user.nickname,
      }}
      partner={user.partner}
      inviteCode={user.couple?.inviteCode}
    >
      <div className="flex-1 overflow-hidden relative flex flex-col">
        <MemoriesViewer initialMemories={memories as any} />
      </div>
    </AppShell>
  );
}
