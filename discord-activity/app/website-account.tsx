'use client';
import { useChaosAccount } from '@/lib/use-chaos-account';

export function WebsiteAccount() {
  const { data, isLoading, error } = useChaosAccount();
  const name = data?.player?.name;
  // Signed in: the link switches account (e.g. Google to Lichess) instead of reusing the session.
  return <a className="sound-button" href={`https://www.firechess.com/api/chaos/website-login${name ? '?switch=1' : ''}`} title={name ? 'Switch to another FireChess account' : 'Uses your FireChess account and Chaos username. Discord is optional.'}>
    {isLoading ? 'Checking account…' : name ? `Signed in: ${name}` : error ? 'Check FireChess sign-in' : 'Sign in with FireChess'}
  </a>;
}
