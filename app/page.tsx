"use client";

import { useCallback, useEffect, useState } from "react";
import { HeroSection } from "@/components/new-landing/hero-section";
import { ScanSection } from "@/components/new-landing/scan-section";
import { HowItWorksSection } from "@/components/new-landing/how-it-works-section";
import { FeaturesSection } from "@/components/new-landing/features-section";
import { SampleReportsSection } from "@/components/new-landing/sample-reports-section";
import { SocialProofSection } from "@/components/new-landing/social-proof-section";
import { PricingTeaser } from "@/components/home/pricing-teaser";
import { FaqSection } from "@/components/new-landing/faq-section";
import type { SiteStats } from "@/components/new-landing/hero-section";

/**
 * FireChess homepage — 2026 redesign.
 *
 * Dark premium aesthetic, bento-grid features, scroll-aware sections,
 * gradient accents (orange/red fire identity), auto-playing sample reports.
 *
 * Includes the scan dialog directly on the page.
 */
export default function NewLandingPage() {
  const [siteStats, setSiteStats] = useState<SiteStats>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSiteStats(data);
      })
      .catch(() => {});
  }, []);

  const goToScan = useCallback(() => {
    const el = document.getElementById("scan-section");
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, []);

  const goToSamples = useCallback(() => {
    const el = document.getElementById("sample-reports");
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#08070b] text-slate-100">
      <HeroSection
        siteStats={siteStats}
        onScanClick={goToScan}
        onSeeSampleClick={goToSamples}
      />
      <ScanSection />
      <HowItWorksSection />
      <FeaturesSection />
      <div id="sample-reports">
        <SampleReportsSection />
      </div>
      <SocialProofSection />
      <PricingTeaser />
      <FaqSection onScanClick={goToScan} />
    </div>
  );
}
