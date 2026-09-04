import webpush from "web-push";
import { prisma } from "./prisma";

// Configure Web Push with VAPID keys
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:support@ourloop.app";

function ensureVapidConfig(): boolean {
  const currentPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || publicKey;
  const currentPrivate = process.env.VAPID_PRIVATE_KEY || privateKey;
  const currentSubject = process.env.VAPID_SUBJECT || subject;

  if (currentPublic && currentPrivate) {
    try {
      webpush.setVapidDetails(currentSubject, currentPublic, currentPrivate);
      return true;
    } catch (err) {
      console.error("Failed to initialize webpush VAPID details:", err);
      return false;
    }
  }
  return false;
}

// Initial setup attempt
ensureVapidConfig();

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
}

/**
 * Send push notification to all registered devices of a given user
 */
export async function sendPushToUser(userId: string, payload: PushNotificationPayload) {
  if (!ensureVapidConfig()) {
    console.warn("Cannot send push notification: VAPID keys not configured.");
    return { sent: 0, failed: 0 };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/",
    icon: payload.icon || "/icons/icon-192.png",
    badge: payload.badge || "/icons/badge-72.png",
    image: payload.image || undefined,
    tag: payload.tag || "ourloop-general",
  });

  let sent = 0;
  let failed = 0;

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, pushPayload);
        sent++;
      } catch (error: unknown) {
        failed++;
        const webPushErr = error as { statusCode?: number; message?: string };
        // Prune expired or unregistered endpoints (HTTP 404 or 410)
        if (webPushErr?.statusCode === 404 || webPushErr?.statusCode === 410) {
          console.log(`Pruning expired push subscription ${sub.id} for user ${userId}`);
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error(`Error sending push notification to sub ${sub.id}:`, webPushErr?.message || error);
        }
      }
    })
  );

  return { sent, failed };
}

/**
 * Send push notification to the partner of a given user in a couple
 */
export async function sendPushToPartner(
  senderUserId: string,
  coupleId: string,
  payload: PushNotificationPayload
) {
  try {
    const partnerMembers = await prisma.coupleMember.findMany({
      where: {
        coupleId,
        userId: { not: senderUserId },
      },
      select: { userId: true },
    });

    if (partnerMembers.length === 0) return;

    for (const member of partnerMembers) {
      await sendPushToUser(member.userId, payload);
    }
  } catch (error) {
    console.error("Failed to send push to partner:", error);
  }
}
