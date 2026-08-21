"use client";

import { useEffect, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { LONDON_TZ } from "@/lib/date";

type Props = {
  className?: string;
};

function londonTimeLabel(reference = new Date()): string {
  return formatInTimeZone(reference, LONDON_TZ, "HH:mm");
}

/** Compact Europe/London clock for the public NCR board. */
export function LondonClock({ className = "" }: Props) {
  const [label, setLabel] = useState(() => londonTimeLabel());

  useEffect(() => {
    const tick = () => setLabel(londonTimeLabel());
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  return (
    <time
      dateTime={label}
      title="Europe/London"
      className={`tabular-nums text-sm font-semibold tracking-wide text-[var(--muted)] sm:text-base ${className}`}
    >
      {label}
    </time>
  );
}
