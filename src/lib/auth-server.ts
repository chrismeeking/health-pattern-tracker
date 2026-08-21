import { cookies } from "next/headers";
import { getAdminCookieName, verifySessionToken } from "@/lib/auth";

export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const store = await cookies();
    return await verifySessionToken(store.get(getAdminCookieName())?.value);
  } catch {
    return false;
  }
}
