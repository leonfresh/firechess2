import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";
import { Navbar } from "@/components/navbar";
import { OrganizationJsonLd, WebApplicationJsonLd, WebSiteJsonLd } from "@/components/json-ld";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://firechess.com"),
  title: {
    default: "FireChess - Free Chess Analysis & Opening Leak Scanner",
    template: "%s | FireChess",
  },
  description:
    "Scan your Lichess and Chess.com games for repeated opening mistakes, missed tactics, and endgame blunders. Powered by Stockfish 18 WASM — free, fast, and private.",
  keywords: [
    "chess analysis",
    "opening mistakes",
    "chess improvement",
    "Lichess analysis",
    "Chess.com analysis",
    "Stockfish",
    "chess tactics",
    "endgame blunders",
    "opening repertoire",
    "chess training",
    "free chess tool",
    "chess leaks",
    "chess engine",
    "chess puzzles",
    "guess the elo",
  ],
  authors: [{ name: "FireChess" }],
  creator: "FireChess",
  publisher: "FireChess",
  icons: {
    icon: "/firechess-logo.png",
    apple: "/firechess-logo.png",
  },
  openGraph: {
    title: "FireChess - Free Chess Analysis & Opening Leak Scanner",
    description:
      "Scan your Lichess & Chess.com games for repeated mistakes, missed tactics, and endgame blunders. Powered by Stockfish 18 — free, fast, private.",
    url: "https://firechess.com",
    siteName: "FireChess",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "FireChess - Free Chess Analysis & Opening Leak Scanner",
    description:
      "Scan your games for repeated mistakes, missed tactics, and endgame blunders. Free & powered by Stockfish 18.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://firechess.com",
  },
  manifest: "/manifest.webmanifest",
  // Uncomment and fill in after registering with Google Search Console:
  // verification: {
  //   google: "YOUR_GOOGLE_VERIFICATION_CODE",
  // },
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <OrganizationJsonLd />
        <WebApplicationJsonLd />
        <WebSiteJsonLd />
        <SessionProvider>
        <Navbar />

        <main>{children}</main>

        <footer className="border-t border-white/[0.04] py-12">
          <div className="mx-auto max-w-7xl px-6 md:px-10">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-5">
              {/* Brand */}
              <div className="col-span-2 sm:col-span-4 lg:col-span-1">
                <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-white">
                  <Image src="/firechess-logo.png" alt="FireChess" width={20} height={20} className="h-5 w-5 rounded" />
                  FireChess
                </Link>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 max-w-[200px]">
                  Free chess analysis powered by Stockfish&nbsp;18. Scan your games, find your leaks, get better.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <a href="https://reddit.com/r/firechess" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-orange-400 transition-colors" aria-label="Reddit">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.066 13.06c.084.357.126.726.126 1.1 0 3.78-4.013 6.84-8.964 6.84S.264 17.94.264 14.16c0-.374.042-.743.126-1.1a1.755 1.755 0 01-.467-1.19c0-.97.786-1.756 1.756-1.756.473 0 .9.186 1.216.49C4.612 9.59 6.748 8.86 9.12 8.76l1.46-5.14a.36.36 0 01.434-.25l3.64.87a1.29 1.29 0 012.268.96 1.29 1.29 0 01-1.29 1.29 1.29 1.29 0 01-1.27-1.08l-3.22-.77-1.3 4.56c2.32.12 4.41.85 6.108 1.86a1.748 1.748 0 011.216-.49c.97 0 1.756.786 1.756 1.756 0 .46-.178.878-.467 1.19zM8.4 13.44a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88zm7.2 0a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88zm-6.36 4.128c-.168-.168-.168-.432 0-.6.168-.168.432-.168.6 0C10.44 17.568 11.16 17.88 12 17.88s1.56-.312 2.16-.912c.168-.168.432-.168.6 0 .168.168.168.432 0 .6-.756.756-1.68 1.032-2.76 1.032s-2.004-.276-2.76-1.032z"/></svg>
                  </a>
                  <a href="https://twitter.com/firechessapp" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-sky-400 transition-colors" aria-label="Twitter / X">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                  <a href="https://github.com/leonfresh" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-white transition-colors" aria-label="GitHub">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                  </a>
                </div>
              </div>

              {/* Product */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Product</h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-500">
                  <li><Link href="/analyze" className="hover:text-slate-300 transition-colors">PGN Analyzer</Link></li>
                  <li><Link href="/train" className="hover:text-slate-300 transition-colors">Training</Link></li>
                  <li><Link href="/roast" className="hover:text-slate-300 transition-colors">Roast the Elo</Link></li>
                  <li><Link href="/guess" className="hover:text-slate-300 transition-colors">Guess the Move</Link></li>
                  <li><Link href="/dungeon" className="hover:text-slate-300 transition-colors">Puzzle Dungeon</Link></li>
                  <li><Link href="/openings" className="hover:text-slate-300 transition-colors">Opening Explorer</Link></li>
                </ul>
              </div>

              {/* Community */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Community</h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-500">
                  <li><Link href="/leaderboard" className="hover:text-slate-300 transition-colors">Leaderboard</Link></li>
                  <li><Link href="/shop" className="hover:text-slate-300 transition-colors">Coin Shop</Link></li>
                  <li><Link href="/dashboard" className="hover:text-slate-300 transition-colors">Dashboard</Link></li>
                  <li><Link href="/feedback" className="hover:text-slate-300 transition-colors">Feedback</Link></li>
                  <li><Link href="/support" className="hover:text-slate-300 transition-colors">Support</Link></li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Company</h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-500">
                  <li><Link href="/pricing" className="hover:text-slate-300 transition-colors">Pricing</Link></li>
                  <li><Link href="/about" className="hover:text-slate-300 transition-colors">About</Link></li>
                  <li><Link href="/blog" className="hover:text-slate-300 transition-colors">Blog</Link></li>
                  <li><Link href="/changelog" className="hover:text-slate-300 transition-colors">Changelog</Link></li>
                  <li><Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link></li>
                  <li><Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link></li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-white/[0.04] pt-6 sm:flex-row">
              <p className="text-[11px] text-slate-600">&copy; {new Date().getFullYear()} FireChess. All rights reserved.</p>
              <p className="text-[11px] text-slate-600">Powered by Stockfish 18 &middot; Built with Next.js</p>
            </div>
          </div>
        </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
