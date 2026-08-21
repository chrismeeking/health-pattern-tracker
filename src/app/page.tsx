import { DashboardClient } from "@/components/DashboardClient";
import { todayDateString, weekStartMonday } from "@/lib/date";
import { listEntriesForWeek, isDemoMode } from "@/lib/schedule/service";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
