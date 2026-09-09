import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function getSharedMatch(id: string) {
  if (!id || id.length > 150) return null;
  const data = await db.execute(sql`select m.id,m.winner,m.reason,m.host_color,m.rated,m.record,
    coalesce(h.name,'Guest player') as host,coalesce(g.name,'Guest player') as guest
    from chaos_match m left join chaos_player h on h.id=m.host_id
    left join chaos_player g on g.id=m.guest_id
    where m.id=${id} or m.room_id=${id} order by m.game_number desc limit 1`);
  const m = data.rows[0];
  if (!m) return null;
  const record = m.record as any;
  const white = String(m.host_color === 'white' ? m.host : m.guest).slice(0, 40);
  const black = String(m.host_color === 'black' ? m.host : m.guest).slice(0, 40);
  return { id: String(m.id), white, black,
    title: m.winner === 'draw' ? 'Two rivals. One draw.' : `${m.winner === 'white' ? white : black} takes the crown!`,
    reason: String(m.reason).slice(0, 100), rated: !!m.rated,
    moves: Array.isArray(record.moves) ? record.moves.length : 0,
    powers: (record.state?.playerModifiers?.length ?? 0) + (record.state?.aiModifiers?.length ?? 0),
    time: record.timeControlSeconds > 0 ? `${record.timeControlSeconds / 60}+${record.incrementSeconds ?? 0}` : 'No rush',
  };
}

