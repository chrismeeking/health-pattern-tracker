import { NextResponse } from "next/server";
import {
  checkAdminPassword,
  createSessionToken,
  getAdminCookieName,
  getAdminCookieOptions,
} from "@/lib/auth";
import { z } from "zod";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = z.object({ password: z.string().min(1) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  if (!process.env.ADMIN_PASSWORD) {
    console.error("[auth/login] ADMIN_PASSWORD is not configured");
    return NextResponse.json(
      { error: "Admin login is not configured" },
      { status: 503 },
    );
  }

  if (!checkAdminPassword(parsed.data.password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(getAdminCookieName(), token, getAdminCookieOptions());
  return response;
}
