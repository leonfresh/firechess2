import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";
import { AuthButton } from "@/components/auth-button";

export const metadata: Metadata = {
  title: "FireChess - Opening Leak Scanner",
  description: "Scan repeated opening mistakes from Lichess or Chess.com games, powered by Stockfish 18"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#030712]/80 backdrop-blur-2xl">
          <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 md:px-10">
            <Link href="/" className="group inline-flex items-center gap-2.5 text-base font-bold text-white transition-colors hover:text-emerald-300">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-sm shadow-glow-sm transition-shadow group-hover:shadow-glow">
                🔥
              </span>
              <span className="tracking-tight">FireChess</span>
            </Link>

            <div className="flex items-center gap-3">
              <Link href="/" className="btn-secondary text-sm">
                Scanner
              </Link>
              <Link
                href="/pricing"
                className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-all duration-300 hover:shadow-glow-sm"
              >
                Pricing
              </Link>
              <AuthButton />
            </div>
          </nav>
        </header>

        <main>{children}</main>

        <footer className="border-t border-white/[0.04] py-8">
          <div className="mx-auto max-w-7xl px-6 md:px-10">
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-orange-500/50 to-red-500/50 text-[10px]">🔥</span>
                FireChess
              </div>
              <p className="text-xs text-slate-600">Powered by Stockfish 18 &middot; Built for chess improvement</p>
            </div>
          </div>
        </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
