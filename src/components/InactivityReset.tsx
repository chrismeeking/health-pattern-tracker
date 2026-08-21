"use client";

import { useCallback, useEffect, useRef } from "react";

type Props = {
  /** Milliseconds of inactivity before calling onReset. */
  timeoutMs: number;
  onReset: () => void;
  enabled?: boolean;
};

/**
 * After a quiet stretch on the kiosk, return the display to the current week.
 */
export function InactivityReset({
  timeoutMs,
  onReset,
  enabled = true,
}: Props) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bump = useCallback(() => {
    if (!enabled) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onReset();
    }, timeoutMs);
  }, [enabled, onReset, timeoutMs]);

  useEffect(() => {
    if (!enabled) return;
    const events = ["pointerdown", "touchstart", "keydown"] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    bump();
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      if (timer.current) clearTimeout(timer.current);
    };
  }, [bump, enabled]);

  return null;
}
