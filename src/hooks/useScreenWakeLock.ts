"use client";

import { useCallback, useEffect, useRef } from "react";

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (
    type: "release",
    listener: () => void,
    options?: { once?: boolean },
  ) => void;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>;
  };
};

/**
 * Hold a screen wake lock while `shouldHold` is true.
 * Silent no-op when the API is missing, denied, or the page is hidden.
 */
export function useScreenWakeLock(shouldHold: boolean) {
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);
  const shouldHoldRef = useRef(shouldHold);

  useEffect(() => {
    shouldHoldRef.current = shouldHold;
  }, [shouldHold]);

  const releaseLock = useCallback(async () => {
    const sentinel = sentinelRef.current;
    sentinelRef.current = null;
    if (!sentinel || sentinel.released) return;
    try {
      await sentinel.release();
    } catch {
      // ignore
    }
  }, []);

  const requestLock = useCallback(async () => {
    if (typeof document === "undefined") return;
    if (document.visibilityState !== "visible") return;
    if (!shouldHoldRef.current) {
      await releaseLock();
      return;
    }

    const nav = navigator as WakeLockNavigator;
    if (!nav.wakeLock?.request) return;

    try {
      if (sentinelRef.current && !sentinelRef.current.released) return;
      const sentinel = await nav.wakeLock.request("screen");
      sentinelRef.current = sentinel;
      sentinel.addEventListener(
        "release",
        () => {
          if (sentinelRef.current === sentinel) {
            sentinelRef.current = null;
          }
        },
        { once: true },
      );
    } catch {
      // Not allowed / unsupported — leave Windows power settings in charge
    }
  }, [releaseLock]);

  const syncWakeLock = useCallback(() => {
    if (shouldHoldRef.current) {
      void requestLock();
    } else {
      void releaseLock();
    }
  }, [requestLock, releaseLock]);

  useEffect(() => {
    syncWakeLock();
  }, [shouldHold, syncWakeLock]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        syncWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      void releaseLock();
    };
  }, [syncWakeLock, releaseLock]);

  return { syncWakeLock };
}
