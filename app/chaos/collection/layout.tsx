import type { Metadata } from "next";

// The page is a client component, so it would otherwise inherit /chaos as its canonical.
export const metadata: Metadata = {
  title: "Chaos Chess Collection: every power and anomaly",
  alternates: { canonical: "https://www.firechess.com/chaos/collection" },
};

export default function ChaosCollectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
