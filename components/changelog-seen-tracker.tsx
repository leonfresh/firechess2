"use client";

import { useEffect } from "react";

import { LATEST_VERSION } from "@/lib/constants";

export function ChangelogSeenTracker() {
  useEffect(() => {
    try {
      localStorage.setItem("firechess_changelog_seen", String(LATEST_VERSION));
    } catch {}
  }, []);

  return null;
}
