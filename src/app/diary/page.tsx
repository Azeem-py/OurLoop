import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { DiaryTimeline } from "@/components/diary/DiaryTimeline";
import { listDiaryEntries } from "@/lib/db/diary";

export default async function DiaryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.coupleId) {
    redirect("/pair");
  }

  const entries = await listDiaryEntries(user.coupleId, user.id);

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
        <DiaryTimeline initialEntries={entries as any} currentUserId={user.id} />
      </div>
    </AppShell>
  );
}
