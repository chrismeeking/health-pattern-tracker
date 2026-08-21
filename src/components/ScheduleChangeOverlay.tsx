"use client";

import type { ScheduleNotification } from "@/lib/schedule/change-detect";

type Props = {
  notification: ScheduleNotification;
};

export function ScheduleChangeOverlay({ notification }: Props) {
  return (
    <div
      className="schedule-notify absolute inset-0 z-30 flex items-center justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div className="notify-card w-full max-w-[920px] rounded-[1.75rem] px-6 py-7 text-center shadow-[0_20px_60px_rgba(28,36,40,0.18)] sm:px-10 sm:py-10">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--accent)] sm:text-base">
          {notification.title}
        </p>
        {notification.subtitle ? (
          <p className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.8rem,5vw,3rem)] font-semibold tracking-tight text-[var(--ink)]">
            {notification.subtitle}
          </p>
        ) : null}
        <div className="mt-4 space-y-1 sm:mt-5 sm:space-y-1.5">
          {notification.lines.map((line, i) => (
            <p
              key={`${line}-${i}`}
              className={
                i === 0
                  ? "text-[clamp(1.6rem,4.5vw,2.8rem)] font-bold uppercase tracking-tight text-[var(--ink)]"
                  : i === notification.lines.length - 1 &&
                      line === "CANCELLED"
                    ? "text-[clamp(1.4rem,3.5vw,2.2rem)] font-semibold tracking-wide text-[#9a3b3b]"
                    : "text-[clamp(1.25rem,3.2vw,2rem)] font-medium text-[var(--muted)]"
              }
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
