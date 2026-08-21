import { redirect } from "next/navigation";
import { AdminClient } from "@/components/AdminClient";
import { isAdminAuthenticated } from "@/lib/auth-server";
import { todayDateString, weekStartMonday } from "@/lib/date";
import { listEntriesForWeek, isDemoMode } from "@/lib/schedule/service";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    // In demo mode without ADMIN_PASSWORD, allow access for local testing
    if (!(isDemoMode() && !process.env.ADMIN_PASSWORD)) {
      redirect("/admin/login");
    }
  }

  const today = todayDateString();
  const monday = weekStartMonday(today);
  const client = isDemoMode() || !hasServiceRole() ? null : createServiceClient();
  const entries = await listEntriesForWeek(client, monday);

  return (
    <AdminClient
      initialMonday={monday}
      initialToday={today}
      initialEntries={entries}
      demoMode={isDemoMode()}
    />
  );
}
