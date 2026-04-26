import { NextResponse } from "next/server";
import { turso } from "@/lib/turso";

// Lightweight ping to wake the Turso DB from sleep before the user loads a puzzle
export async function GET() {
  try {
    await turso.execute("SELECT 1");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
