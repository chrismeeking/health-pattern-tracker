import { NextResponse } from "next/server";
import { schedulePayloadSchema } from "@/lib/schedule/schema";
import { upsertEntry, deleteEntry, listEntriesByRange, isDemoMode } from "@/lib/schedule/service";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/server";
import { verifyApiKey } from "@/lib/auth";
import { isAdminAuthenticated } from "@/lib/auth-server";
import { weekDatesFromMonday, weekStartMonday } from "@/lib/date";
import { z } from "zod";

export const dynamic = "force-dynamic";

async function authorize(request: Request): Promise<boolean> {
  const apiKey =
    request.headers.get("x-api-key") ?? request.headers.get("authorization");
  if (verifyApiKey(apiKey)) return true;
  // Allow cookie-authenticated admin (browser admin UI)
  return isAdminAuthenticated();
}

function getClient() {
  if (isDemoMode()) return null;
  if (!hasServiceRole()) return null;
  return createServiceClient();
}

/** Public read — household display has no login. Mutations stay protected. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let rangeFrom = from;
  let rangeTo = to;

  if (week) {
    const monday = weekStartMonday(week);
    const dates = weekDatesFromMonday(monday);
    rangeFrom = dates[0];
    rangeTo = dates[6];
  }

  if (!rangeFrom || !rangeTo) {
    return NextResponse.json(
      { error: "Provide week=YYYY-MM-DD or from & to" },
      { status: 400 },
    );
  }

  try {
    const client = getClient();
    const entries = await listEntriesByRange(client, rangeFrom, rangeTo);
    return NextResponse.json({
      entries,
      from: rangeFrom,
      to: rangeTo,
      demo: isDemoMode(),
    });
  } catch (err) {
    console.error("[api/schedule GET]", err);
    return NextResponse.json({ error: "Failed to load schedule" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schedulePayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const items = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
  const client = getClient();
  const results = [];

  for (const item of items) {
    const result = await upsertEntry(client, item);
    results.push(result);
  }

  const hasError = results.some((r) => r.status === "error");
  return NextResponse.json(
    {
      results,
      demo: isDemoMode(),
    },
    { status: hasError ? 207 : 200 },
  );
}

export async function DELETE(request: Request) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const schema = z.object({
    id: z.string().uuid().optional(),
    source: z.string().optional(),
    source_reference: z.string().optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const client = getClient();

  if (parsed.data.id) {
    const result = await deleteEntry(client, parsed.data.id);
    return NextResponse.json({ result, demo: isDemoMode() });
  }

  if (parsed.data.source && parsed.data.source_reference) {
    const result = await upsertEntry(client, {
      date: "1970-01-01",
      employer: "Other",
      work_mode: "Off",
      source: parsed.data.source as "chatgpt",
      source_reference: parsed.data.source_reference,
      cancelled: true,
      location: null,
      start_time: null,
      end_time: null,
      expected_home_time: null,
      household_note: null,
      priority: 0,
      is_all_day: false,
      manual_override: false,
    });
    return NextResponse.json({ result, demo: isDemoMode() });
  }

  return NextResponse.json(
    { error: "Provide id or source + source_reference" },
    { status: 400 },
  );
}
