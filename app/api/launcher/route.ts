/**
 * GET  /api/launcher — Returns the active launcher config for the current user.
 *   - Authenticated: user's own config, or the admin-set default, or the hardcoded default.
 *   - Unauthenticated: admin-set default, or hardcoded default.
 *
 * PUT  /api/launcher — Saves the current user's launcher config (requires auth).
 *   Body: { grid: string[], dock: string[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, siteConfig } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_LAUNCHER, type LauncherConfig } from "@/lib/launcher-apps";

/* ------------------------------------------------------------------ */
/*  GET /api/launcher                                                   */
/* ------------------------------------------------------------------ */

export async function GET() {
  const session = await auth();

  // 1. If authenticated and user has their own config, return it.
  if (session?.user?.id) {
    const [row] = await db
      .select({ launcherConfig: users.launcherConfig })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (row?.launcherConfig) {
      return NextResponse.json({ config: row.launcherConfig, source: "user" });
    }
  }

  // 2. Try the admin-set global default.
  const [row] = await db
    .select({ value: siteConfig.value })
    .from(siteConfig)
    .where(eq(siteConfig.key, "launcher_default"))
    .limit(1);

  if (row?.value) {
    return NextResponse.json({ config: row.value, source: "admin" });
  }

  // 3. Fall back to the hardcoded default.
  return NextResponse.json({ config: DEFAULT_LAUNCHER, source: "default" });
}

/* ------------------------------------------------------------------ */
/*  PUT /api/launcher                                                   */
/* ------------------------------------------------------------------ */

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate shape: must have grid and dock arrays of strings
  if (
    typeof body !== "object" ||
    body === null ||
    !Array.isArray((body as LauncherConfig).grid) ||
    !Array.isArray((body as LauncherConfig).dock)
  ) {
    return NextResponse.json({ error: "Invalid config shape" }, { status: 400 });
  }

  const config = body as LauncherConfig;

  // Sanitize: only allow strings, max reasonable lengths
  const sanitized: LauncherConfig = {
    grid: config.grid.filter((id) => typeof id === "string" && id.length <= 64).slice(0, 20),
    dock: config.dock.filter((id) => typeof id === "string" && id.length <= 64).slice(0, 6),
  };

  await db
    .update(users)
    .set({ launcherConfig: sanitized })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ ok: true });
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/launcher — resets user config back to default          */
/* ------------------------------------------------------------------ */

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db
    .update(users)
    .set({ launcherConfig: null })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ ok: true });
}
