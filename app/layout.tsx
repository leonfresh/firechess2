import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";
import { Navbar } from "@/components/navbar";
import { EmbedGuard } from "@/components/embed-guard";
import { SupportWidget } from "@/components/support-widget";
import {
  OrganizationJsonLd,
  WebApplicationJsonLd,
  WebSiteJsonLd,
} from "@/components/json-ld";
import { Analytics } from "@vercel/analytics/next";
import { SiteFooter } from "@/components/site-footer";
import { RefTracker } from "@/components/ref-tracker";
import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
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
    icon: [
      { url: "/firechess-flame.svg", type: "image/svg+xml" },
      { url: "/firechess-flame.png", sizes: "256x256", type: "image/png" },
    ],
    apple: "/firechess-flame.png",
  },
  openGraph: {
    title: "FireChess - Free Chess Analysis & Opening Leak Scanner",
    description:
      "Scan your Lichess & Chess.com games for repeated mistakes, missed tactics, and endgame blunders. Powered by Stockfish 18 — free, fast, private.",
    url: "https://firechess.com",
    siteName: "FireChess",
    type: "website",
    locale: "en_US",
    images: [{ url: "https://firechess.com/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@firechessapp",
    creator: "@firechessapp",
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
    languages: {
      en: "https://firechess.com",
      es: "https://firechess.com/es",
      de: "https://firechess.com/de",
      fr: "https://firechess.com/fr",
      pt: "https://firechess.com/pt",
      ru: "https://firechess.com/ru",
    },
  },
  manifest: "/manifest.webmanifest",
  // Uncomment and fill in after registering with Google Search Console:
  // verification: {
  //   google: "YOUR_GOOGLE_VERIFICATION_CODE",
  // },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans`}
      >
        <NextIntlClientProvider messages={messages}>
        <OrganizationJsonLd />
        <WebApplicationJsonLd />
        <WebSiteJsonLd />
        <SessionProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-orange-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
          >
            Skip to content
          </a>
          <Suspense fallback={null}>
            <RefTracker />
          </Suspense>
          <EmbedGuard>
            <Navbar />
          </EmbedGuard>

          <main id="main-content">{children}</main>

          <EmbedGuard includePreviews>
            <SiteFooter />
          </EmbedGuard>
          <EmbedGuard includePreviews>
            <SupportWidget />
          </EmbedGuard>
        </SessionProvider>
        <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
