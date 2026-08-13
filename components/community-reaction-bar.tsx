"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useSession } from "@/components/session-provider";
import type { CommunityReactionKind } from "@/lib/community-shared";

export function CommunityReactionBar({
  slug,
  initialLikes,
  initialSaves,
  initialComments,
  initiallyLiked,
  initiallySaved,
}: {
  slug: string;
  initialLikes: number;
  initialSaves: number;
  initialComments: number;
  initiallyLiked: boolean;
  initiallySaved: boolean;
}) {
  const { authenticated } = useSession();
  const [likes, setLikes] = useState(initialLikes);
  const [saves, setSaves] = useState(initialSaves);
  const [liked, setLiked] = useState(initiallyLiked);
  const [saved, setSaved] = useState(initiallySaved);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleReaction = (kind: CommunityReactionKind) => {
    if (!authenticated) {
      signIn(undefined, { callbackUrl: window.location.href });
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/community/posts/${slug}/reactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to update reaction.");
        }

        const data = await res.json();
        if (data.kind === "like") {
          setLiked(Boolean(data.active));
        }
        if (data.kind === "save") {
          setSaved(Boolean(data.active));
        }

        if (data.stats) {
          setLikes(data.stats.likesCount ?? likes);
          setSaves(data.stats.savesCount ?? saves);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-[#1e1a24] bg-[#ff5a1f]/[0.04] p-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => handleReaction("like")}
          disabled={isPending}
          className={`rounded-full border px-4 py-2 font-semibold transition-colors ${liked ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-[#1e1a24] bg-[#ff5a1f]/[0.03] text-[#f0edf2] hover:border-[#ff5a1f]/25 hover:text-white"}`}
        >
          ❤️ Like {likes}
        </button>
        <button
          type="button"
          onClick={() => handleReaction("save")}
          disabled={isPending}
          className={`rounded-full border px-4 py-2 font-semibold transition-colors ${saved ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-[#1e1a24] bg-[#ff5a1f]/[0.03] text-[#f0edf2] hover:border-[#ff5a1f]/25 hover:text-white"}`}
        >
          🔖 Save {saves}
        </button>
        <span className="rounded-full border border-[#1e1a24] bg-[#ff5a1f]/[0.03] px-4 py-2 text-[#f0edf2]">
          💬 {initialComments} comments
        </span>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
