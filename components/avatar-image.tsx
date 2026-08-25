"use client";

import { useState } from "react";

/**
 * Avatar <img> that renders the initial-letter badge when the image URL is
 * missing OR fails to load. OAuth avatar URLs (Google etc.) go stale and
 * previously showed the broken-image icon — reported Aug 2026.
 */
export function AvatarImg({
  src,
  alt = "",
  className,
  fallback,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  fallback: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <>{fallback}</>;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
