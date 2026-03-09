/**
 * GET  /api/chaos/lobby — Fetch recent chat messages + online count
 * POST /api/chaos/lobby — Send a chat message
 *
 * GET response:  { messages: [...], onlineCount }
 * POST body:     { message: string }
 * POST response: { ok: true }
 *
 * Messages are limited to the last 50.
 * Online count is derived from chaosPresence (lastSeen ≤ 30s).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chaosLobbyMessages, chaosPresence } from "@/lib/schema";
import { gte, desc, sql } from "drizzle-orm";

const ONLINE_THRESHOLD_MS = 30_000;
const MAX_MESSAGES = 50;
const MAX_MSG_LENGTH = 200;
const RATE_LIMIT_MS = 1_500; // 1.5s cooldown

// Simple in-memory rate-limit per userId
const lastMsgTime = new Map<string, number>();

export async function GET() {
  const cutoff = new Date(Date.now() - ONLINE_THRESHOLD_MS);

  // Fetch messages + online count in parallel
  const [messages, onlineResult] = await Promise.all([
    db
      .select({
        id: chaosLobbyMessages.id,
        userId: chaosLobbyMessages.userId,
        userName: chaosLobbyMessages.userName,
        userImage: chaosLobbyMessages.userImage,
        message: chaosLobbyMessages.message,
        createdAt: chaosLobbyMessages.createdAt,
      })
      .from(chaosLobbyMessages)
      .orderBy(desc(chaosLobbyMessages.createdAt))
      .limit(MAX_MESSAGES),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(chaosPresence)
      .where(gte(chaosPresence.lastSeen, cutoff)),
  ]);

  return NextResponse.json({
    messages: messages.reverse(), // oldest first
    onlineCount: onlineResult[0]?.count ?? 0,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit
  const now = Date.now();
  const last = lastMsgTime.get(session.user.id) ?? 0;
  if (now - last < RATE_LIMIT_MS) {
    return NextResponse.json({ error: "Too fast" }, { status: 429 });
  }

  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message || message.length > MAX_MSG_LENGTH) {
    return NextResponse.json(
      { error: `Message must be 1-${MAX_MSG_LENGTH} characters` },
      { status: 400 },
    );
  }

  lastMsgTime.set(session.user.id, now);

  await db.insert(chaosLobbyMessages).values({
    userId: session.user.id,
    userName: session.user.name ?? "Anonymous",
    userImage: session.user.image ?? null,
    message,
  });

  return NextResponse.json({ ok: true });
}
