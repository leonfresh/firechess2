import React from "react";

/** Convert an emoji string to its Twemoji 14 CDN SVG URL. */
function twemojiUrl(emoji: string): string {
  const points = [...emoji]
    .map((c) => c.codePointAt(0)!.toString(16))
    .filter((cp) => cp !== "fe0f"); // strip variation selector-16
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${points.join("-")}.svg`;
}

/**
 * Renders an emoji as a Twemoji SVG image — identical on all platforms,
 * including iOS where native emoji rendering can be inconsistent.
 * Use Tailwind size classes (e.g. `w-6 h-6`) for sizing.
 */
export function Emoji({
  emoji,
  className,
  style,
}: {
  emoji: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <img
      src={twemojiUrl(emoji)}
      alt={emoji}
      className={className}
      style={{ display: "inline-block", verticalAlign: "-0.125em", ...style }}
      draggable={false}
    />
  );
}
