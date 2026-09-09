import { NextRequest, NextResponse } from 'next/server';
import { getSharedMatch } from '@/lib/chaos-share';
export async function GET(req: NextRequest) {
  const match = await getSharedMatch(req.nextUrl.searchParams.get('match') ?? '');
  return NextResponse.json(match ?? {error:'Game not found'}, {status:match ? 200 : 404, headers:{'Cache-Control':'no-store'}});
}
