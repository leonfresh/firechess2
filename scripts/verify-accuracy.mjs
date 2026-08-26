import fs from "fs";

// Extract the REAL computeScanReportMeta source from lib/scan-session.ts —
// guarantees we test the exact deployed code, not a copy. Node 25 strips
// TypeScript natively when importing .ts.
const src = fs.readFileSync("./lib/scan-session.ts", "utf8");
const helperIdx = src.indexOf("export function computeEndgameTechniqueScore");
const start = helperIdx !== -1 ? helperIdx : src.indexOf("export function computeScanReportMeta");
const end = src.indexOf("export function", src.indexOf("export function computeScanReportMeta") + 10);
const fnSrc = src.slice(start, end === -1 ? src.length : end);
fs.writeFileSync("./scripts/_compute-meta.ts", fnSrc);
const { computeScanReportMeta } = await import("./_compute-meta.ts");

const ids = {
  d88ee0a8: ["Hikaru", "d88ee0a8-2686-4c9a-9100-cb5c7c6a0068"],
  "4aa88749": ["Magnus", "4aa88749-ca3b-430e-9d03-f7dca08eadf2"],
  "8c8d499e": ["Gotham", "8c8d499e-1f04-4121-aabc-71a818b98ce6"],
  bbacb94a: ["Botez", "bbacb94a-f71b-47f3-84ab-39d5696c1925"],
  f16a5e29: ["supersecret", "f16a5e29-532c-4ee8-ba00-52fb01c20b3f"],
  "56577c6f": ["imrosen", "56577c6f-114d-4231-a141-6bcfe9c80d88"],
  "45315c3e": ["big_tonka", "45315c3e-c79f-465d-973a-c629f7a341fd"],
  "6ee89e5c": ["xqcow", "6ee89e5c-d93a-4c1b-b813-fa8a1f0df340"],
  "5ec6e272": ["turbofisto", "5ec6e272-4a2e-4c7e-afa5-7c4cc0462619"],
};

console.log(`${"name".padEnd(12)} ${"rtg".padEnd(6)} ${"OLD".padEnd(9)} ${"NEW".padEnd(7)} ${"estRtg".padEnd(7)} label`);
for (const [short, [name, full]] of Object.entries(ids)) {
  const d = await (await fetch(`https://www.firechess.com/api/scans/${full}?guestToken=public`)).json();
  const scan = d.scan;
  const fresh = computeScanReportMeta(scan.result, scan.config?.cpThreshold ?? 200);
  const old = scan.reportMeta?.estimatedAccuracy;
  const acc = fresh.estimatedAccuracy;
  const label = acc >= 92 ? "exceptional" : acc >= 88 ? "strong" : acc >= 83 ? "solid" : acc >= 78 ? "moderate" : "developing";
  console.log(
    `${name.padEnd(12)} ${String(scan.result.playerRating).padEnd(6)} ${String(old).slice(0, 7).padEnd(9)} ${acc.toFixed(1).padEnd(7)} ${String(fresh.estimatedRating).padEnd(7)} ${label}`,
  );
}
