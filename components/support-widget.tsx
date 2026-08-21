"use client";

/**
 * SupportWidget — floating support launcher (bottom-right).
 * Replaces the Crisp chat bubble: opens the native ticket flow.
 * Authed users land on /support (their ticket inbox), guests on /feedback.
 * Unread-reply badge polls /api/feedback/unread like the navbar bell.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/session-provider";

export function SupportWidget() {
  const { authenticated } = useSession();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const check = () => {
      if (document.visibilityState === "hidden") return;
      fetch("/api/feedback/unread")
        .then((r) => r.json())
        .then((d) => setUnread(d.count ?? 0))
        .catch(() => {});
    };
    check();
    const id = window.setInterval(check, 30000);
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <Link
      href={authenticated ? "/support" : "/feedback"}
      aria-label="Support"
      title="Support"
      className="fixed bottom-5 right-5 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-[#1e1a24] bg-[#121015] text-[#ff8c42] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff5a1f]/40 hover:bg-[#181520]"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        />
      </svg>
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#ff5a1f] px-1 text-[10px] font-bold text-white shadow-[0_0_12px_rgba(255,90,31,0.5)]">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
