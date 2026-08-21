import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, getAdminCookieName } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(getAdminCookieName())?.value;
    const authed = await verifySessionToken(token);

    const demoOpen =
      process.env.HOMEBOARD_DEMO_MODE === "true" ||
      (!process.env.ADMIN_PASSWORD &&
        (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
          !process.env.SUPABASE_SERVICE_ROLE_KEY));

    if (!authed && !demoOpen) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
