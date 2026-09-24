"use client";
import {setChaosIdentity} from "@/lib/chaos-client-identity";
import {PRESENCE_OPT_IN_KEY, setDiscordSdk, setPresenceGranted} from "./discord-sdk";
// A single handshake survives React Strict Mode and client navigation.
let connection: Promise<void> | undefined;
async function handshake() {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  if (!clientId) throw new Error('Set NEXT_PUBLIC_DISCORD_CLIENT_ID in discord-activity/.env.local, then restart the Activity.');
  const { DiscordSDK, patchUrlMappings } = await import('@discord/embedded-app-sdk');
  const partyHost = (process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999').replace(/^https?:\/\//, '').replace(/\/$/, '');
  patchUrlMappings([
    { prefix: '/.proxy/party', target: partyHost },
    { prefix: '/.proxy/jsdelivr', target: 'cdn.jsdelivr.net' },
    { prefix: '/.proxy/chess-images', target: 'images.chesscomfiles.com' },
  ], { patchSrcAttributes: true });
  const sdk = new DiscordSDK(clientId);
  await sdk.ready();
  setDiscordSdk(sdk);
  activeSdk = sdk;
  // Players who opted into rich presence already granted rpc.activities.write, so ask for it again
  // silently. If that fails (revoked, or a new device's prompt rules), sign in exactly as before.
  const wantsPresence = (() => { try { return localStorage.getItem(PRESENCE_OPT_IN_KEY) === 'on'; } catch { return false; } })();
  let code: string, presence = false;
  try {
    ({code} = await sdk.commands.authorize({client_id:clientId,response_type:'code',state:'',prompt:'none',scope:wantsPresence ? ['identify','rpc.activities.write'] : ['identify']}));
    presence = wantsPresence;
  } catch (error) {
    if (!wantsPresence) throw error;
    ({code} = await sdk.commands.authorize({client_id:clientId,response_type:'code',state:'',prompt:'none',scope:['identify']}));
  }
  await exchange(sdk, code);
  setPresenceGranted(presence);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let activeSdk: any;

/** Trade an authorize code for a Discord token and our signed identity, then authenticate the SDK. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function exchange(sdk: any, code: string) {
  // Launch context travels with the handshake so traffic can be attributed to a server, and a
  // share-link launch to the player who shared it (referrerId) and the link's customId.
  const response = await fetch('/api/chaos/discord-token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,guildId:sdk.guildId,channelId:sdk.channelId,instanceId:sdk.instanceId,referrerId:sdk.referrerId,customId:sdk.customId,locationId:sdk.locationId})});
  const signed = await response.json();
  if (!response.ok) throw new Error(signed.error || 'Discord sign-in failed');
  await sdk.commands.authenticate({access_token:signed.access_token});
  setChaosIdentity(signed.identity);
}

/**
 * Lobby opt-in: ask Discord (with its consent screen) to let us set rich presence, so friends see
 * "vs Sam · Nuclear Queen" instead of just "Playing Chaos Chess". Resolves false if declined.
 */
export async function enableRichPresence(): Promise<boolean> {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  if (!activeSdk || !clientId) return false;
  try {
    const {code} = await activeSdk.commands.authorize({client_id:clientId,response_type:'code',state:'',scope:['identify','rpc.activities.write']});
    await exchange(activeSdk, code);
    setPresenceGranted(true);
    try { localStorage.setItem(PRESENCE_OPT_IN_KEY, 'on'); } catch {}
    return true;
  } catch { return false; }
}

/** Stop sending custom details. Discord keeps showing the plain "Playing Chaos Chess". */
export function disableRichPresence() {
  setPresenceGranted(false);
  try { localStorage.removeItem(PRESENCE_OPT_IN_KEY); } catch {}
  void activeSdk?.commands.setActivity({activity:{type:0}}).catch(() => {});
}

export function connectDiscord() { return connection ??= handshake().catch(error => { connection = undefined; throw error; }); }
