import { getAllPosts, getSupportedLocales, type Locale } from "@/lib/blog";
import { BlogFeaturedImage } from "@/components/blog-featured-images";
import Link from "next/link";
import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/json-ld";

const LOCALE_META: Record<
  string,
  { title: string; description: string; heading: string; subheading: string }
> = {
  es: {
    title: "Blog de Mejora en Ajedrez",
    description:
      "Guías, consejos y técnicas de análisis para mejorar tu ajedrez. Aprende sobre preparación de aperturas, patrones tácticos, teoría de finales y cómo usar el análisis de motor.",
    heading: "Blog de Mejora en Ajedrez",
    subheading:
      "Guías, consejos y técnicas de análisis para subir de nivel.",
  },
  de: {
    title: "Schachverbesserungs-Blog",
    description:
      "Tipps, Guides und Analysetechniken zur Verbesserung deines Schachs. Eröffnungsvorbereitung, taktische Muster, Endspieltheorie und Motoranalyse.",
    heading: "Schachverbesserungs-Blog",
    subheading:
      "Guides, Tipps und Analysetechniken für dein Schachspiel.",
  },
  fr: {
    title: "Blog d'Améliure aux Échecs",
    description:
      "Guides, conseils et techniques d'analyse pour progresser aux échecs. Préparation d'ouvertures, motifs tactiques, théorie des finales et analyse moteur.",
    heading: "Blog d'Améliure aux Échecs",
    subheading:
      "Guides, conseils et techniques pour progresser aux échecs.",
  },
  pt: {
    title: "Blog de Melhoria no Xadrez",
    description:
      "Guias, dicas e técnicas de análise para melhorar seu xadrez. Preparação de aberturas, padrões táticos, teoria de finais e análise de motor.",
    heading: "Blog de Melhoria no Xadrez",
    subheading:
      "Guias, dicas e técnicas de análise para elevar seu nível.",
  },
  ru: {
    title: "Блог по улучшению шахмат",
    description:
      "Руководства, советы и техники анализа для улучшения вашей шахматной игры. Подготовка дебютов, тактические паттерны, теория эндшпиля и анализ движком.",
    heading: "Блог по улучшению шахмат",
    subheading:
      "Руководства, советы и техники анализа для повышения уровня.",
  },
};

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = LOCALE_META[locale];
  if (!meta) return {};

  const languages: Record<string, string> = { en: "https://firechess.com/blog" };
  for (const loc of getSupportedLocales()) {
    if (loc === "en") continue;
    languages[loc] = `https://firechess.com/${loc}/blog`;
  }
  languages["x-default"] = "https://firechess.com/blog";

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: `${meta.title} | FireChess`,
      description: meta.description,
      url: `https://firechess.com/${locale}/blog`,
      type: "website",
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
      title: `${meta.title} | FireChess`,
      description: meta.description,
    },
    alternates: {
      canonical: `https://firechess.com/${locale}/blog`,
      languages,
    },
  };
}

export default async function LocalizedBlogPage({ params }: Props) {
  const { locale } = await params;
  const meta = LOCALE_META[locale];
  if (!meta) return null;

  const posts = getAllPosts(locale as Locale);
  const blogBase = `/${locale}/blog`;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Blog", href: blogBase },
        ]}
      />
      <div className="min-h-[80vh] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <h1 className="text-4xl font-bold tracking-tight text-white">
            {meta.heading}
          </h1>
          <p className="mt-2 text-lg text-slate-400">{meta.subheading}</p>

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
                    href={`${blogBase}/${post.slug}`}
                    className="group block overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-all hover:border-white/[0.10] hover:bg-white/[0.04]"
                  >
                    <div className="overflow-hidden">
                      <div className="transition-transform duration-300 group-hover:scale-[1.03]">
                        <BlogFeaturedImage slug={post.slug} />
                      </div>
                    </div>

                    <div className="p-5">
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
                          {new Date(post.date).toLocaleDateString(locale, {
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
    </>
  );
}
