"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/session-provider";

type CommunityPostAdminMenuProps = {
  slug: string;
  title: string;
  redirectHref?: string;
  onDeleted?: () => void;
};

export function CommunityPostAdminMenu({
  slug,
  title,
  redirectHref,
  onDeleted,
}: CommunityPostAdminMenuProps) {
  const { loading, isAdmin } = useSession();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (loading || !isAdmin) {
    return null;
  }

  async function handleDelete() {
    if (pending) return;

    const confirmed = window.confirm(
      `Delete \"${title}\"? This also removes its comments and reactions.`,
    );

    if (!confirmed) {
      setOpen(false);
      return;
    }

    setPending(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/community/posts/${encodeURIComponent(slug)}`,
        {
          method: "DELETE",
        },
      );
      const payload = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!res.ok) {
        throw new Error(payload?.error ?? "Failed to delete post.");
      }

      setOpen(false);
      onDeleted?.();

      if (redirectHref) {
        router.push(redirectHref);
        return;
      }

      if (!onDeleted) {
        router.refresh();
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete post.",
      );
    } finally {
      setPending(false);
    }
  }

  function handleEdit() {
    if (pending) return;

    setError(null);
    setOpen(false);
    router.push(`/board?editSlug=${encodeURIComponent(slug)}`);
  }

  return (
    <div ref={containerRef} className="relative z-20 shrink-0 self-start">
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen((current) => !current);
        }}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1e1a24] bg-black/25 text-[#f0edf2] transition hover:border-[#ff5a1f]/25 hover:text-white"
        aria-label="Open community post admin actions"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 w-[11rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-[#1e1a24] bg-slate-950/95 p-2 shadow-[0_20px_50px_-28px_rgba(2,6,23,0.95)] backdrop-blur"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleEdit}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-100 transition hover:bg-[#1e1a24] hover:text-white"
          >
            <span>Edit post</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04a1.003 1.003 0 0 0 0-1.42L18.37 3.29a1.003 1.003 0 0 0-1.42 0L15.12 5.12l3.75 3.75z" />
            </svg>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handleDelete}
            disabled={pending}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-200 transition hover:bg-rose-500/12 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>{pending ? "Deleting..." : "Delete post"}</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M9 3h6l1 2h4v2H4V5h4zm1 6h2v8h-2zm4 0h2v8h-2zM7 9h2v8H7zm1 12a2 2 0 0 1-2-2V9h12v10a2 2 0 0 1-2 2z" />
            </svg>
          </button>

          {error && (
            <p className="px-3 pb-1 pt-2 text-xs leading-relaxed text-rose-300">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
