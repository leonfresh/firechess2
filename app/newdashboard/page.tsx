import { ModernDashboard } from "@/components/modern-preview/dashboard";
export const metadata = { title: "Dashboard preview | FireChess", robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const { demo } = await searchParams;
  return <ModernDashboard demo={demo === "1"} />;
}
