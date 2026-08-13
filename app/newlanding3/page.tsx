"use client";

import { useCallback, useEffect, useState } from "react";
import { Nl3Nav, FlameMark } from "@/components/new-landing-3/nav";
import { Nl3Hero } from "@/components/new-landing-3/hero-section";
import { ScanSection } from "@/components/new-landing/scan-section";
import { Nl3HowItWorks } from "@/components/new-landing-3/how-it-works-section";
import { Nl3Features } from "@/components/new-landing-3/features-section";
import { Nl3SampleReports } from "@/components/new-landing-3/sample-reports-section";
import { Nl3AppLauncher } from "@/components/new-landing-3/app-launcher-section";
import { Nl3Testimonials } from "@/components/new-landing-3/testimonials-section";
import { PricingTeaser } from "@/components/home/pricing-teaser";
import { Nl3Faq } from "@/components/new-landing-3/faq-section";
import { Nl3FinalCta } from "@/components/new-landing-3/final-cta";
import type { SiteStats } from "@/components/new-landing-3/types";

/**
 * /newlanding3 — "Ember & Ink" experimental landing concept.
 *
 * 2026 design language: oversized editorial serif/sans headline mix, live
 * stats ticker, chrome-bar product card with a real react-chessboard, bento
 * grid with cursor spotlight, skeuomorphic app launcher, hi-res CSS grain.
 * Single molten-orange accent (#ff5a1f) — no gradient text.
 */
export default function NewLanding3Page() {
  const [siteStats, setSiteStats] = useState<SiteStats>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setSiteStats(data))
      .catch(() => {});
  }, []);

  // Flag body so the global navbar/footer chrome hides on this route only.
  // The layout is a server component that re-asserts body.className after
  // hydration, which would wipe a class set in an effect — so we watch and
  // re-apply on any class mutation while this page is mounted.
  useEffect(() => {
    const apply = () => document.body.classList.add("nl3-active");
    apply();
    const obs = new MutationObserver(() => {
      if (!document.body.classList.contains("nl3-active")) apply();
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => {
      obs.disconnect();
      document.body.classList.remove("nl3-active");
    };
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

      <Nl3Nav onScanClick={goToScan} />
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
          <FlameMark size={18} /> © 2026 FireChess
        </span>
        <span>Stockfish 18 · Lichess & Chess.com · Made for club players</span>
      </footer>
    </div>
  );
}
