"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

/**
 * Blog view counter.
 *
 * mode="increment" — used on the article page: POSTs once per mount
 * (sessionStorage-deduped per tab session) and shows the new count.
 *
 * mode="readonly" — used on the /blog grid: fetches the current count
 * without incrementing.
 *
 * Renders nothing until the count is known (avoids layout shift / "0 views"
 * flash on a fresh table).
 */
export function BlogViewCount({
  slug,
  mode,
  className = "",
}: {
  slug: string;
  mode: "increment" | "readonly";
  className?: string;
}) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (mode === "increment") {
      const key = `fc-viewed:${slug}`;
      const already = (() => {
        try {
          return sessionStorage.getItem(key) === "1";
        } catch {
          return false;
        }
      })();

      if (already) {
        // Already counted this session — just fetch the count
        fetch(`/api/blog-views?slugs=${encodeURIComponent(slug)}`)
          .then((r) => r.json())
          .then((d) => {
            if (!cancelled && typeof d.views?.[slug] === "number")
              setViews(d.views[slug]);
          })
          .catch(() => {});
        return () => {
          cancelled = true;
        };
      }

      fetch("/api/blog-views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      })
        .then((r) => r.json())
        .then((d) => {
          try {
            sessionStorage.setItem(key, "1");
          } catch {}
          if (!cancelled && typeof d.views === "number") setViews(d.views);
        })
        .catch(() => {});
    } else {
      fetch(`/api/blog-views?slugs=${encodeURIComponent(slug)}`)
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled && typeof d.views?.[slug] === "number")
            setViews(d.views[slug]);
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [slug, mode]);

  if (views === null) return null;

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Eye className="h-3 w-3" />
      {views.toLocaleString()} {views === 1 ? "view" : "views"}
    </span>
  );
}
