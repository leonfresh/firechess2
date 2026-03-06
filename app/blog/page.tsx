import { getAllPosts } from "@/lib/blog";
import { BlogFeaturedImage } from "@/components/blog-featured-images";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chess Improvement Blog",
  description:
    "Tips, guides, and analysis techniques to improve your chess. Learn about opening preparation, tactical patterns, endgame theory, and how to use engine analysis effectively.",
  openGraph: {
    title: "Chess Improvement Blog | FireChess",
    description:
      "Tips, guides, and analysis techniques to improve your chess — openings, tactics, endgames, and engine analysis.",
    url: "https://firechess.com/blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chess Improvement Blog | FireChess",
    description:
      "Guides, tips, and analysis techniques to level up your chess.",
  },
  alternates: { canonical: "https://firechess.com/blog" },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-[80vh] px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <h1 className="text-4xl font-bold tracking-tight text-white">Blog</h1>
        <p className="mt-2 text-lg text-slate-400">
          Guides, tips, and analysis techniques to level up your chess.
        </p>

        {/* Masonry grid */}
        <div className="mt-10 columns-1 gap-6 sm:columns-2">
          {posts.length === 0 ? (
            <p className="text-slate-500">No posts yet. Check back soon!</p>
          ) : (
            posts.map((post) => (
              <article
                key={post.slug}
                className="mb-6 break-inside-avoid"
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-all hover:border-white/[0.10] hover:bg-white/[0.04]"
                >
                  {/* Featured artwork */}
                  <div className="overflow-hidden">
                    <div className="transition-transform duration-300 group-hover:scale-[1.03]">
                      <BlogFeaturedImage slug={post.slug} />
                    </div>
                  </div>

                  <div className="p-5">
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

                    <h2 className="text-lg font-semibold leading-snug text-white transition-colors group-hover:text-emerald-400">
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
                  </div>
                </Link>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
