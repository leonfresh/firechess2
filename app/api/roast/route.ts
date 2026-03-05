/**
 * /api/roast — stub route
 *
 * The roast page fetches games directly from the Lichess API client-side.
 * This route exists only as a potential future proxy if needed.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    message: "The roast page fetches games directly from Lichess. This endpoint is a placeholder.",
  });
}
