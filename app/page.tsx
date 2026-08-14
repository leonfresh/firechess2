"use client";

import { useCallback, useEffect, useState } from "react";
import { Nl3Hero } from "@/components/new-landing-3/hero-section";
import { ScanSection } from "@/components/new-landing/scan-section";
import { Nl3HowItWorks } from "@/components/new-landing-3/how-it-works-section";
import { Nl3Features } from "@/components/new-landing-3/features-section";
import { Nl3SampleReports } from "@/components/new-landing-3/sample-reports-section";
import { Nl3AppLauncher } from "@/components/new-landing-3/app-launcher-section";
import { Nl3Testimonials } from "@/components/new-landing-3/testimonials-section";
import { OpponentScan } from "@/components/new-landing-3/opponent-scan";
import { PricingTeaser } from "@/components/home/pricing-teaser";
import { Nl3Faq } from "@/components/new-landing-3/faq-section";
import { Nl3FinalCta } from "@/components/new-landing-3/final-cta";
import type { SiteStats } from "@/components/new-landing-3/types";

/**
 * FireChess homepage — "Ember & Ink" design.
 *
 * 2026 design language: oversized editorial serif/sans headline mix, live
 * stats ticker, chrome-bar product card with a real react-chessboard
 * (looping scan → radar → takeaway), bento grid with cursor spotlight,
 * skeuomorphic app launcher, hi-res CSS grain.
 * Single molten-orange accent (#ff5a1f) — no gradient text.
 *
 * Previous homepage preserved at /backuplanding.
 */
export default function HomePage() {
  const [siteStats, setSiteStats] = useState<SiteStats>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setSiteStats(data))
      .catch(() => {});
  }, []);



  const goTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  const goToScan = useCallback(() => goTo("scan-section"), [goTo]);
  const goToSamples = useCallback(() => goTo("sample-reports"), [goTo]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070608] text-[#f0edf2]">
      {/* Hi-res grain + vignette overlays */}
      <div className="nl3-grain pointer-events-none fixed inset-0 z-[60] opacity-40" />
      <div className="nl3-vignette pointer-events-none fixed inset-0 z-[59]" />

      <Nl3Hero
        siteStats={siteStats}
        onScanClick={goToScan}
        onSeeSampleClick={goToSamples}
      />
      <div id="scan-section">
        <ScanSection />
      </div>
      <div id="how-it-works">
        <Nl3HowItWorks />
      </div>
      <div id="features">
        <Nl3Features />
      </div>
      <Nl3SampleReports />
      <OpponentScan />
      <Nl3AppLauncher />
      <Nl3Testimonials />
      <div id="pricing">
        <PricingTeaser />
      </div>
      <Nl3Faq />
      <Nl3FinalCta onScanClick={goToScan} />

      {/* Ember & Ink footer — replaces global chrome on this route */}
      <footer className="flex flex-col items-center justify-between gap-3 border-t border-[#1e1a24] px-6 py-8 text-[13px] text-[#565061] sm:flex-row sm:px-10">
        <span className="flex items-center gap-2 font-semibold text-[#8d8696]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 2C12 2 6 8 6 13a6 6 0 0012 0c0-2-1-3.5-1-3.5S16 11 14.5 11c.5-2.5-.5-5.5-2.5-7C12 4 12 2 12 2z" fill="#ff5a1f"/><path d="M12 22a5 5 0 01-5-5c0-1.5.5-2.6.5-2.6S8 16 9.5 16c-.3-2 .5-4 2.5-5.5 0 0 2 2.5 2 5a5 5 0 01-2 4.5z" fill="#ffb37a" opacity="0.85"/></svg>
          © 2026 FireChess
        </span>
        <span>Stockfish 18 · Lichess & Chess.com · Made for club players</span>
      </footer>
    </div>
  );
}
