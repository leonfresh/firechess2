import { getAllSlugs, getPostBySlug, getAllPosts } from "@/lib/blog";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { MarkdownRenderer } from "./markdown";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} | FireChess Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: "summary",
      title: post.title,
      description: post.description,
    },
    alternates: {
      canonical: `https://firechess.com/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  // Find prev/next posts for navigation
  const allPosts = getAllPosts();
  const idx = allPosts.findIndex((p) => p.slug === slug);
  const prev = idx < allPosts.length - 1 ? allPosts[idx + 1] : null;
  const next = idx > 0 ? allPosts[idx - 1] : null;

  return (
    <div className="min-h-[80vh] px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl">
        {/* Breadcrumb */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All posts
        </Link>

        {/* Header */}
        <header className="mt-6">
          {post.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
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

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {post.title}
          </h1>

          <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
            <span>{post.author}</span>
            <span>·</span>
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
        </header>

        {/* Content */}
        <article className="prose-firechess mt-10">
          <MarkdownRenderer content={post.content} />
        </article>

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-emerald-500/10 bg-gradient-to-b from-emerald-500/[0.04] to-transparent p-6 text-center">
          <p className="text-lg font-semibold text-white">
            Ready to find your chess weaknesses?
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Scan your games with FireChess — powered by Stockfish 18, free to use.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-all duration-300 hover:shadow-glow-sm"
          >
            Analyze My Games
          </Link>
        </div>

        {/* Prev / Next */}
        {(prev || next) && (
          <nav className="mt-10 grid gap-4 sm:grid-cols-2">
            {prev ? (
              <Link
                href={`/blog/${prev.slug}`}
                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
              >
                <span className="text-xs text-slate-600">← Previous</span>
                <p className="mt-1 text-sm font-medium text-slate-300 transition-colors group-hover:text-white">
                  {prev.title}
                </p>
              </Link>
            ) : (
              <div />
            )}
            {next && (
              <Link
                href={`/blog/${next.slug}`}
                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-right transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
              >
                <span className="text-xs text-slate-600">Next →</span>
                <p className="mt-1 text-sm font-medium text-slate-300 transition-colors group-hover:text-white">
                  {next.title}
                </p>
              </Link>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
