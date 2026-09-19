/**
 * Discord Activity launch context.
 *
 * The Activity SDK knows which server, channel and activity instance a player launched from.
 * /api/chaos/discord-token records it on each handshake so traffic can be attributed to a server
 * instead of guessed at. Everything is untrusted client input: malformed values are dropped, never
 * stored.
 */

export type ChaosLaunch = {
  guildId: string | null;
  channelId: string | null;
  instanceId: string | null;
};

const SNOWFLAKE = /^\d{17,20}$/;
const INSTANCE = /^[\w.-]{1,64}$/;

/** Keep only well-formed Discord ids from the handshake body. */
export function normalizeChaosLaunch(input: unknown): ChaosLaunch {
  const source = (input ?? {}) as Record<string, unknown>;
  const snowflake = (value: unknown) => (typeof value === "string" && SNOWFLAKE.test(value) ? value : null);
  return {
    guildId: snowflake(source.guildId),
    channelId: snowflake(source.channelId),
    instanceId: typeof source.instanceId === "string" && INSTANCE.test(source.instanceId) ? source.instanceId : null,
  };
}
