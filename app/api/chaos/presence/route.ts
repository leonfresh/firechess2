/**
 * POST /api/chaos/presence — Heartbeat: upsert presence, return online count + list
 *
 * Body: (none) — uses session user info automatically.
 * Response: { onlineCount, users: { id, name, image }[] }
 *
 * A user is considered "online" if their lastSeen is within the past 60 seconds.
 */

import { NextRequest, NextResponse } from "next/server";
import { getChaosUserId } from "@/lib/chaos-auth";
import { db } from "@/lib/db";
import { chaosPresence, chaosPlayers, users } from "@/lib/schema";
import { gte, eq } from "drizzle-orm";

const ONLINE_THRESHOLD_MS = 60_000; // 60 seconds

export async function POST(req: NextRequest) {
  const userId = await getChaosUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Look up the user's chaos username
  const [userRow] = await db
    .select({
      chaosUsername: users.chaosUsername,
      name: users.name,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const [player] = await db.select({name: chaosPlayers.name}).from(chaosPlayers).where(eq(chaosPlayers.id, userId)).limit(1);
  const displayName =
    userRow?.chaosUsername ?? userRow?.name ?? player?.name ?? "Guest player";
  const displayImage = userRow?.image ?? null;

  // Upsert our presence
  await db
    .insert(chaosPresence)
    .values({
      userId: userId,
      userName: displayName,
      userImage: displayImage,
      lastSeen: now,
    })
    .onConflictDoUpdate({
      target: chaosPresence.userId,
      set: {
        userName: displayName,
        userImage: displayImage,
        lastSeen: now,
      },
    });

  // Count online users (lastSeen ≥ 60s ago)
  const cutoff = new Date(now.getTime() - ONLINE_THRESHOLD_MS);
  const onlineUsers = await db
    .select({
      id: chaosPresence.userId,
      name: chaosPresence.userName,
      image: chaosPresence.userImage,
    })
    .from(chaosPresence)
    .where(gte(chaosPresence.lastSeen, cutoff));

  return NextResponse.json({
    onlineCount: onlineUsers.length,
    users: onlineUsers,
  });
}
