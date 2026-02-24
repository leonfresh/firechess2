import { getAllPosts } from "@/lib/blog";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chess Improvement Blog | FireChess",
  description:
    "Tips, guides, and analysis techniques to improve your chess. Learn about opening preparation, tactical patterns, endgame theory, and how to use engine analysis effectively.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-[80vh] px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <h1 className="text-4xl font-bold tracking-tight text-white">Blog</h1>
        <p className="mt-2 text-lg text-slate-400">
          Guides, tips, and analysis techniques to level up your chess.
        </p>

        {/* Posts */}
        <div className="mt-10 space-y-1">
          {posts.length === 0 ? (
            <p className="text-slate-500">No posts yet. Check back soon!</p>
          ) : (
            posts.map((post, i) => (
              <article key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block rounded-2xl border border-transparent p-6 transition-all hover:border-white/[0.06] hover:bg-white/[0.02]"
                >
                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <h2 className="text-xl font-semibold text-white transition-colors group-hover:text-emerald-400">
                    {post.title}
                  </h2>

                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                    {post.description}
                  </p>

                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
                    <time dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                    <span>·</span>
                    <span>{post.readingTime} min read</span>
                  </div>
                </Link>

                {i < posts.length - 1 && (
                  <div className="mx-6 border-b border-white/[0.04]" />
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
