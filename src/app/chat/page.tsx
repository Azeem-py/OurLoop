import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { listMessages, markMessagesAsRead } from "@/lib/db/messages";

export default async function ChatPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.coupleId) {
    redirect("/pair");
  }

  const messages = await listMessages(user.coupleId);
  await markMessagesAsRead(user.coupleId, user.id);

  const partnerName = user.partner ? user.partner.nickname || user.partner.displayName : "Partner";

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
        <ChatRoom
          initialMessages={messages as any}
          currentUserId={user.id}
          partnerName={partnerName}
        />
      </div>
    </AppShell>
  );
}
