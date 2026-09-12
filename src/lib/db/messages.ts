import { prisma } from "../prisma";
import { ContentType } from "@prisma/client";

export async function listMessages(coupleId: string, limit = 200) {
  const messages = await prisma.message.findMany({
    where: { coupleId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      sender: {
        select: {
          id: true,
          displayName: true,
          nickname: true,
          avatarUrl: true,
        },
      },
      reactions: {
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      },
    },
  });

  // Reverse so the messages appear in chronological order (oldest -> newest) in the chat
  messages.reverse();

  const replyToIds = Array.from(
    new Set(messages.map((m) => m.replyToId).filter(Boolean) as string[])
  );

  const replyToMap = new Map<
    string,
    { id: string; text?: string | null; contentType: string; senderName: string }
  >();

  if (replyToIds.length > 0) {
    const parentMessages = await prisma.message.findMany({
      where: { id: { in: replyToIds } },
      select: {
        id: true,
        text: true,
        contentType: true,
        sender: {
          select: {
            displayName: true,
            nickname: true,
          },
        },
      },
    });

    for (const pm of parentMessages) {
      replyToMap.set(pm.id, {
        id: pm.id,
        text: pm.text,
        contentType: pm.contentType,
        senderName: pm.sender.nickname || pm.sender.displayName,
      });
    }
  }

  return messages.map((m) => ({
    ...m,
    replyTo: m.replyToId ? replyToMap.get(m.replyToId) || null : null,
  }));
}

export async function createMessage(
  coupleId: string,
  senderId: string,
  data: {
    contentType: ContentType;
    text?: string;
    contentUrl?: string;
    replyToId?: string;
    durationSec?: number;
  }
) {
  const message = await prisma.message.create({
    data: {
      coupleId,
      senderId,
      contentType: data.contentType,
      text: data.text,
      contentUrl: data.contentUrl,
      replyToId: data.replyToId,
      durationSec: data.durationSec,
    },
    include: {
      sender: {
        select: {
          id: true,
          displayName: true,
          nickname: true,
          avatarUrl: true,
        },
      },
      reactions: true,
    },
  });

  let replyTo = null;
  if (data.replyToId) {
    const parent = await prisma.message.findUnique({
      where: { id: data.replyToId },
      select: {
        id: true,
        text: true,
        contentType: true,
        sender: {
          select: { displayName: true, nickname: true },
        },
      },
    });
    if (parent) {
      replyTo = {
        id: parent.id,
        text: parent.text,
        contentType: parent.contentType,
        senderName: parent.sender.nickname || parent.sender.displayName,
      };
    }
  }

  return {
    ...message,
    replyTo,
  };
}

export async function markMessagesAsRead(coupleId: string, currentUserId: string) {
  return prisma.message.updateMany({
    where: {
      coupleId,
      senderId: { not: currentUserId },
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
}

export async function toggleReaction(messageId: string, userId: string, emoji: string) {
  const existing = await prisma.reaction.findUnique({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId,
        emoji,
      },
    },
  });

  if (existing) {
    return prisma.reaction.delete({
      where: { id: existing.id },
    });
  } else {
    return prisma.reaction.create({
      data: {
        messageId,
        userId,
        emoji,
      },
    });
  }
}

export async function getUnreadCount(coupleId: string, currentUserId: string) {
  return prisma.message.count({
    where: {
      coupleId,
      senderId: { not: currentUserId },
      readAt: null,
    },
  });
}

export async function deleteMessage(coupleId: string, messageId: string) {
  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      coupleId,
    },
  });

  if (!message) {
    return null;
  }

  // Explicitly remove reactions first for foreign key integrity
  await prisma.reaction.deleteMany({
    where: { messageId },
  });

  return prisma.message.delete({
    where: { id: messageId },
  });
}

