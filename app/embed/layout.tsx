/**
 * Segment layout for embeddable widgets — just passes children through.
 * The root layout renders nav/footer conditionally via EmbedGuard.
 */
export const metadata = {
  robots: "noindex",
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
