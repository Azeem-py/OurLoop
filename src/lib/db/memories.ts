import { prisma } from "../prisma";
import { MediaType } from "@prisma/client";

export async function listMemories(coupleId: string) {
  return prisma.memory.findMany({
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
}

export async function createMemory(
  coupleId: string,
  userId: string,
  data: {
    mediaUrl: string;
    mediaType: MediaType;
    caption?: string;
    location?: string;
    takenAt?: Date;
    momentGroupId?: string;
  }
) {
  return prisma.memory.create({
    data: {
      coupleId,
      userId,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      caption: data.caption,
      location: data.location,
      takenAt: data.takenAt || new Date(),
      momentGroupId: data.momentGroupId,
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

export async function toggleHeartMemory(coupleId: string, memoryId: string) {
  const memory = await prisma.memory.findFirst({
    where: { id: memoryId, coupleId },
  });
  if (!memory) throw new Error("Memory not found");

  return prisma.memory.update({
    where: { id: memoryId },
    data: { heartsCount: { increment: 1 } },
  });
}

export async function deleteMemory(coupleId: string, memoryId: string) {
  return prisma.memory.deleteMany({
    where: { id: memoryId, coupleId },
  });
}

export async function getOnThisDayItem(coupleId: string) {
  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  // Check +/- 1 day for 1 month or 1 year
  const memory = await prisma.memory.findFirst({
    where: {
      coupleId,
      OR: [
        {
          createdAt: {
            gte: new Date(oneMonthAgo.setHours(0, 0, 0, 0)),
            lte: new Date(oneMonthAgo.setHours(23, 59, 59, 999)),
          },
        },
        {
          createdAt: {
            gte: new Date(oneYearAgo.setHours(0, 0, 0, 0)),
            lte: new Date(oneYearAgo.setHours(23, 59, 59, 999)),
          },
        },
      ],
    },
    include: {
      author: {
        select: {
          id: true,
          displayName: true,
          nickname: true,
        },
      },
    },
  });

  return memory;
}
