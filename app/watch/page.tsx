import type { Metadata } from "next";
import { ChaosWatch } from "@/components/chaos-watch";
export const metadata: Metadata = {
  title: "The Watchtower · Chaos Chess live games and replays",
  description:
    "Watch live Chaos Chess matches with running clocks, then replay finished games move by move — powers, anomalies and abilities included.",
};
export default async function WatchPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string; match?: string; tab?: string; page?: string }>;
}) {
  const q = await searchParams;
  return (
    <main
      style={{ minHeight: "100dvh", background: "#142235", padding: "16px 0" }}
    >
      <ChaosWatch
        initialRoom={q.room}
        initialMatch={q.match}
        initialTab={q.tab === "archive" ? "archive" : "live"}
        initialPage={Number(q.page) || 0}
      />
    </main>
  );
}
