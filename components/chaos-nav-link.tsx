"use client";
import Link from "next/link";
import {useEffect, useState, type ComponentProps} from "react";

/** `href` with Discord's launch context carried over, for navigating from code (browser only). */
export function chaosHref(href: string): string {
  const current = new URLSearchParams(window.location.search);
  const next = new URL(href, window.location.origin);
  if (current.has('frame_id')) for (const key of ['frame_id','instance_id','platform','guild_id','channel_id']) {
    const value = current.get(key);
    if (value) next.searchParams.set(key,value);
  }
  return next.pathname + next.search + next.hash;
}

/** Keep Discord's launch context when navigating or refreshing an Activity page. */
export function ChaosNavLink({href, ...props}: Omit<ComponentProps<typeof Link>, 'href'> & {href:string}) {
  const [target, setTarget] = useState(href);
  useEffect(() => { setTarget(chaosHref(href)); }, [href]);
  return <Link {...props} href={target} />;
}
