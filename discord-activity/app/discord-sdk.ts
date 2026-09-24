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
  customId?: string | null;
  referrerId?: string | null;
  commands: {
    openInviteDialog: () => Promise<unknown>;
    shareLink: (args: {message: string; custom_id?: string}) => Promise<{success: boolean}>;
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

/** The share-link tag this instance was launched from, e.g. "join:ABC234"; null for a normal launch. */
export function discordCustomId(): string | null { return sdk?.customId || null; }

/**
 * Share a link that launches Chaos Chess for a friend and drops them into our waiting room. Discord
 * records us as the link's referrer, so their launch is attributed to this invite.
 */
export async function shareInvite(roomCode: string): Promise<boolean> {
  try {
    const result = await sdk?.commands.shareLink({message: 'Come play Chaos Chess with me. I am waiting in the lobby!', custom_id: `join:${roomCode}`});
    return !!result?.success;
  } catch { return false; }
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
