import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { chaosRooms } from "@/lib/schema";
import { getChaosUserId } from "@/lib/chaos-auth";
import { readLiveToken, notifyLiveRoom } from "@/lib/chaos-live-token";
import { metadata, reduceCommand, snapshot, settleRoom, nextDeadline, SyncError, type SyncRoom } from "@/lib/chaos-room-sync";

export const dynamic = "force-dynamic";
const reply = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { "Cache-Control": "no-store" } });
async function readRoom(id: string, user: string) {
  const [room] = await db.select().from(chaosRooms).where(eq(chaosRooms.id, id));
  if (!room) throw new SyncError(404, "Room not found");
  if (user !== "__chaos_alarm__" && room.hostId !== user && room.guestId !== user) throw new SyncError(403, "Not in this room");
  return room;
}
function response(room: SyncRoom, user: string, since: number) {
  const meta = metadata(room);
  const actor = room.hostId === user ? "host" : "guest";
  const opponent = actor === "host" ? "guest" : "host";
  return { revision: meta.revision, stateRevision: meta.stateRevision, actor,
    events: meta.events.filter(e => e.revision > since),
    gap: since >= 0 && meta.events.length > 0 && since < meta.events[0].revision - 1,
    opponentPick: meta.picks[opponent], myPick: meta.picks[actor],
    snapshot: snapshot(room) };
}
function requestTiming() {
  const start = performance.now();
  const durations: Record<string, number> = {};
  return {
    async measure<T>(name: string, work: () => T | Promise<T>): Promise<T> {
      const began = performance.now();
      try { return await work(); }
      finally { durations[name] = (durations[name] ?? 0) + performance.now() - began; }
    },
    reply(value: unknown, status = 200) {
      const result = reply(value, status);
      result.headers.set("Server-Timing", Object.entries({ ...durations, total: performance.now() - start })
        .map(([name, duration]) => `${name};dur=${duration.toFixed(1)}`).join(", "));
      return result;
    },
  };
}
export async function GET(req: NextRequest) {
  const timing = requestTiming();
  try {
    const id = req.nextUrl.searchParams.get("roomId");
    if (!id) return timing.reply({ error: "Missing room" }, 400);
    const token = req.headers.get("x-chaos-live-token");
    const alarm = !!process.env.CHAOS_LIVE_SECRET && req.headers.get("x-chaos-gateway-secret") === process.env.CHAOS_LIVE_SECRET && req.headers.get("x-chaos-alarm") === "1";
    const user = alarm ? "__chaos_alarm__" : token ? readLiveToken(token, id) : await getChaosUserId(req);
    if (!user) return timing.reply({ error: "Unauthorized" }, 401);
    let room = await timing.measure("read", () => readRoom(id, user));
    for (let attempt = 0; attempt < 5; attempt++) {
      const patch = settleRoom(room);
      if (!patch) break;
      const changed = await timing.measure("write", () => db.update(chaosRooms).set(patch).where(and(
        eq(chaosRooms.id, room.id),
        sql`coalesce((${chaosRooms.chaosState}->'_sync'->>'revision')::integer, 0) = ${metadata(room).revision}`,
      )).returning({id: chaosRooms.id}));
      if (changed.length) {
        room = {...room, ...patch};
        (process as NodeJS.EventEmitter).emit("chaos:commit", room.id);
        if (!alarm) await timing.measure("notify", () => notifyLiveRoom(room.id, nextDeadline(room), metadata(room).revision));
        break;
      }
      room = await timing.measure("read", () => readRoom(id, user));
    }
    if (req.nextUrl.searchParams.get("history") === "1") return timing.reply({
      current: { ...snapshot(room), moves: room.moveHistory }, previous: metadata(room).games ?? [],
    });
    return timing.reply(response(room, user, Number(req.nextUrl.searchParams.get("since") ?? -1)));
  } catch (e) {
    if (e instanceof SyncError) return timing.reply({ error: e.message }, e.status);
    return timing.reply({ error: "Could not load room" }, 503);
  }
}
export async function POST(req: NextRequest) {
  const timing = requestTiming();
  try {
    const raw = await req.text();
    if (raw.length > 100_000) return timing.reply({ error: "Action too large" }, 413);
    let body: any;
    try { body = JSON.parse(raw); } catch { return timing.reply({ error: "Invalid JSON" }, 400); }
    if (typeof body?.roomId !== "string") return timing.reply({ error: "Missing room" }, 400);
    const token = req.headers.get("x-chaos-live-token");
    const user = token ? readLiveToken(token, body.roomId) : await getChaosUserId(req);
    if (!user) return timing.reply({ error: "Unauthorized" }, 401);
    for (let attempt = 0; attempt < 5; attempt++) {
      const room = await timing.measure("read", () => readRoom(body.roomId, user));
      let patch;
      try { patch = await timing.measure("rules", () => reduceCommand(room, user, body)); }
      catch (e) {
        if (e instanceof SyncError) {
          console.warn("chaos.action_rejected", {roomId: room.id, revision: metadata(room).revision,
            action: typeof body.message?.type === "string" ? body.message.type.slice(0,40) : "unknown", reason: e.message});
          return timing.reply({ error: e.message, ...response(room, user, body.since ?? -1) }, e.status);
        }
        throw e;
      }
      if (!patch) return timing.reply(response(room, user, body.since ?? -1));
      const changed = await timing.measure("write", () => db.update(chaosRooms).set(patch).where(and(
        eq(chaosRooms.id, room.id),
        sql`coalesce((${chaosRooms.chaosState}->'_sync'->>'revision')::integer, 0) = ${metadata(room).revision}`,
      )).returning({ id: chaosRooms.id }));
      if (changed.length) {
        // The persistent Node server wakes subscribed clients only after commit.
        // Serverless deployments have no listener and retain HTTP recovery.
        (process as NodeJS.EventEmitter).emit("chaos:commit", room.id);
        // The authenticated gateway broadcasts its own successful commit reply.
        // HTTP clients still need the callback to wake their socket opponents.
        const viaGateway = !!process.env.CHAOS_LIVE_SECRET && req.headers.get("x-chaos-gateway-secret") === process.env.CHAOS_LIVE_SECRET;
        if (!viaGateway) await timing.measure("notify", () => notifyLiveRoom(room.id, nextDeadline({...room, ...patch}), metadata({...room, ...patch}).revision));
        return timing.reply(response({ ...room, ...patch }, user, body.since ?? -1));
      }
    }
    return timing.reply({ error: "Room is busy; retry this action" }, 503);
  } catch (e) {
    if (e instanceof SyncError) return timing.reply({ error: e.message }, e.status);
    console.error("Chaos sync failed", e instanceof Error ? e.message : "Unknown error");
    return timing.reply({ error: "Could not save action" }, 503);
  }
}
