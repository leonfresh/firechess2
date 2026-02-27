import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";
import { Navbar } from "@/components/navbar";

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
    card: "summary",
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
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <SessionProvider>
        <Navbar />

        <main>{children}</main>

        <footer className="border-t border-white/[0.04] py-8">
          <div className="mx-auto max-w-7xl px-6 md:px-10">
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Image src="/firechess-logo.png" alt="" width={20} height={20} className="h-5 w-5 rounded" />
                FireChess
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <Link href="/blog" className="hover:text-slate-400 transition-colors">Blog</Link>
                <span>&middot;</span>
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
