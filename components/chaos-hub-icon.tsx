import type { CSSProperties } from "react";
export function ChaosHubIcon({
  kind,
}: {
  kind: "leaderboard" | "live" | "replay";
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: 32, height: 32 } as CSSProperties}
    >
      {kind === "leaderboard" ? (
        <>
          <path d="M10 5h12v9a6 6 0 0 1-12 0V5Z" />
          <path d="M10 8H5v3a6 6 0 0 0 6 6M22 8h5v3a6 6 0 0 1-6 6M16 20v6M11 27h10" />
          <path
            d="m16 8 1 2 2 .3-1.5 1.5.4 2.2-1.9-1-1.9 1 .4-2.2L13 10.3l2-.3 1-2Z"
            fill="currentColor"
            strokeWidth=".8"
          />
        </>
      ) : kind === "live" ? (
        <>
          <path d="M3 16s5-8 13-8 13 8 13 8-5 8-13 8S3 16 3 16Z" />
          <circle cx="16" cy="16" r="4" />
          <path d="M25 4h4v4" />
        </>
      ) : (
        <>
          <path d="M7 9a11 11 0 1 1-2 13M7 4v6H1" />
          <path d="m14 11 8 5-8 5V11Z" fill="currentColor" strokeWidth="1" />
        </>
      )}
    </svg>
  );
}
