import { db } from "./db";
import { chaosPlayerUnlock } from "./schema";
import { inArray } from "drizzle-orm";
/** Snapshot collections at the start of each game, never from a client payload. */
export async function loadOpeningOwnership(host: string, guest: string) {
 const rows=await db.select().from(chaosPlayerUnlock).where(inArray(chaosPlayerUnlock.playerId,[host,guest]));
 return {host:rows.filter(r=>r.playerId===host).map(r=>r.modifierId),guest:rows.filter(r=>r.playerId===guest).map(r=>r.modifierId)};
}
