// Lightweight in-memory typing tracker for couple chat rooms
// Optimized for older devices (iPhone 6 / iOS 12) with minimal network and memory overhead

type TypingRecord = {
  userId: string;
  lastTypedAt: number;
};

// Global typing store survives hot-reloading in dev and lives in Node process memory
const globalTypingStore = globalThis as unknown as {
  __ourloopTypingStore?: Map<string, TypingRecord>;
};

const typingStore = globalTypingStore.__ourloopTypingStore ?? new Map<string, TypingRecord>();
if (!globalTypingStore.__ourloopTypingStore) {
  globalTypingStore.__ourloopTypingStore = typingStore;
}

// Timeout after which typing indicator disappears if no new heartbeat is received
const TYPING_EXPIRATION_MS = 4500;

export function recordTyping(coupleId: string, userId: string): void {
  typingStore.set(coupleId, {
    userId,
    lastTypedAt: Date.now(),
  });
}

export function clearTyping(coupleId: string, userId?: string): void {
  const current = typingStore.get(coupleId);
  if (!current) return;
  if (!userId || current.userId === userId) {
    typingStore.delete(coupleId);
  }
}

export function isPartnerTyping(coupleId: string, currentUserId: string): boolean {
  const current = typingStore.get(coupleId);
  if (!current) return false;
  // If the record belongs to the user themselves, it's not the partner typing
  if (current.userId === currentUserId) return false;
  // Expire stale typing indications
  if (Date.now() - current.lastTypedAt > TYPING_EXPIRATION_MS) {
    typingStore.delete(coupleId);
    return false;
  }
  return true;
}
