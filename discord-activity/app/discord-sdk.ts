'use client';

/**
 * Thin wrapper around Discord's embedded app SDK.
 *
 * The SDK instance is created inside the module-memoized handshake in `activity.tsx`, so lobby and
 * result UI reach it through here instead of threading it down as props. Every call is defensive:
 * outside Discord (preview mode, the plain website, a failed handshake) it degrades to an empty
 * no-op rather than throwing.
 */

export type DiscordParticipant = {
  id: string;
  username?: string;
  global_name?: string | null;
  nickname?: string | null;
  avatar?: string | null;
};

type Sdk = {
  instanceId?: string;
  guildId?: string | null;
  channelId?: string | null;
  commands: {
    openInviteDialog: () => Promise<unknown>;
    getInstanceConnectedParticipants: () => Promise<{participants: DiscordParticipant[]}>;
  };
};

let sdk: Sdk | undefined;

export function setDiscordSdk(instance: unknown) { sdk = instance as Sdk; }
export function discordInstanceId(): string | null { return sdk?.instanceId || null; }
export function discordGuildId(): string | null { return sdk?.guildId || null; }

export function participantLabel(participant: DiscordParticipant): string {
  return participant.nickname || participant.global_name || participant.username || 'Player';
}

/** Opens Discord's native invite dialog so the whole voice channel can join this instance. */
export async function inviteToInstance(): Promise<boolean> {
  try { await sdk?.commands.openInviteDialog(); return true; } catch { return false; }
}

/** Everyone currently connected to this activity instance (empty outside a channel launch). */
export async function connectedParticipants(): Promise<DiscordParticipant[]> {
  try {
    const result = await sdk?.commands.getInstanceConnectedParticipants();
    return result?.participants ?? [];
  } catch { return []; }
}
