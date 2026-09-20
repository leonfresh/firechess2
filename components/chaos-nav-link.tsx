"use client";
import Link from "next/link";
import {useEffect, useState, type ComponentProps} from "react";

/** Keep Discord's launch context when navigating or refreshing an Activity page. */
export function ChaosNavLink({href, ...props}: Omit<ComponentProps<typeof Link>, 'href'> & {href:string}) {
  const [target, setTarget] = useState(href);
  useEffect(() => {
    const current = new URLSearchParams(window.location.search);
    const next = new URL(href, window.location.origin);
    if (current.has('frame_id')) for (const key of ['frame_id','instance_id','platform','guild_id','channel_id']) {
      const value = current.get(key);
      if (value) next.searchParams.set(key,value);
    }
    setTarget(next.pathname + next.search + next.hash);
  }, [href]);
  return <Link {...props} href={target} />;
}
