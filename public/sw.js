// OurLoop Service Worker for PWA & Web Push Notifications
// Compatible with iOS 16.4+ (Home Screen Standalone) and Android (PWA / Chromium)

const CACHE_NAME = "ourloop-v1";

// Cache core offline fallback assets if needed
self.addEventListener("install", (event) => {
  // Activate worker immediately
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Claim clients immediately so all tabs are controlled
  event.waitUntil(self.clients.claim());
});

// Web Push Notification Event Handler
self.addEventListener("push", (event) => {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: "OurLoop",
        body: event.data.text() || "You have a new update in OurLoop 💕",
      };
    }
  }

  const title = data.title || "OurLoop 💕";
  const targetUrl = data.url || (data.data && data.data.url) || "/";

  const options = {
    body: data.body || "New love note from your partner",
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/badge-72.png",
    image: data.image || undefined,
    // Romantic heartbeat haptic vibration: heartbeat - pause - heartbeat
    vibrate: [150, 60, 150, 100, 250],
    data: {
      url: targetUrl,
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || "1",
    },
    tag: data.tag || "ourloop-partner-update",
    renotify: true,
    requireInteraction: false,
    actions: data.actions || [
      {
        action: "open",
        title: "Open OurLoop",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Handler: Deep link navigation
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // If an existing window is open, focus it and navigate
        for (const client of clientList) {
          const clientUrl = new URL(client.url, self.location.origin);
          if (clientUrl.origin === self.location.origin && "focus" in client) {
            if ("navigate" in client) {
              client.navigate(targetUrl);
            }
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

// Background Sync / Message support if needed
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
