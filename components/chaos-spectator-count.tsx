/** Clash Royale style spectator badge: an eye and how many people are watching the game. */
export function SpectatorCount({ count, compact = false }: { count?: number | null; compact?: boolean }) {
  if (count == null) return null;
  return (
    <span
      title={`${count} ${count === 1 ? "person" : "people"} watching`}
      aria-label={`${count} watching`}
      style={{
        display: "inline-flex", alignItems: "center", gap: compact ? 4 : 5, verticalAlign: "middle",
        padding: compact ? "2px 7px" : "4px 10px", marginLeft: compact ? 8 : 0, borderRadius: 999,
        background: "#0f1b2c", border: "1px solid #6b7f9255", color: "#e8f0f8",
        fontSize: compact ? 10 : 13, fontWeight: 900, fontVariantNumeric: "tabular-nums", lineHeight: 1,
      }}
    >
      <svg viewBox="0 0 24 24" width={compact ? 12 : 15} height={compact ? 12 : 15} aria-hidden="true" style={{ color: "#9fd0ff" }}>
        <path d="M12 5C6.5 5 2.7 9.2 1.5 12c1.2 2.8 5 7 10.5 7s9.3-4.2 10.5-7C21.3 9.2 17.5 5 12 5Zm0 11.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9Zm0-7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" fill="currentColor" />
      </svg>
      {count}
    </span>
  );
}
