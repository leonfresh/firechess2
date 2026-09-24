"use client";
import {setChaosIdentity} from "@/lib/chaos-client-identity";
import {setDiscordSdk} from "./discord-sdk";
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
  const {code} = await sdk.commands.authorize({client_id:clientId,response_type:'code',state:'',prompt:'none',scope:['identify']});
  // Launch context travels with the handshake so traffic can be attributed to a server, and a
  // share-link launch to the player who shared it (referrerId) and the link's customId.
  const response = await fetch('/api/chaos/discord-token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,guildId:sdk.guildId,channelId:sdk.channelId,instanceId:sdk.instanceId,referrerId:sdk.referrerId,customId:sdk.customId,locationId:sdk.locationId})});
  const signed = await response.json();
  if (!response.ok) throw new Error(signed.error || 'Discord sign-in failed');
  await sdk.commands.authenticate({access_token:signed.access_token});
  setChaosIdentity(signed.identity);
}

export function connectDiscord() { return connection ??= handshake().catch(error => { connection = undefined; throw error; }); }
