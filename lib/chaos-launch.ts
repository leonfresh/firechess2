/**
 * Discord Activity launch context.
 *
 * The Activity SDK knows which server, channel and activity instance a player launched from, and,
 * for a launch from a share link, who shared it (referrerId) and the link's customId.
 * /api/chaos/discord-token records it on each handshake so traffic can be attributed to a server
 * or an inviting player instead of guessed at. Everything is untrusted client input: malformed
 * values are dropped, never stored.
 */

export type ChaosLaunch = {
  guildId: string | null;
  channelId: string | null;
  instanceId: string | null;
  /** Discord user id of whoever shared the link this launch came from. */
  referrerId: string | null;
  /** Our own tag on a share link, e.g. "join:ABC234" from the lobby's invite button. */
  customId: string | null;
  locationId: string | null;
};

const SNOWFLAKE = /^\d{17,20}$/;
const INSTANCE = /^[\w.-]{1,64}$/;
const CUSTOM = /^[\w:.-]{1,64}$/;
/** Six-character room code in the alphabet the matchmaker generates. */
const ROOM_CODE = /^[A-Z0-9]{6}$/;

/** Keep only well-formed Discord ids from the handshake body. */
export function normalizeChaosLaunch(input: unknown): ChaosLaunch {
  const source = (input ?? {}) as Record<string, unknown>;
  const snowflake = (value: unknown) => (typeof value === "string" && SNOWFLAKE.test(value) ? value : null);
  return {
    guildId: snowflake(source.guildId),
    channelId: snowflake(source.channelId),
    instanceId: typeof source.instanceId === "string" && INSTANCE.test(source.instanceId) ? source.instanceId : null,
    referrerId: snowflake(source.referrerId),
    customId: typeof source.customId === "string" && CUSTOM.test(source.customId) ? source.customId : null,
    locationId: snowflake(source.locationId),
  };
}

/** Invite links carry the inviter's waiting room: "join:CODE" (Discord customId) or ?join=CODE. */
export function inviteJoinCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.replace(/^join:/, "").toUpperCase();
  return ROOM_CODE.test(code) ? code : null;
}
