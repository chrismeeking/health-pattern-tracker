/**
 * Edge-safe session helpers (usable from middleware + Node).
 */
const COOKIE_NAME = "homeboard_admin";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

function getAuthSecret(): string | null {
  return process.env.AUTH_SECRET ?? process.env.ADMIN_PASSWORD ?? null;
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

export async function createSessionToken(): Promise<string> {
  const secret = getAuthSecret();
  if (!secret) throw new Error("AUTH_SECRET or ADMIN_PASSWORD must be set");
  const issuedAt = Date.now().toString();
  const sig = await hmacHex(secret, issuedAt);
  return `${issuedAt}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false;
  const secret = getAuthSecret();
  if (!secret) return false;

  const [issuedAt, sig] = token.split(".");
  if (!issuedAt || !sig) return false;

  const age = Date.now() - Number(issuedAt);
  if (!Number.isFinite(age) || age < 0 || age > ADMIN_COOKIE_MAX_AGE * 1000) {
    return false;
  }

  const expected = await hmacHex(secret, issuedAt);
  return timingSafeEqualStr(sig, expected);
}

export function getAdminCookieName() {
  return COOKIE_NAME;
}

export function getAdminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  };
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return timingSafeEqualStr(password, expected);
}

export function verifyApiKey(headerValue: string | null): boolean {
  const expected =
    process.env.HOMEBOARD_API_KEY ?? process.env.SCHEDULE_API_KEY;
  if (!expected || !headerValue) return false;
  const provided = headerValue.startsWith("Bearer ")
    ? headerValue.slice(7)
    : headerValue;
  return timingSafeEqualStr(provided, expected);
}
