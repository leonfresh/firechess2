"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HeroSection } from "@/components/new-landing/hero-section";
import { HowItWorksSection } from "@/components/new-landing/how-it-works-section";
import { FeaturesSection } from "@/components/new-landing/features-section";
import { SampleReportsSection } from "@/components/new-landing/sample-reports-section";
import { SocialProofSection } from "@/components/new-landing/social-proof-section";
import { PricingSection } from "@/components/new-landing/pricing-section";
import { FaqSection } from "@/components/new-landing/faq-section";
import type { SiteStats } from "@/components/new-landing/hero-section";

/**
 * Experimental new landing page at /newlanding.
 *
 * A fresh 2026 redesign — no reference to the previous homepage design.
 * Dark premium aesthetic, bento-grid features, scroll-aware sections,
 * gradient accents (orange/red fire identity), auto-playing sample reports.
 *
 * This is a pure marketing page; scan CTAs deep-link to the existing
 * analyzer on the main homepage via /?scan=1.
 */
export default function NewLandingPage() {
  const router = useRouter();
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
    router.push("/?scan=1");
  }, [router]);

  const goToSamples = useCallback(() => {
    const el = document.getElementById("sample-reports");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#08070b] text-slate-100">
      <HeroSection
        siteStats={siteStats}
        onScanClick={goToScan}
        onSeeSampleClick={goToSamples}
      />
      <HowItWorksSection />
      <FeaturesSection />
      <div id="sample-reports">
        <SampleReportsSection />
      </div>
      <SocialProofSection />
      <PricingSection />
      <FaqSection />
    </div>
  );
}
