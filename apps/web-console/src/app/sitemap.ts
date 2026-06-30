/**
 * MyCodexVantaOS Sitemap Generator
 *
 * All sitemap URLs MUST begin with https://mycodexvantaos.com in production.
 * FORBIDDEN: localhost, preview URLs, or vendor platform URLs in production sitemap.
 *
 * Domain & Deployment Contract: https://mycodexvantaos.com
 */

import {
  buildCanonicalUrl,
  getCanonicalUrl,
  resolveEnvironment,
} from "@mycodexvantaos/core/config/domains";

export interface SitemapEntry {
  url: string;
  lastModified?: Date | string;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

/**
 * Static pages included in the sitemap.
 * All URLs are relative paths — canonical base is prepended at generation time.
 */
const STATIC_PAGES: Array<Omit<SitemapEntry, "url"> & { path: string }> = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/features", changeFrequency: "monthly", priority: 0.9 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.9 },
  { path: "/docs", changeFrequency: "weekly", priority: 0.8 },
  { path: "/docs/getting-started", changeFrequency: "weekly", priority: 0.8 },
  { path: "/docs/api", changeFrequency: "weekly", priority: 0.8 },
  { path: "/docs/architecture", changeFrequency: "monthly", priority: 0.7 },
  { path: "/docs/governance", changeFrequency: "monthly", priority: 0.7 },
  { path: "/blog", changeFrequency: "daily", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/security", changeFrequency: "monthly", priority: 0.5 },
];

/**
 * Generate sitemap entries for static pages.
 * All URLs MUST use the canonical production URL.
 */
export function generateStaticSitemapEntries(): SitemapEntry[] {
  const env = resolveEnvironment();
  const lastModified = new Date();

  return STATIC_PAGES.map((page) => ({
    url: buildCanonicalUrl(page.path, env),
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}

/**
 * Validate that all sitemap entries use the canonical production URL.
 * Returns validation errors if any.
 */
export function validateSitemapEntries(entries: SitemapEntry[]): string[] {
  const errors: string[] = [];
  const env = resolveEnvironment();

  if (env !== "production") return errors;

  const canonicalBase = getCanonicalUrl("production");

  for (const entry of entries) {
    if (!entry.url.startsWith(canonicalBase)) {
      errors.push(
        `Sitemap URL violation: "${entry.url}" does not begin with canonical URL "${canonicalBase}". ` +
          `All production sitemap URLs MUST begin with ${canonicalBase}`
      );
    }

    // Check for forbidden vendor URLs
    const FORBIDDEN_PATTERNS = [
      /\.github\.io/,
      /\.pages\.dev/,
      /\.vercel\.app/,
      /\.netlify\.app/,
      /\.run\.app/,
      /localhost/,
    ];

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(entry.url)) {
        errors.push(
          `Sitemap URL violation: "${entry.url}" matches forbidden pattern ${pattern}. ` +
            `Production sitemap URLs must use https://mycodexvantaos.com`
        );
      }
    }
  }

  return errors;
}

/**
 * Serialize sitemap entries to XML format.
 */
export function serializeSitemapXml(entries: SitemapEntry[]): string {
  const urlElements = entries
    .map((entry) => {
      const lastMod = entry.lastModified
        ? typeof entry.lastModified === "string"
          ? entry.lastModified
          : entry.lastModified.toISOString().split("T")[0]
        : "";

      return [
        "  <url>",
        `    <loc>${entry.url}</loc>`,
        lastMod ? `    <lastmod>${lastMod}</lastmod>` : "",
        entry.changeFrequency ? `    <changefreq>${entry.changeFrequency}</changefreq>` : "",
        entry.priority !== undefined ? `    <priority>${entry.priority.toFixed(1)}</priority>` : "",
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlElements,
    "</urlset>",
  ].join("\n");
}

// Next.js App Router sitemap.ts export
export default function sitemap(): SitemapEntry[] {
  const entries = generateStaticSitemapEntries();

  // Validate in production
  if (resolveEnvironment() === "production") {
    const errors = validateSitemapEntries(entries);
    if (errors.length > 0) {
      console.error("[Sitemap] Domain contract violations:", errors);
      // In production, throw to prevent invalid sitemap from being served
      throw new Error(`Sitemap domain contract violations: ${errors.join("; ")}`);
    }
  }

  return entries;
}
