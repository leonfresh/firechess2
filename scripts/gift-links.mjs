#!/usr/bin/env node
/**
 * Gift-link helper — list and create Pro/Lifetime gift links from the terminal.
 *
 *   node scripts/gift-links.mjs                                  # list every gift link
 *   node scripts/gift-links.mjs --create "Anthony" --uses 25     # permanent Pro, 25 uses
 *   node scripts/gift-links.mjs --create "Coach demo" --uses 5 --days 30
 *   node scripts/gift-links.mjs --create "Launch gift" --uses 10 --lifetime
 *   node scripts/gift-links.mjs --revoke <token>                 # revoke by token
 *
 * Mirrors app/api/admin/gift/route.ts (same token generator, same columns).
 * Reads .env.local directly, prints no secrets. Standalone: Node + fetch only.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = name => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const has = name => argv.includes(`--${name}`);
const SITE = 'https://www.firechess.com';

const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split(/\r?\n/).filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; }),
);
const DB_URL = env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL;
if (!DB_URL) throw new Error('DATABASE_URL_UNPOOLED missing from .env.local');
const host = new URL(DB_URL).hostname;

async function q(sql, params = []) {
  const res = await fetch(`https://${host}/sql`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Neon-Connection-String': DB_URL},
    body: JSON.stringify({query: sql, params}),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return (await res.json()).rows;
}

/** Same shape as the admin API's generateToken(): 12 chars of base36. */
function generateToken() {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(36).padStart(2, '0')).join('').slice(0, 12);
}

function status(r) {
  if (r.revokedAt) return 'revoked';
  if (r.expiresAt && new Date(r.expiresAt) < new Date()) return 'expired';
  if (r.usedCount >= r.maxUses) return 'exhausted';
  return 'ACTIVE';
}

function duration(days) {
  if (!days) return 'permanent';
  if (days % 365 === 0) return `${days / 365}y`;
  if (days % 30 === 0) return `${days / 30}mo`;
  return `${days}d`;
}

const createLabel = arg('create');
const revokeToken = arg('revoke');

if (createLabel) {
  const uses = Number(arg('uses') ?? 50);
  const days = arg('days') ? Number(arg('days')) : null;
  const plan = has('lifetime') ? 'lifetime' : 'pro';
  const token = generateToken();
  const [row] = await q(
    `insert into gift_link (id, label, token, "maxUses", "usedCount", "planType", "durationDays", "createdAt")
     values (gen_random_uuid()::text, $1, $2, $3, 0, $4, $5, now()) returning *`,
    [createLabel, token, uses, plan, days],
  );
  console.log(`created: ${row.label} — ${row.planType}, ${duration(row.durationDays)}, ${row.maxUses} uses`);
  console.log(`${SITE}/gift/${row.token}`);
} else if (revokeToken) {
  const rows = await q(`update gift_link set "revokedAt" = now() where token = $1 returning label`, [revokeToken]);
  console.log(rows.length ? `revoked: ${rows[0].label}` : 'no link with that token');
} else {
  const rows = await q(
    `select label, token, "maxUses", "usedCount", "planType", "durationDays", "expiresAt", "revokedAt", "createdAt"
     from gift_link order by "createdAt" desc`,
  );
  if (!rows.length) console.log('no gift links yet');
  for (const r of rows) {
    const flag = status(r);
    console.log(
      `${flag.padEnd(9)} ${r.label.padEnd(28)} ${r.planType.padEnd(8)} ${duration(r.durationDays).padEnd(9)} ` +
      `${r.usedCount}/${r.maxUses} uses  ${SITE}/gift/${r.token}`,
    );
  }
  console.log(`\n${rows.length} link(s).`);
}
