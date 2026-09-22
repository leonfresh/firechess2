import type { Metadata } from 'next';
import { ChaosWatch } from '@/components/chaos-watch';
import { getChaosMatchCard } from '@/lib/chaos-week';

/**
 * Shared replay links are the main way a Chaos match travels (Discord, X, group
 * chats), so the replay page carries a real OG card — the same image the share
 * button downloads — instead of unfurling as a bare link.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const image = `/api/chaos/share/image?match=${encodeURIComponent(id)}`;
  const card = await getChaosMatchCard(id).catch(() => null);
  if (!card) {
    return {
      title: 'Chaos Chess replay',
      description: 'Draft powers. Break chess. Watch this Chaos Chess match and challenge a friend.',
      openGraph: { images: [{ url: image, width: 1200, height: 630 }] },
    };
  }
  const title = `${card.white} vs ${card.black} — Chaos Score ${card.score} (${card.tier})`;
  const description = `${card.headline}. ${card.blurb}. Watch the replay and challenge a friend.`;
  return {
    title,
    description,
    alternates: { canonical: `/chaos/replay/${id}` },
    openGraph: {
      title,
      description,
      url: `/chaos/replay/${id}`,
      type: 'article',
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function ReplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChaosWatch initialMatch={id} />;
}
