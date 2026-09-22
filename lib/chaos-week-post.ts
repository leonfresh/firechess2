/**
 * Discord payload for the Chaos Chess Game of the Week. Lives in lib (not the
 * route) so the cron route, a script or a manual test all build the same post.
 */
import { getChaosWeek } from './chaos-week';

export const CHAOS_SITE = () =>
  (process.env.NEXT_PUBLIC_APP_URL || 'https://www.firechess.com').replace(/\/$/, '');

/** The score lib only knows sides ("White"/"Black"); Discord readers want names. */
const named = (headline: string, white: string, black: string) =>
  headline.replace(/^White — /, `${white} — `).replace(/^Black — /, `${black} — `);

export async function buildWeekPost(origin = CHAOS_SITE()) {
  const week = await getChaosWeek();
  const winner = week.winner;
  if (!winner) return { skipped: 'No archived Chaos games in the window' };
  const cardUrl = `${origin}/api/chaos/week/image?days=7&v=${week.weekKey}`;
  const weekUrl = `${origin}/chaos/week`;
  const replayUrl = `${origin}/chaos/replay/${winner.roomId}`;
  const podium = week.podium
    .map(
      (entry, index) =>
        `**${index + 1}.** ${named(entry.headline, entry.white, entry.black)} — \`${entry.score} ${entry.tier}\``,
    )
    .join('\n');
  return {
    payload: {
      embeds: [
        {
          title: `🎴 Game of the Week — ${named(winner.headline, winner.white, winner.black)}`,
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
    },
    weekKey: week.weekKey,
    headline: named(winner.headline, winner.white, winner.black),
  };
}

/** POST the built embed to the configured webhook. Returns null when unset. */
export async function postWeekToDiscord() {
  const built = await buildWeekPost();
  if (!('payload' in built)) return built;
  const webhook = process.env.CHAOS_DISCORD_WEBHOOK || process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) return { skipped: 'CHAOS_DISCORD_WEBHOOK is not set', ...built };
  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(built.payload),
  });
  if (!response.ok) {
    return { error: 'Discord rejected the post', status: response.status, body: (await response.text()).slice(0, 300) };
  }
  return { posted: true, weekKey: built.weekKey, headline: built.headline };
}
