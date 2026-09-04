import { prisma } from "../prisma";
import { ContentType } from "@prisma/client";

export async function listMessages(coupleId: string, limit = 150) {
  return prisma.message.findMany({
    where: { coupleId },
    orderBy: { createdAt: "asc" },
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
  return prisma.message.create({
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
