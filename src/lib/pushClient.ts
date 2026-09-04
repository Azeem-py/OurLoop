// Client-side Web Push and PWA utility helpers

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as unknown as { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true ||
    document.referrer.includes("android-app://")
  );
}

export function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isMacTouch = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const isIosDevice = /iPad|iPhone|iPod/.test(ua) || isMacTouch;
  const isMsStream = "MSStream" in window;
  return isIosDevice && !isMsStream;
}

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/**
 * Register Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    return registration;
  } catch (err) {
    console.error("Service worker registration failed:", err);
    return null;
  }
}

/**
 * Get current push subscription if any
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (err) {
    console.error("Failed to get current push subscription:", err);
    return null;
  }
}

/**
 * Request notification permission and subscribe device to PushManager
 */
export async function subscribeToPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: "Push notifications are not supported on this browser or device." };
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    return { success: false, error: "VAPID public key is missing." };
  }

  try {
    // 1. Request OS / Browser notification permission (direct user gesture)
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, error: "Notification permission was denied." };
    }

    // 2. Ensure service worker is ready
    const registration = await navigator.serviceWorker.ready;

    // 3. Subscribe with VAPID key
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey as unknown as BufferSource,
      });
    }

    // 4. Send subscription payload to server
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.error || "Failed to save subscription on server" };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("subscribeToPush error:", err);
    return { success: false, error: (err as Error)?.message || "Failed to subscribe to notifications" };
  }
}

/**
 * Unsubscribe current device from push
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const subscription = await getCurrentSubscription();
    if (subscription) {
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
    }
    return true;
  } catch (err) {
    console.error("Failed to unsubscribe:", err);
    return false;
  }
}

/**
 * Fire an immediate test notification to verify delivery
 */
export async function triggerTestPush(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("/api/push/test", { method: "POST" });
    const data = await res.json();
    return {
      success: res.ok && data.success,
      message: data.message || data.error || "Completed",
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: (err as Error)?.message || "Failed to send test push",
    };
  }
}
