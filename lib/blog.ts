/**
 * Blog utilities — reads .md files from content/blog/ and parses frontmatter.
 *
 * Supports locale-aware content: looks in content/blog/{locale}/ first,
 * falls back to content/blog/ (English) if no translation exists.
 *
 * Each post has: slug, title, description, date, author, tags, readingTime, content.
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const SUPPORTED_LOCALES = ["en", "es", "de", "fr", "pt", "ru"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  readingTime: number;
  content: string;
  locale: Locale;
};

/** Estimate reading time (~230 WPM). */
function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 230));
}

/** Resolve the directory for a given locale. */
function getLocaleDir(locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return BLOG_DIR;
  return path.join(BLOG_DIR, locale);
}

/**
 * Get all blog posts for a locale, sorted newest first.
 * Falls back to English for posts without a translation.
 */
export function getAllPosts(locale: Locale = DEFAULT_LOCALE): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  // Always get English slugs as the base set
  const enFiles = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"));

  const localeDir = getLocaleDir(locale);
  const hasLocaleDir = locale !== DEFAULT_LOCALE && fs.existsSync(localeDir);

  const posts = enFiles.map((filename) => {
    const slug = filename.replace(/\.md$/, "");

    // Try locale-specific file first, fall back to English
    let filePath = path.join(BLOG_DIR, filename);
    let resolvedLocale: Locale = DEFAULT_LOCALE;

    if (hasLocaleDir) {
      const localePath = path.join(localeDir, filename);
      if (fs.existsSync(localePath)) {
        filePath = localePath;
        resolvedLocale = locale;
      }
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);

    return {
      slug,
      title: data.title ?? slug,
      description: data.description ?? "",
      date: data.date ?? "2026-01-01",
      author: data.author ?? "FireChess Team",
      tags: data.tags ?? [],
      readingTime: estimateReadingTime(content),
      content,
      locale: resolvedLocale,
    } satisfies BlogPost;
  });

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

/**
 * Get a single post by slug for a given locale.
 * Falls back to English if no translation exists.
 */
export function getPostBySlug(
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
): BlogPost | null {
  const localeDir = getLocaleDir(locale);

  // Try locale-specific file first
  if (locale !== DEFAULT_LOCALE) {
    const localePath = path.join(localeDir, `${slug}.md`);
    if (fs.existsSync(localePath)) {
      const raw = fs.readFileSync(localePath, "utf-8");
      const { data, content } = matter(raw);
      return {
        slug,
        title: data.title ?? slug,
        description: data.description ?? "",
        date: data.date ?? "2026-01-01",
        author: data.author ?? "FireChess Team",
        tags: data.tags ?? [],
        readingTime: estimateReadingTime(content),
        content,
        locale,
      };
    }
  }

  // Fall back to English
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? "",
    date: data.date ?? "2026-01-01",
    author: data.author ?? "FireChess Team",
    tags: data.tags ?? [],
    readingTime: estimateReadingTime(content),
    content,
    locale: DEFAULT_LOCALE,
  };
}

/** Get all slugs (for generateStaticParams). */
export function getAllSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

/**
 * Get all locales that have a translation for a given slug.
 * Always includes "en" (the default/fallback).
 */
export function getAvailableLocales(slug: string): Locale[] {
  const available: Locale[] = [DEFAULT_LOCALE];

  for (const locale of SUPPORTED_LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    const localePath = path.join(getLocaleDir(locale), `${slug}.md`);
    if (fs.existsSync(localePath)) {
      available.push(locale);
    }
  }

  return available;
}

/** Get all supported locales. */
export function getSupportedLocales(): readonly Locale[] {
  return SUPPORTED_LOCALES;
}
