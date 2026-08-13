import {
  getAllSlugs,
  getPostBySlug,
  getAllPosts,
  getAvailableLocales,
  getSupportedLocales,
  type Locale,
} from "@/lib/blog";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { MarkdownRenderer } from "./markdown";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/json-ld";
import { BlogFeaturedImage } from "@/components/blog-featured-images";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  const locales = getSupportedLocales().filter((l) => l !== "en");
  const params: { locale: string; slug: string }[] = [];

  for (const locale of locales) {
    for (const slug of slugs) {
      const available = getAvailableLocales(slug);
      if (available.includes(locale as Locale)) {
        params.push({ locale, slug });
      }
    }
  }

  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug, locale as Locale);
  if (!post) return {};

  const availableLocales = getAvailableLocales(slug);
  const languages: Record<string, string> = {};
  for (const loc of availableLocales) {
    if (loc === "en") {
      languages[loc] = `https://firechess.com/blog/${slug}`;
    } else {
      languages[loc] = `https://firechess.com/${loc}/blog/${slug}`;
    }
  }
  // x-default points to English
  languages["x-default"] = `https://firechess.com/blog/${slug}`;

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
      locale: locale,
      images: [
        {
          url: `https://firechess.com/api/og?title=${encodeURIComponent(post.title)}&slug=${encodeURIComponent(slug)}`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [
        `https://firechess.com/api/og?title=${encodeURIComponent(post.title)}&slug=${encodeURIComponent(slug)}`,
      ],
    },
    alternates: {
      canonical: `https://firechess.com/${locale}/blog/${slug}`,
      languages,
    },
  };
}

export default async function LocalizedBlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  const localeTyped = locale as Locale;

  // Validate locale
  if (!getSupportedLocales().includes(localeTyped)) notFound();
  if (localeTyped === "en") notFound(); // English uses /blog/ directly

  const post = getPostBySlug(slug, localeTyped);
  if (!post) notFound();

  // Only serve if we have an actual translation (not just English fallback)
  const available = getAvailableLocales(slug);
  if (!available.includes(localeTyped)) notFound();

  const allPosts = getAllPosts(localeTyped);
  const idx = allPosts.findIndex((p) => p.slug === slug);
  const prev = idx < allPosts.length - 1 ? allPosts[idx + 1] : null;
  const next = idx > 0 ? allPosts[idx - 1] : null;

  const blogBase = `/${locale}/blog`;

  return (
    <div className="min-h-[80vh] px-4 py-12 sm:px-6">
      <ArticleJsonLd
        title={post.title}
        description={post.description}
        url={`https://firechess.com${blogBase}/${slug}`}
        datePublished={post.date}
        author={post.author}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Blog", href: blogBase },
          { name: post.title, href: `${blogBase}/${slug}` },
        ]}
      />
      <div className="mx-auto max-w-3xl">
        {/* Breadcrumb */}
        <Link
          href={blogBase}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-300"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
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
              {new Date(post.date).toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span>·</span>
            <span>{post.readingTime} min read</span>
          </div>

          {/* Language switcher */}
          {available.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {available.map((loc) => {
                const href =
                  loc === "en" ? `/blog/${slug}` : `/${loc}/blog/${slug}`;
                const labels: Record<string, string> = {
                  en: "English",
                  es: "Español",
                  de: "Deutsch",
                  fr: "Français",
                  pt: "Português",
                  ru: "Русский",
                };
                return (
                  <Link
                    key={loc}
                    href={href}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      loc === localeTyped
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-white/[0.04] text-slate-500 hover:bg-white/[0.08] hover:text-slate-300"
                    }`}
                  >
                    {labels[loc] ?? loc}
                  </Link>
                );
              })}
            </div>
          )}
        </header>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <BlogFeaturedImage slug={post.slug} />
        </div>

        {/* Content */}
        <article className="prose-firechess mt-10">
          <MarkdownRenderer content={post.content} />
        </article>

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-orange-500/10 bg-gradient-to-b from-orange-500/[0.04] to-transparent p-6 text-center">
          <p className="text-lg font-semibold text-white">
            {localeTyped === "es"
              ? "¿Listo para encontrar tus debilidades?"
              : localeTyped === "de"
                ? "Bereit, deine Schwächen zu finden?"
                : localeTyped === "fr"
                  ? "Prêt à trouver vos faiblesses?"
                  : localeTyped === "pt"
                    ? "Pronto para encontrar seus pontos fracos?"
                    : localeTyped === "ru"
                      ? "Готовы найти свои слабые стороны?"
                      : "Ready to find your chess weaknesses?"}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {localeTyped === "es"
              ? "Analiza tus partidas con FireChess — impulsado por Stockfish 18, gratis."
              : localeTyped === "de"
                ? "Analysiere deine Spiele mit FireChess — mit Stockfish 18, kostenlos."
                : localeTyped === "fr"
                  ? "Analysez vos parties avec FireChess — propulsé par Stockfish 18, gratuit."
                  : localeTyped === "pt"
                    ? "Analise seus jogos com FireChess — powered by Stockfish 18, gratuito."
                    : localeTyped === "ru"
                      ? "Анализируйте свои партии в FireChess — на Stockfish 18, бесплатно."
                      : "Scan your games with FireChess — powered by Stockfish 18, free to use."}
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:shadow-glow-sm"
          >
            {localeTyped === "es"
              ? "Analizar mis partidas"
              : localeTyped === "de"
                ? "Meine Spiele analysieren"
                : localeTyped === "fr"
                  ? "Analyser mes parties"
                  : localeTyped === "pt"
                    ? "Analisar meus jogos"
                    : localeTyped === "ru"
                      ? "Анализировать мои партии"
                      : "Analyze My Games"}
          </Link>
        </div>

        {/* Prev / Next */}
        {(prev || next) && (
          <nav className="mt-10 grid gap-4 sm:grid-cols-2">
            {prev ? (
              <Link
                href={`${blogBase}/${prev.slug}`}
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
                href={`${blogBase}/${next.slug}`}
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

        {/* Related posts */}
        {(() => {
          const tagSet = new Set(post.tags);
          const related = allPosts
            .filter(
              (p) =>
                p.slug !== slug && p.tags.some((t) => tagSet.has(t)),
            )
            .slice(0, 3);
          if (related.length === 0) return null;
          return (
            <section className="mt-14">
              <h2 className="mb-5 text-lg font-bold text-white">
                {localeTyped === "es"
                  ? "Artículos relacionados"
                  : localeTyped === "de"
                    ? "Verwandte Artikel"
                    : localeTyped === "fr"
                      ? "Articles connexes"
                      : localeTyped === "pt"
                        ? "Artigos relacionados"
                        : localeTyped === "ru"
                          ? "Похожие статьи"
                          : "Related Articles"}
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {related.map((rp) => (
                  <Link
                    key={rp.slug}
                    href={`${blogBase}/${rp.slug}`}
                    className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
                  >
                    <p className="line-clamp-2 text-sm font-semibold text-slate-200 transition-colors group-hover:text-white">
                      {rp.title}
                    </p>
                    <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">
                      {rp.description}
                    </p>
                    <div className="mt-2 text-[11px] text-slate-600">
                      {new Date(rp.date).toLocaleDateString(locale, {
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })()}
      </div>
    </div>
  );
}
