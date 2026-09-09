import { createHmac, timingSafeEqual } from "node:crypto";

// Room-scoped credentials let the gateway forward authenticated commands
// without receiving a user's site session cookie.
export function createLiveToken(roomId: string, userId: string) {
  const secret = process.env.CHAOS_LIVE_SECRET;
  if (!secret) throw new Error("Live hosting is not configured");
  const payload = Buffer.from(JSON.stringify({ roomId, userId, exp: Date.now() + 2 * 60 * 60_000 })).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}

export function readLiveToken(token: string, roomId: string): string | null {
  try {
    const secret = process.env.CHAOS_LIVE_SECRET;
    if (!secret || token.length > 2048) return null;
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra) return null;
    const expected = createHmac("sha256", secret).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.roomId === roomId && typeof data.userId === "string" && data.exp > Date.now() ? data.userId : null;
  } catch { return null; }
}

export async function notifyLiveRoom(roomId: string, deadline?: number | null, revision?: number) {
  const origin = process.env.CHAOS_LIVE_ORIGIN, secret = process.env.CHAOS_LIVE_SECRET;
  if (!origin || !secret) return;
  try {
    const response = await fetch(new URL(`/notify?roomId=${encodeURIComponent(roomId)}`, origin), {
      method: "POST", headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" }, body: JSON.stringify({deadline, revision}), signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) console.warn("Chaos live notification rejected", response.status);
  } catch { console.warn("Chaos live notification unavailable; clients will reconcile"); }
}
