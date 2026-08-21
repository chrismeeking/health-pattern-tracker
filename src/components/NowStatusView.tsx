"use client";

import { getEmployerTheme } from "@/lib/employers";
import type { NowStatus } from "@/lib/schedule/now-status";

type Props = {
  status: NowStatus;
};

function Line({
  text,
  emphasis,
  color,
}: {
  text: string;
  emphasis?: "hero" | "strong" | "muted";
  color?: string;
}) {
  if (emphasis === "hero") {
    return (
      <p
        className="font-[family-name:var(--font-display)] text-[clamp(2.4rem,7vw,4.5rem)] font-semibold leading-[1.05] tracking-tight"
        style={{ color: color ?? "var(--ink)" }}
      >
        {text}
      </p>
    );
  }
  if (emphasis === "strong") {
    return (
      <p
        className="text-[clamp(1.5rem,3.8vw,2.6rem)] font-semibold leading-snug"
        style={{ color: color ?? "var(--ink)" }}
      >
        {text}
      </p>
    );
  }
  return (
    <p className="text-[clamp(1.25rem,3vw,2rem)] font-medium leading-snug text-[var(--muted)]">
      {text}
    </p>
  );
}

export function NowStatusView({ status }: Props) {
  const theme = status.primaryEmployer
    ? getEmployerTheme(status.primaryEmployer)
    : null;
  const evening = status.phase === "finished";

  return (
    <section className="now-view flex h-full min-h-0 flex-1 flex-col justify-center overflow-hidden rounded-[1.5rem] bg-white/90 px-6 py-5 shadow-sm ring-1 ring-black/5 sm:px-10 sm:py-8">
      <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--accent)] sm:text-base">
        {status.eyebrow}
      </p>

      <div className="mt-3 space-y-1 sm:mt-4 sm:space-y-2">
        {status.lines.map((line, i) => (
          <Line
            key={`${line.text}-${i}`}
            text={line.text}
            emphasis={line.emphasis}
            color={
              i === 0 && theme && status.phase !== "travelling_home" && !evening
                ? theme.accent
                : undefined
            }
          />
        ))}
      </div>

      {status.next && status.next.length > 0 ? (
        <div
          className={
            evening
              ? "mt-5 rounded-2xl bg-[var(--panel)]/90 px-4 py-4 sm:mt-7 sm:px-6 sm:py-5"
              : "mt-6 border-t border-black/10 pt-4 sm:mt-8 sm:pt-6"
          }
        >
          {status.next.map((line, i) => (
            <div key={`${line.label ?? ""}-${line.text}-${i}`} className="mb-1">
              {line.label ? (
                <p
                  className={
                    evening
                      ? "text-sm font-bold uppercase tracking-[0.22em] text-[var(--accent)] sm:text-base"
                      : "text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)] sm:text-sm"
                  }
                >
                  {line.label}
                </p>
              ) : null}
              <Line
                text={line.text}
                emphasis={
                  evening && i === 0
                    ? "hero"
                    : (line.emphasis ?? "strong")
                }
              />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
