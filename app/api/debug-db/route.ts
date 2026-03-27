import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await db.execute(sql`SELECT 1 as ok`);
    return Response.json({ ok: true, result });
  } catch (err: any) {
    // Expose the full error chain so we can see the real NeonDbError details
    return Response.json(
      {
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
          table: err?.cause?.table,
          column: err?.cause?.column,
          constraint: err?.cause?.constraint,
        },
        causeCause: {
          message: err?.cause?.cause?.message,
          name: err?.cause?.cause?.name,
          severity: err?.cause?.cause?.severity,
          code: err?.cause?.cause?.code,
          detail: err?.cause?.cause?.detail,
          hint: err?.cause?.cause?.hint,
        },
      },
      { status: 500 },
    );
  }
}
