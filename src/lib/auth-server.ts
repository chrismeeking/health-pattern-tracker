import { cookies } from "next/headers";
import {
  getAdminCookieName,
  verifySessionToken,
  verifyApiKey,
} from "@/lib/auth";

export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const store = await cookies();
    return await verifySessionToken(store.get(getAdminCookieName())?.value);
  } catch {
    return false;
  }
}

/** Prefer request Cookie header in Route Handlers (most reliable for admin UI fetch). */
export async function isAdminAuthenticatedFromRequest(
  request: Request,
): Promise<boolean> {
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const name = getAdminCookieName();
    const match = cookieHeader
      .split(";")
      .map((p) => p.trim())
      .find((p) => p.startsWith(`${name}=`));
    if (match) {
      const value = decodeURIComponent(match.slice(name.length + 1));
      if (await verifySessionToken(value)) return true;
    }
  }
  return isAdminAuthenticated();
}

/** Admin session cookie OR integration API key. */
export async function authorizeScheduleMutation(
  request: Request,
): Promise<boolean> {
  const apiKey =
    request.headers.get("x-api-key") ?? request.headers.get("authorization");
  if (verifyApiKey(apiKey)) return true;
  return isAdminAuthenticatedFromRequest(request);
}
