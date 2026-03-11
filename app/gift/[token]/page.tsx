import { Metadata } from "next";
import Link from "next/link";
import { GiftClaim } from "./gift-claim";

interface Props {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: "Gift Link — FireChess",
  description: "Claim your gifted Pro access to FireChess.",
};

async function getGiftInfo(token: string) {
  try {
    const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/gift/${token}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function GiftPage({ params }: Props) {
  const { token } = await params;
  const info = await getGiftInfo(token);

  return (
    <div className="min-h-screen bg-[#0e0e0e] flex flex-col items-center justify-center px-4">
      {/* Logo / brand */}
      <Link href="/" className="mb-10 flex items-center gap-2 text-white font-bold text-2xl">
        <span className="text-amber-400">🔥</span> FireChess
      </Link>

      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-10 max-w-md w-full shadow-2xl">
        {info === null ? (
          <div className="text-center">
            <div className="text-5xl mb-4">🔗</div>
            <h2 className="text-2xl font-bold text-white mb-2">Link not found</h2>
            <p className="text-gray-400">This gift link doesn&apos;t exist or has been removed.</p>
          </div>
        ) : (
          <GiftClaim token={token} info={info} />
        )}
      </div>

      <p className="mt-6 text-gray-600 text-sm">
        Already have an account?{" "}
        <Link href="/dashboard" className="text-amber-400 hover:underline">
          Go to dashboard
        </Link>
      </p>
    </div>
  );
}
