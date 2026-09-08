// Polyfills for older mobile browsers (iOS 12 / Safari 12)
// Must be imported before React hydration or UI components initialize.

import ResizeObserverPolyfill from "resize-observer-polyfill";

if (typeof window !== "undefined") {
  // 1. globalThis polyfill
  if (typeof (window as unknown as { globalThis?: typeof window }).globalThis === "undefined") {
    (window as unknown as { globalThis: typeof window }).globalThis = window;
  }

  // 2. ResizeObserver polyfill (fixes fatal Framer Motion crashes on Safari 12)
  if (!window.ResizeObserver) {
    window.ResizeObserver = ResizeObserverPolyfill;
  }

  // 3. queueMicrotask fallback (missing in iOS 12.0 / 12.1)
  if (typeof window.queueMicrotask !== "function") {
    window.queueMicrotask = function (callback: () => void) {
      Promise.resolve()
        .then(callback)
        .catch((err) => {
          setTimeout(() => {
            throw err;
          }, 0);
        });
    };
  }

  // 4. structuredClone fallback (added in iOS 15.4)
  if (typeof (window as unknown as { structuredClone?: unknown }).structuredClone !== "function") {
    (window as unknown as { structuredClone: <T>(val: T) => T }).structuredClone = function <T>(val: T): T {
      if (val === undefined) return undefined as unknown as T;
      return JSON.parse(JSON.stringify(val));
    };
  }

  // 5. Promise.allSettled fallback (added in Safari 13)
  if (typeof Promise.allSettled !== "function") {
    Promise.allSettled = function <T>(promises: Iterable<Promise<T>>) {
      return Promise.all(
        Array.from(promises).map((p) =>
          Promise.resolve(p).then(
            (value) => ({ status: "fulfilled" as const, value }),
            (reason) => ({ status: "rejected" as const, reason })
          )
        )
      );
    };
  }

  // 6. String.prototype.replaceAll fallback (added in Safari 13.1)
  if (!String.prototype.replaceAll) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    String.prototype.replaceAll = function (searchValue: any, replaceValue: any) {
      if (searchValue instanceof RegExp) {
        const flags = searchValue.flags || "";
        const globalFlags = flags.includes("g") ? flags : flags + "g";
        return this.replace(new RegExp(searchValue.source, globalFlags), replaceValue);
      }
      return this.split(searchValue).join(replaceValue);
    };
  }

  // 7. crypto.randomUUID fallback (added in Safari 15.4)
  if (window.crypto && !(window.crypto as unknown as { randomUUID?: () => string }).randomUUID) {
    (window.crypto as unknown as { randomUUID: () => string }).randomUUID = function (): string {
      return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => {
        const num = Number(c);
        return (num ^ (window.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (num / 4)))).toString(16);
      });
    };
  }
}

export {};
