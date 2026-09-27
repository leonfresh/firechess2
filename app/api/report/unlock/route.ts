/**
 * GET /api/report/unlock?scanId=… — whether the signed-in user bought a one-off unlock for this report.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasReportUnlock } from "@/lib/report-unlock";

export async function GET(req: NextRequest) {
  const scanId = req.nextUrl.searchParams.get("scanId");
  const session = await auth();
  if (!scanId || !session?.user?.id) return NextResponse.json({ unlocked: false });
  return NextResponse.json({ unlocked: await hasReportUnlock(session.user.id, scanId) });
}
