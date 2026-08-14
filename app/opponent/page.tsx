"use client";

import { OpponentScan } from "@/components/new-landing-3/opponent-scan";

/**
 * /opponent — standalone opponent scan page.
 *
 * Direct link for sharing: "Scan your opponent before you play them."
 * Useful for social sharing, Discord bots, and chess community links.
 */
export default function OpponentPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070608] text-[#f0edf2]">
      <div className="nl3-grain pointer-events-none fixed inset-0 z-[60] opacity-40" />
      <div className="nl3-vignette pointer-events-none fixed inset-0 z-[59]" />
      <div className="pt-20">
        <OpponentScan />
      </div>
    </div>
  );
}
