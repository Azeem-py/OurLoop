import { prisma } from "../prisma";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "US-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createCoupleSpace(userId: string, anniversaryDate?: Date | null, nextVisitDate?: Date | null) {
  // Check if user already in a couple
  const existingMembership = await prisma.coupleMember.findFirst({
    where: { userId },
  });
  if (existingMembership) {
    throw new Error("You already belong to a couple space. Leave or delete it first.");
  }

  // Generate unique invite code
  let inviteCode = generateInviteCode();
  let codeTaken = await prisma.couple.findUnique({ where: { inviteCode } });
  while (codeTaken) {
    inviteCode = generateInviteCode();
    codeTaken = await prisma.couple.findUnique({ where: { inviteCode } });
  }

  const couple = await prisma.couple.create({
    data: {
      inviteCode,
      anniversaryDate: anniversaryDate || null,
      nextVisitDate: nextVisitDate || null,
      members: {
        create: {
          userId,
          role: "CREATOR",
        },
      },
    },
    include: {
      members: {
        include: { user: true },
      },
    },
  });

  return couple;
}

export async function joinCoupleSpace(userId: string, inviteCode: string) {
  const cleanCode = inviteCode.trim().toUpperCase();

  const couple = await prisma.couple.findUnique({
    where: { inviteCode: cleanCode },
    include: {
      members: true,
    },
  });

  if (!couple) {
    throw new Error("Invalid invite code. Please check with your partner.");
  }

  if (couple.members.length >= 2) {
    throw new Error("This space is already full with two partners.");
  }

  const alreadyInThisCouple = couple.members.some((m) => m.userId === userId);
  if (alreadyInThisCouple) {
    return couple;
  }

  // Check if user is in another couple
  const existingMembership = await prisma.coupleMember.findFirst({
    where: { userId },
  });
  if (existingMembership) {
    throw new Error("You are already in another couple space.");
  }

  await prisma.coupleMember.create({
    data: {
      coupleId: couple.id,
      userId,
      role: "PARTNER",
    },
  });

  return prisma.couple.findUnique({
    where: { id: couple.id },
    include: {
      members: { include: { user: true } },
    },
  });
}

export async function updateCoupleSettings(
  coupleId: string,
  data: {
    anniversaryDate?: Date | null;
    nextVisitDate?: Date | null;
    themeSettings?: Prisma.InputJsonValue;
  }
) {
  return prisma.couple.update({
    where: { id: coupleId },
    data,
  });
}
