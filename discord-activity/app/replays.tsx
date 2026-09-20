"use client";
import { ChaosWatchButton } from "@/components/chaos-watch";
export function ActivityReplays({card = false}: {card?: boolean}) {
  return <ChaosWatchButton card={card} label="Replays" initialTab="archive" />;
}
