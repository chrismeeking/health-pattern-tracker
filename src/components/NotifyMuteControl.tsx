"use client";

import { useCallback, useState } from "react";

const STORAGE_KEY = "homeboard-notify-muted";

type Props = {
  className?: string;
  onMuteChange?: (muted: boolean) => void;
};

function readMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function NotifyMuteControl({ className = "", onMuteChange }: Props) {
  const [muted, setMuted] = useState(readMuted);

  const toggle = useCallback(() => {
    unlockNotifyAudio();
    setMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      onMuteChange?.(next);
      return next;
    });
  }, [onMuteChange]);

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl bg-white/80 px-2.5 text-sm font-semibold text-[var(--muted)] shadow-sm ring-1 ring-black/5 active:scale-[0.98] ${className}`}
      aria-label={muted ? "Unmute notifications" : "Mute notifications"}
      title={muted ? "Notifications muted" : "Notification sound on"}
    >
      {muted ? (
        <span aria-hidden="true">Mute</span>
      ) : (
        <span aria-hidden="true">Sound</span>
      )}
    </button>
  );
}

export function isNotifyMuted(): boolean {
  return readMuted();
}

let audioUnlocked = false;

/** Call after a user gesture so later pings are allowed by the browser. */
export function unlockNotifyAudio(): void {
  if (audioUnlocked || typeof window === "undefined") return;
  audioUnlocked = true;
  try {
    const audio = new Audio("/sounds/notify-ping.wav");
    audio.volume = 0;
    void audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
      })
      .catch(() => {
        // Still blocked — ignore; next gesture may succeed
        audioUnlocked = false;
      });
  } catch {
    audioUnlocked = false;
  }
}

/** Play the local ping once; never throws. Overlay still works if blocked. */
export function playNotifyPing(muted: boolean): void {
  if (muted || typeof window === "undefined") return;
  try {
    const audio = new Audio("/sounds/notify-ping.wav");
    audio.volume = 0.35;
    void audio.play().catch(() => {
      // Autoplay blocked until interaction — visual notify still shows
    });
  } catch {
    // ignore
  }
}
