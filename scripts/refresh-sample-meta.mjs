import fs from "fs";
import pg from "pg";

// Extract the REAL computeScanReportMeta (+ helper) from lib/scan-session.ts
const src = fs.readFileSync("./lib/scan-session.ts", "utf8");
const helperIdx = src.indexOf("export function computeEndgameTechniqueScore");
const start = helperIdx !== -1 ? helperIdx : src.indexOf("export function computeScanReportMeta");
const end = src.indexOf("export function", src.indexOf("export function computeScanReportMeta") + 10);
fs.writeFileSync("./scripts/_compute-meta.ts", src.slice(start, end === -1 ? src.length : end));
const { computeScanReportMeta } = await import("./_compute-meta.ts");

// Load DATABASE_URL_UNPOOLED
const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const client = new pg.Client({ connectionString: env.DATABASE_URL_UNPOOLED, ssl: { rejectUnauthorized: false } });
await client.connect();

const ids = [
  "d88ee0a8-2686-4c9a-9100-cb5c7c6a0068",
  "4aa88749-ca3b-430e-9d03-f7dca08eadf2",
  "8c8d499e-1f04-4121-aabc-71a818b98ce6",
  "bbacb94a-f71b-47f3-84ab-39d5696c1925",
  "f16a5e29-532c-4ee8-ba00-52fb01c20b3f",
  "56577c6f-114d-4231-a141-6bcfe9c80d88",
  "45315c3e-c79f-465d-973a-c629f7a341fd",
  "6ee89e5c-d93a-4c1b-b813-fa8a1f0df340",
  "5ec6e272-4a2e-4c7e-afa5-7c4cc0462619",
];

const { rows } = await client.query(
  `SELECT id, "chessUsername", result, config FROM scan_session WHERE id = ANY($1::text[])`,
  [ids],
);

console.log(`${"name".padEnd(14)} ${"acc".padEnd(7)} ${"estRtg".padEnd(7)} ${"wcp".padEnd(7)} label`);
for (const row of rows) {
  const fresh = computeScanReportMeta(row.result, row.config?.cpThreshold ?? 200);
  if (!fresh) {
    console.log(row.chessUsername, "-> NO META (no loss sample)");
    continue;
  }
  const acc = fresh.estimatedAccuracy;
  const label = acc >= 92 ? "exceptional" : acc >= 88 ? "strong" : acc >= 83 ? "solid" : acc >= 78 ? "moderate" : "developing";
  await client.query(
    `UPDATE scan_session SET "reportMeta" = $1, "updatedAt" = now() WHERE id = $2`,
    [JSON.stringify(fresh), row.id],
  );
  console.log(
    `${(row.chessUsername ?? "?").padEnd(14)} ${acc.toFixed(1).padEnd(7)} ${String(fresh.estimatedRating).padEnd(7)} ${fresh.weightedCpLoss.toFixed(1).padEnd(7)} ${label}`,
  );
}
console.log("Updated", rows.length, "sample reports");
await client.end();
