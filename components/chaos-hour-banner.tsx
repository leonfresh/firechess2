"use client";
/** Lobby banner for Chaos Hour (lib/chaos-hour.ts): a countdown in the player's own time, then LIVE. */
import { useEffect, useState } from "react";
import { chaosHourState, formatWait } from "@/lib/chaos-hour";

export function ChaosHourBanner({ className }: { className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  if (now === null) return null;
  const hour = chaosHourState(now);
  const local = hour.start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  return (
    <div role="status" className={className} style={{
      display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", borderRadius: 14, padding: "11px 14px",
      color: "#f8f6ef", border: `1px solid ${hour.live ? "#fbd481" : "#ffffff22"}`,
      background: hour.live ? "linear-gradient(90deg, #fbd48133, #f472b622)" : "#ffffff08",
    }}>
      <span aria-hidden="true" style={{ fontSize: 22 }}>{hour.live ? "⚡" : "⏰"}</span>
      <span style={{ flex: 1 }}>
        <strong style={{ display: "block", fontSize: 14 }}>
          {hour.live ? `Chaos Hour is LIVE · ${formatWait(hour.endsIn)} left` : `Chaos Hour in ${formatWait(hour.startsIn)}`}
        </strong>
        <span style={{ fontSize: 12, color: "#c2c8dc" }}>
          {hour.live ? "Double gold on every online game. Everyone's queueing now." : `Daily at ${local}: double gold on every online game.`}
        </span>
      </span>
    </div>
  );
}
