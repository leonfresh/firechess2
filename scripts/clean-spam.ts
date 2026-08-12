/**
 * One-shot: delete existing spam from the feedback table.
 * Spam pattern: guest entries (userId=null) with random-character names/profiles.
 * Usage: npx tsx scripts/clean-spam.ts
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

const DB_URL = process.env.DATABASE_URL_UNPOOLED!;
const url = new URL(DB_URL);
const NSQL = `https://${url.hostname}/sql`;

async function query(sql: string) {
  const res = await fetch(NSQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": DB_URL,
    },
    body: JSON.stringify({ query: sql, params: [] }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

/** True if text looks like random gibberish: long random strings, no real words */
function isGibberish(s: string | null): boolean {
  if (!s || s.length < 5) return false;
  // Has real words (spaces + readable chunks)? Probably not spam.
  const words = s.split(/\s+/).filter((w) => w.length > 2);
  if (words.length >= 2) return false;
  // Single long chunk of mixed-case random chars = bot
  const firstWord = words[0] ?? s;
  if (firstWord.length > 12 && /^[a-zA-Z]{8,}$/.test(firstWord)) return true;
  // Random-looking mixed case with no vowels
  if (firstWord.length > 8 && !/[aeiou]{2,}/i.test(firstWord)) return true;
  return false;
}

async function main() {
  // Pull all guest entries with their messages
  const result = await query(
    `SELECT id, email, subject, message FROM feedback WHERE "userId" IS NULL ORDER BY "createdAt" DESC`,
  );

  const rows = result.rows as {
    id: string;
    email: string | null;
    subject: string | null;
    message: string;
  }[];

  // Parse the message to extract name and profile
  const spamIds: string[] = [];
  const keep: typeof rows = [];

  for (const r of rows) {
    const lines = r.message.split("\n").filter(Boolean);
    const profileLine = lines.find((l) => l.startsWith("Coach profile:") || l.startsWith("Channel/profile:")) ?? "";
    const nameLine = lines.find((l) => l.startsWith("Name:")) ?? "";
    const body = lines.filter((l) => !l.startsWith("Coach profile:") && !l.startsWith("Channel/profile:") && !l.startsWith("Name:") && l.trim());

    const profile = profileLine.replace(/^(Coach profile|Channel\/profile):\s*/, "").trim();
    const name = nameLine.replace(/^Name:\s*/, "").trim();
    const subject = r.subject ?? "";

    // Flag as spam if name OR profile OR subject is gibberish
    const nameSpam = isGibberish(name) || (name.length > 0 && name.length < 3);
    const profileSpam = isGibberish(profile) || (profile.includes("(not provided)") ? false : profile.length > 0 && profile.length < 4);
    const subjectSpam = isGibberish(subject);

    if (nameSpam || profileSpam || subjectSpam) {
      spamIds.push(r.id);
      console.log(`  SPAM | ${r.id.slice(0, 8)} | ${r.email ?? "-"} | ${subject.slice(0, 30)} | ${name.slice(0, 20)} | ${profile.slice(0, 25)}`);
    } else {
      keep.push(r);
      console.log(`  KEEP | ${r.id.slice(0, 8)} | ${r.email ?? "-"} | ${subject.slice(0, 30)} | ${name.slice(0, 20)} | ${profile.slice(0, 25)}`);
    }
  }

  console.log(`\nSpam: ${spamIds.length}, Legit: ${keep.length}`);

  if (spamIds.length === 0) {
    console.log("Nothing to delete.");
    return;
  }

  // Delete
  const idList = spamIds.map((id) => `'${id}'`).join(", ");
  await query(`DELETE FROM feedback WHERE id IN (${idList})`);
  console.log(`Deleted ${spamIds.length} spam entries.`);
}

main().catch(console.error);
