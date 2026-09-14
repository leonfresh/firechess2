import { NextRequest, NextResponse } from 'next/server';
import { getChaosUserId } from '@/lib/chaos-auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const id = await getChaosUserId(req);
  const result = id && !id.startsWith('guest_') ? await db.execute(sql`select name from chaos_player where id=${id}`) : null;
  return NextResponse.json({ player: result?.rows[0] ? { id, name: result.rows[0].name } : null }, { headers: { 'Cache-Control': 'no-store' } });
}
