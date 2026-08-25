import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

// Lightweight ping to wake the DB from suspend before the user loads a puzzle
export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
