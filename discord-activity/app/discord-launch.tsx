'use client';

import { useEffect, useState } from 'react';

export function DiscordLaunch() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const embedded = new URLSearchParams(window.location.search).has('frame_id')
      || window.location.hostname.endsWith('.discordsays.com');
    setShow(!embedded);
  }, []);

  if (!show) return null;
  return <a className="discord-launch-link" title="Play on Discord" href="https://discord.com/activities/1546003954616500245" target="_blank" rel="noopener noreferrer" aria-label="Play on Discord (opens in a new tab)">
      <svg viewBox="0 0 24 24" width="23" height="23" fill="currentColor" aria-hidden="true"><path d="M19.7 5.2a18 18 0 0 0-4.4-1.4l-.6 1.3a16.5 16.5 0 0 0-5.4 0l-.6-1.3a18 18 0 0 0-4.4 1.4C1.5 9.3.8 13.3 1.2 17.2a18 18 0 0 0 5.4 2.7l1.1-1.8-1.7-.8.4-.3a13 13 0 0 0 11.2 0l.4.3-1.7.8 1.1 1.8a18 18 0 0 0 5.4-2.7c.5-4.5-.8-8.5-3.1-12ZM8.5 14.6c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm7 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z"/></svg>
      <span>Play on Discord</span>
    </a>;
}
