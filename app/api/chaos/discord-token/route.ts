import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {sql} from 'drizzle-orm';
import {signDiscordIdentity} from '@/lib/chaos-discord-identity';
export async function POST(req: NextRequest) {
  const headers = {'Cache-Control': 'no-store'};
  try {
    const raw = await req.text();
    if (raw.length > 4096) return NextResponse.json({error:'Invalid code'}, {status:400,headers});
    const {code} = JSON.parse(raw);
    if (typeof code !== 'string' || !code || code.length > 2048) return NextResponse.json({error:'Invalid code'}, {status:400,headers});
    const clientId = process.env.CHAOS_DISCORD_CLIENT_ID, secret = process.env.CHAOS_DISCORD_CLIENT_SECRET;
    if (!clientId || !secret) return NextResponse.json({error:'Discord sign-in is being configured. Please try again later.'}, {status:503,headers});
    const response = await fetch('https://discord.com/api/oauth2/token', {method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId,client_secret:secret,grant_type:'authorization_code',code}),signal:AbortSignal.timeout(8000)});
    if (!response.ok) return NextResponse.json({error:'Discord authorization expired. Reopen the Activity.'}, {status:401,headers});
    const token = await response.json();
    const profileResponse = await fetch('https://discord.com/api/v10/users/@me', {headers:{Authorization:`Bearer ${token.access_token}`},signal:AbortSignal.timeout(8000)});
    if (!profileResponse.ok) throw new Error('Identity lookup failed');
    const user = await profileResponse.json();
    if (!/^\d{17,20}$/.test(user.id)) throw new Error('Invalid identity');
    const id = `discord_${user.id}`, name = String(user.global_name || user.username || 'Player').slice(0,80);
    await db.execute(sql`insert into chaos_player (id, name) values (${id}, ${name}) on conflict (id) do update set name=excluded.name`);
    return NextResponse.json({access_token:token.access_token, identity:signDiscordIdentity(id), player:{id,name}}, {headers});
  } catch { return NextResponse.json({error:'Could not sign in to Discord. Please try again.'}, {status:503,headers}); }
}
