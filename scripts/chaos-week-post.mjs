#!/usr/bin/env node
/**
 * Chaos Chess — Game of the Week → Discord.
 *
 * Reads the already-deployed JSON API (no DB credentials needed) and posts an
 * embed with the Game of the Week card as the image, plus the top 5 of the week.
 *
 *   CHAOS_DISCORD_WEBHOOK="https://discord.com/api/webhooks/…" \
 *     node scripts/chaos-week-post.mjs
 *
 * Flags:
 *   --dry          print the payload instead of posting
 *   --origin=URL   site origin (default https://www.firechess.com)
 *   --days=7       scoring window
 *   --mention=@here prepend a mention line
 */
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : fallback;
};
const dry = args.includes('--dry');
const origin = flag('origin', process.env.CHAOS_SITE_ORIGIN || 'https://www.firechess.com').replace(/\/$/, '');
const days = flag('days', '7');
const mention = flag('mention', '');
const webhook = process.env.CHAOS_DISCORD_WEBHOOK || process.env.DISCORD_WEBHOOK_URL || '';

const api = await fetch(`${origin}/api/chaos/week?days=${days}`, { headers: { accept: 'application/json' } });
if (!api.ok) {
  console.error(`Week API failed: ${api.status} ${api.statusText}`);
  process.exit(1);
}
const week = await api.json();
const winner = week.winner;
if (!winner) {
  console.log('No archived games in the window — nothing to post.');
  process.exit(0);
}

const cardUrl = `${origin}/api/chaos/week/image?days=${days}&v=${week.weekKey}`;
const replayUrl = `${origin}/chaos/replay/${winner.roomId}`;
const weekUrl = `${origin}/chaos/week`;

const podium = (week.podium || [])
  .map((entry, index) => `**${index + 1}.** ${entry.headline} — \`${entry.score} ${entry.tier}\``)
  .join('\n');

const payload = {
  content: mention ? `${mention} Game of the Week is up.` : undefined,
  embeds: [
    {
      title: `🎴 Game of the Week — ${winner.headline}`,
      url: weekUrl,
      description: `${winner.white} vs ${winner.black} · ${winner.plies} plies · ${winner.timeControl}${
        winner.rated ? ' · rated' : ''
      }\n**Chaos Score ${winner.score} (${winner.tier})** — ${winner.blurb}`,
      color: 0xd7fa64,
      image: { url: cardUrl },
      fields: [
        { name: 'Top 5 this week', value: podium.slice(0, 1000) || 'n/a', inline: false },
        { name: 'Watch the replay', value: replayUrl, inline: false },
      ],
      footer: { text: `Chaos Chess · ${week.gamesScored} games scored · ${week.weekKey}` },
    },
  ],
};

if (dry || !webhook) {
  if (!webhook && !dry) console.error('CHAOS_DISCORD_WEBHOOK is not set — printing the payload instead of posting.');
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

const response = await fetch(webhook, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(payload),
});
if (!response.ok) {
  console.error(`Discord post failed: ${response.status} ${await response.text()}`);
  process.exit(1);
}
console.log(`Posted Game of the Week (${week.weekKey}) to Discord: ${winner.headline}`);
