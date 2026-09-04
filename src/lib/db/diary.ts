import { prisma } from "../prisma";
import { Visibility } from "@prisma/client";

export async function listDiaryEntries(coupleId: string, currentUserId: string) {
  const entries = await prisma.diaryEntry.findMany({
    where: { coupleId },
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          displayName: true,
          nickname: true,
          avatarUrl: true,
        },
      },
    },
  });

  const now = new Date();

  // Filter or mark private-until entries
  return entries.map((entry) => {
    const isLocked =
      entry.visibility === Visibility.PRIVATE_UNTIL &&
      entry.author.id !== currentUserId &&
      entry.revealAt &&
      entry.revealAt > now;

    if (isLocked) {
      return {
        ...entry,
        isLocked: true,
        imageUrl: null,
        content: "🔒 This secret entry is locked until the reveal date. A sweet surprise awaits!",
      };
    }

    return {
      ...entry,
      isLocked: false,
    };
  });
}

export async function createDiaryEntry(
  coupleId: string,
  userId: string,
  data: {
    content: string;
    title?: string;
    mood?: string;
    imageUrl?: string | null;
    visibility?: Visibility;
    revealAt?: Date | null;
    linkedMemoryId?: string | null;
  }
) {
  return prisma.diaryEntry.create({
    data: {
      coupleId,
      userId,
      content: data.content,
      title: data.title,
      mood: data.mood,
      imageUrl: data.imageUrl || null,
      visibility: data.visibility || Visibility.SHARED,
      revealAt: data.revealAt || null,
      linkedMemoryId: data.linkedMemoryId || null,
    },
    include: {
      author: {
        select: {
          id: true,
          displayName: true,
          nickname: true,
          avatarUrl: true,
        },
      },
    },
  });
}

export async function deleteDiaryEntry(coupleId: string, entryId: string, userId: string) {
  return prisma.diaryEntry.deleteMany({
    where: {
      id: entryId,
      coupleId,
      userId,
    },
  });
}
