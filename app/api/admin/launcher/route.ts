/**
 * GET  /api/admin/launcher — Returns the current admin-set global launcher default.
 * PUT  /api/admin/launcher — Updates the global default (admin only).
 *   Body: { grid: string[], dock: string[] }
 * DELETE /api/admin/launcher — Resets the global default (admin only).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_LAUNCHER, type LauncherConfig } from "@/lib/launcher-apps";

const LAUNCHER_KEY = "launcher_default";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [row] = await db
    .select({ value: siteConfig.value })
    .from(siteConfig)
    .where(eq(siteConfig.key, LAUNCHER_KEY))
    .limit(1);

  return NextResponse.json({ config: row?.value ?? DEFAULT_LAUNCHER });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !Array.isArray((body as LauncherConfig).grid) ||
    !Array.isArray((body as LauncherConfig).dock)
  ) {
    return NextResponse.json({ error: "Invalid config shape" }, { status: 400 });
  }

  const config = body as LauncherConfig;
  const sanitized: LauncherConfig = {
    grid: config.grid.filter((id) => typeof id === "string" && id.length <= 64).slice(0, 20),
    dock: config.dock.filter((id) => typeof id === "string" && id.length <= 64).slice(0, 6),
  };

  await db
    .insert(siteConfig)
    .values({ key: LAUNCHER_KEY, value: sanitized })
    .onConflictDoUpdate({
      target: siteConfig.key,
      set: { value: sanitized, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(siteConfig).where(eq(siteConfig.key, LAUNCHER_KEY));

  return NextResponse.json({ ok: true });
}
