import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const url = readFileSync(".env.local", "utf8")
  .match(/DATABASE_URL=(.+)/)?.[1]?.trim();

const sql = neon(url);
await sql`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS "guestToken" text`;
console.log("done");
