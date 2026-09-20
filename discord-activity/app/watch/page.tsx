import { ChaosWatch } from "@/components/chaos-watch";
export default async function WatchPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string; match?: string }>;
}) {
  const q = await searchParams;
  return (
    <main
      style={{ minHeight: "100dvh", background: "#142235", padding: "16px 0" }}
    >
      <ChaosWatch initialRoom={q.room} initialMatch={q.match} />
    </main>
  );
}
