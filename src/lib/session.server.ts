import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";

const COOKIE = "fed_session";
const MAX_AGE = 60 * 60 * 8;

export type SessionUser = {
  id: number;
  email: string;
  full_name: string;
  role_id: number;
  state_id: number | null;
  district_id: number | null;
  status: string;
};

function secret(): string {
  const value = process.env["SESSION_SECRET"];
  if (!value) throw new Error("SESSION_SECRET is not configured");
  return value;
}

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(input: string): Uint8Array {
  const s = atob(input.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return b64url(new Uint8Array(sig));
}

export async function issueSession(user: SessionUser): Promise<void> {
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ ...user, exp: Date.now() + MAX_AGE * 1000 })));
  const token = `${payload}.${await sign(payload)}`;
  setResponseHeader(
    "Set-Cookie",
    `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${MAX_AGE}`,
  );
}

export function clearSession(): void {
  setResponseHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`);
}

export async function readSession(): Promise<SessionUser | null> {
  const header = getRequestHeader("cookie") ?? "";
  const raw = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  if ((await sign(payload)) !== signature) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as SessionUser & {
      exp: number;
    };
    if (!data.exp || data.exp < Date.now()) return null;
    const { exp: _exp, ...user } = data;
    return user;
  } catch {
    return null;
  }
}

export async function requireUser(roles?: number[]): Promise<SessionUser> {
  const user = await readSession();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (user.status !== "approved") throw new Error("NOT_APPROVED");
  if (roles && !roles.includes(user.role_id)) throw new Error("FORBIDDEN");
  return user;
}
