import type { Viewport } from "next";
import { DashboardClient } from "@/components/DashboardClient";
import { todayDateString, weekStartMonday } from "@/lib/date";
import { listEntriesForWeek, isDemoMode } from "@/lib/schedule/service";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Keep NCR kiosk from accidental pinch-zoom; admin does not inherit this. */
export const viewport: Viewport = {
  themeColor: "#2a7a6e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function HomePage() {
  const today = todayDateString();
  const monday = weekStartMonday(today);
  const client = isDemoMode() || !hasServiceRole() ? null : createServiceClient();
  const entries = await listEntriesForWeek(client, monday);
  const inactivityMs = Number(
    process.env.NEXT_PUBLIC_INACTIVITY_RESET_MS ?? 5 * 60 * 1000,
  );

  return (
    <DashboardClient
      initialMonday={monday}
      initialToday={today}
      initialEntries={entries}
      demoMode={isDemoMode()}
      inactivityMs={Number.isFinite(inactivityMs) ? inactivityMs : 300_000}
    />
  );
}
