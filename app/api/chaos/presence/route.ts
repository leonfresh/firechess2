/**
 * POST /api/chaos/presence — Heartbeat: upsert presence, return online count + list
 *
 * Body: (none) — uses session user info automatically.
 * Response: { onlineCount, users: { id, name, image }[] }
 *
 * A user is considered "online" if their lastSeen is within the past 30 seconds.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chaosPresence } from "@/lib/schema";
import { gte } from "drizzle-orm";

const ONLINE_THRESHOLD_MS = 30_000; // 30 seconds

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Upsert our presence
  await db
    .insert(chaosPresence)
    .values({
      userId: session.user.id,
      userName: session.user.name ?? "Anonymous",
      userImage: session.user.image ?? null,
      lastSeen: now,
    })
    .onConflictDoUpdate({
      target: chaosPresence.userId,
      set: {
        userName: session.user.name ?? "Anonymous",
        userImage: session.user.image ?? null,
        lastSeen: now,
      },
    });

  // Count online users (lastSeen ≥ 30s ago)
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
