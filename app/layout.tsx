import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";
import { AuthButton } from "@/components/auth-button";

export const metadata: Metadata = {
  title: "FireChess - Chess Analysis & Opening Leak Scanner",
  description:
    "Scan your Lichess and Chess.com games for repeated opening mistakes, missed tactics, and endgame blunders. Powered by Stockfish 18 WASM — free, fast, and private.",
  icons: {
    icon: "/firechess-logo.png",
    apple: "/firechess-logo.png",
  },
  openGraph: {
    title: "FireChess - Chess Analysis & Opening Leak Scanner",
    description:
      "Scan your games for repeated mistakes, missed tactics, and endgame blunders. Powered by Stockfish 18.",
    url: "https://firechess.com",
    siteName: "FireChess",
    images: [
      {
        url: "https://firechess.com/firechess-logo.png",
        width: 512,
        height: 512,
        alt: "FireChess Logo",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "FireChess - Chess Analysis & Opening Leak Scanner",
    description:
      "Scan your games for repeated mistakes, missed tactics, and endgame blunders. Free & powered by Stockfish 18.",
    images: ["https://firechess.com/firechess-logo.png"],
  },
  metadataBase: new URL("https://firechess.com"),
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
            <Link href="/" className="group inline-flex items-center gap-2.5 text-base font-bold text-white transition-colors hover:text-slate-200">
              <Image src="/firechess-logo.png" alt="FireChess" width={32} height={32} className="h-8 w-8 rounded-lg" />
              <span className="tracking-tight">FireChess</span>
            </Link>

            <div className="flex items-center gap-2.5">
              <Link
                href="/about"
                className="btn-secondary inline-flex items-center gap-1.5 text-sm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                About
              </Link>
              <Link
                href="/pricing"
                className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-all duration-300 hover:shadow-glow-sm"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" /></svg>
                Pro
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
                <Image src="/firechess-logo.png" alt="" width={20} height={20} className="h-5 w-5 rounded" />
                FireChess
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <Link href="/about" className="hover:text-slate-400 transition-colors">About</Link>
                <span>&middot;</span>
                <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
                <span>&middot;</span>
                <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
                <span>&middot;</span>
                <span>Powered by Stockfish 18</span>
              </div>
            </div>
          </div>
        </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
