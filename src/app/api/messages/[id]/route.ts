import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteMessage } from "@/lib/db/messages";

interface Props {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: Request, { params }: Props) {
  const user = await getCurrentUser();
  if (!user || !user.coupleId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
  }

  try {
    const deleted = await deleteMessage(user.coupleId, id);
    if (!deleted) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, messageId: id });
  } catch (error: unknown) {
    console.error("Delete message error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete message";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
