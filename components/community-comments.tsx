"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useSession } from "@/components/session-provider";
import { AvatarImg } from "@/components/avatar-image";

type CommentItem = {
  id: string;
  body: string;
  authorId: string | null;
  authorDisplayName: string;
  authorImage: string | null;
  createdAt: string | Date | null;
};

function formatCommentTimestamp(
  value: string | Date | null,
  useLocalTimezone: boolean,
) {
  if (!value) return "Recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    ...(useLocalTimezone ? {} : { timeZone: "UTC" }),
  }).format(date);
}

export function CommunityComments({
  slug,
  initialComments,
}: {
  slug: string;
  initialComments: CommentItem[];
}) {
  const { authenticated } = useSession();
  const [comments, setComments] = useState(initialComments);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [useLocalTimezone, setUseLocalTimezone] = useState(false);

  useEffect(() => {
    setUseLocalTimezone(true);
  }, []);

  const countLabel = useMemo(
    () =>
      `${comments.length} ${comments.length === 1 ? "comment" : "comments"}`,
    [comments.length],
  );

  const submitComment = () => {
    if (!authenticated) {
      signIn(undefined, { callbackUrl: window.location.href });
      return;
    }

    const trimmed = message.trim();
    if (trimmed.length < 2) {
      setError("Comment must be at least 2 characters.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/community/posts/${slug}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: trimmed }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to create comment.");
        }

        const data = await res.json();
        if (data.comment) {
          setComments((current) => [
            ...current,
            {
              id: data.comment.id,
              body: data.comment.body,
              authorId: data.comment.authorId ?? null,
              authorDisplayName: data.comment.authorDisplayName,
              authorImage: data.comment.authorImage,
              createdAt: data.comment.createdAt,
            },
          ]);
        }
        setMessage("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  };

  return (
    <section className="rounded-3xl border border-[#1e1a24] bg-[#ff5a1f]/[0.04] p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Discussion</h2>
          <p className="text-sm text-[#8d8696]">{countLabel}</p>
        </div>
      </div>

      <div className="space-y-4">
        {comments.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#1e1a24] bg-black/10 px-4 py-6 text-sm text-[#565061]">
            No comments yet. Be the first to explain the idea, ask a follow-up,
            or post the line you would play.
          </div>
        )}

        {comments.map((comment) => (
          <article
            key={comment.id}
            className="rounded-2xl border border-[#1e1a24] bg-black/10 p-4"
          >
            <div className="mb-2 flex items-center gap-3">
              {comment.authorId ? (
                <Link
                  href={`/community/profile/${comment.authorId}`}
                  className="group flex min-w-0 items-center gap-3"
                >
                  <AvatarImg
                    src={comment.authorImage}
                    className="h-8 w-8 rounded-full object-cover"
                    fallback={
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/15 text-xs font-bold text-orange-300">
                        {(comment.authorDisplayName[0] ?? "F").toUpperCase()}
                      </span>
                    }
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white transition-colors group-hover:text-cyan-300">
                      {comment.authorDisplayName}
                    </p>
                    <p className="text-xs text-[#565061]">
                      {formatCommentTimestamp(
                        comment.createdAt,
                        useLocalTimezone,
                      )}
                    </p>
                  </div>
                </Link>
              ) : (
                <>
                  <AvatarImg
                    src={comment.authorImage}
                    className="h-8 w-8 rounded-full object-cover"
                    fallback={
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/15 text-xs font-bold text-orange-300">
                        {(comment.authorDisplayName[0] ?? "F").toUpperCase()}
                      </span>
                    }
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {comment.authorDisplayName}
                    </p>
                    <p className="text-xs text-[#565061]">
                      {formatCommentTimestamp(
                        comment.createdAt,
                        useLocalTimezone,
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#f0edf2]">
              {comment.body}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        <textarea
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Add your line, your plan, or why you disagree with the move..."
          className="w-full resize-none rounded-2xl border border-[#1e1a24] bg-black/20 px-4 py-3 text-sm text-white placeholder:text-[#565061] focus:border-orange-500/40 focus:outline-none"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          {error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : (
            <p className="text-xs text-[#565061]">
              Signed-in users can comment and build the discussion under this
              post.
            </p>
          )}
          <button
            type="button"
            onClick={submitComment}
            disabled={isPending}
            className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {authenticated
              ? isPending
                ? "Posting..."
                : "Post Comment"
              : "Sign In to Comment"}
          </button>
        </div>
      </div>
    </section>
  );
}
