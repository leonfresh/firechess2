import { ChaosWatch } from "@/components/chaos-watch";
import { HubPage } from "../hub-page";
export default async function WatchPage({ searchParams }: {
  searchParams: Promise<{ room?: string; match?: string; tab?: string; page?: string }>;
}) {
  const q = await searchParams;
  return <HubPage active="watch"><ChaosWatch initialRoom={q.room} initialMatch={q.match} initialTab={q.tab === "archive" ? "archive" : "live"} initialPage={Number(q.page) || 0} /></HubPage>;
}
