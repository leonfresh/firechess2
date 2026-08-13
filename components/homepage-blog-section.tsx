"use client";

import Link from "next/link";
import { BlogFeaturedImage } from "@/components/blog-featured-images";
import { getHomepageBlogPreviews } from "@/lib/blog-preview";

export function HomepageBlogSection() {
  const posts = getHomepageBlogPreviews(4);

  return (
    <section>
      <div
        className="relative overflow-hidden rounded-[2rem] px-5 py-6 shadow-[0_30px_100px_-56px_rgba(37,12,7,0.98)] sm:px-6 sm:py-7 lg:px-8"
        style={{
          background:
            "linear-gradient(150deg, rgba(11, 9, 12, 0.97) 0%, rgba(17, 12, 15, 0.96) 54%, rgba(16, 24, 46, 0.94) 100%)",
        }}
      >
        {/* Top edge shimmer */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-200/20 to-transparent" />

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-300/70">
              From the blog
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              Chess Guides & Analysis Tips
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#8d8696]">
              Deep-dives on accuracy, tactics, openings, and how to actually
              improve — backed by engine data.
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/[0.07] px-4 py-2 text-sm font-semibold text-indigo-200 transition-colors hover:border-indigo-300/35 hover:bg-indigo-400/[0.12] hover:text-white"
          >
            All articles
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>

        {/* Posts grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[#1e1a24] bg-[#ff5a1f]/[0.03] shadow-[0_8px_32px_-16px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/20 hover:bg-[#ff5a1f]/[0.05] hover:shadow-[0_16px_48px_-16px_rgba(99,102,241,0.18)]"
            >
              {/* Featured art */}
              <div className="relative overflow-hidden">
                <div className="transition-transform duration-500 group-hover:scale-[1.06]">
                  <BlogFeaturedImage slug={post.slug} />
                </div>
                {/* Art-to-text gradient overlay */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[rgba(11,9,12,0.85)] to-transparent" />
              </div>

              {/* Text */}
              <div className="flex flex-1 flex-col p-4">
                {post.tags.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-indigo-400/[0.08] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-indigo-300/70"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white transition-colors group-hover:text-indigo-200">
                  {post.title}
                </h3>

                <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-relaxed text-[#565061]">
                  {post.description}
                </p>

                <div className="mt-3 flex items-center justify-between text-[11px] text-[#565061]">
                  <div className="flex items-center gap-1.5">
                    <time dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                    <span>·</span>
                    <span>{post.readingTime} min read</span>
                  </div>
                  <svg
                    className="h-3.5 w-3.5 text-indigo-400/0 transition-all duration-200 group-hover:text-indigo-400/60"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
