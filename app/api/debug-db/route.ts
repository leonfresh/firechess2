import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token || token !== process.env.DEBUG_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const result = await db.execute(sql`SELECT 1 as ok`);
    return Response.json({ ok: true, result });
  } catch (err: any) {
    return Response.json({
      ok: false,
      message: err?.message,
      cause: {
        message: err?.cause?.message,
        name: err?.cause?.name,
        severity: err?.cause?.severity,
        code: err?.cause?.code,
        detail: err?.cause?.detail,
        hint: err?.cause?.hint,
        routine: err?.cause?.routine,
      },
    }, { status: 500 });
  }
}
