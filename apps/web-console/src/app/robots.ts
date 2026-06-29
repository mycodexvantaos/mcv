/**
 * MyCodexVantaOS robots.txt Generator
 *
 * Production robots.txt MUST use canonical URL: https://mycodexvantaos.com
 * FORBIDDEN: localhost, preview URLs, or vendor platform URLs in production robots.txt
 *
 * Domain & Deployment Contract: https://mycodexvantaos.com
 */

import { getCanonicalUrl, resolveEnvironment } from "@mycodexvantaos/core/config/domains";

export interface RobotsConfig {
  rules: RobotsRule[];
  sitemap: string;
  host: string;
}

export interface RobotsRule {
  userAgent: string | string[];
  allow?: string | string[];
  disallow?: string | string[];
  crawlDelay?: number;
}

/**
 * Generate robots.txt configuration.
 * Sitemap and host MUST use production canonical URL.
 */
export function generateRobotsConfig(): RobotsConfig {
  const env = resolveEnvironment();
  const canonicalUrl = getCanonicalUrl(env);

  // In non-production environments, disallow all crawling
  if (env !== "production") {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      sitemap: `${canonicalUrl}/sitemap.xml`,
      host: canonicalUrl,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/_next/",
          "/private/",
          "/internal/",
          "/*.json$",
          "/auth/",
        ],
      },
      {
        userAgent: "GPTBot",
        disallow: "/",
      },
      {
        userAgent: "ChatGPT-User",
        disallow: "/",
      },
      {
        userAgent: "CCBot",
        disallow: "/",
      },
      {
        userAgent: "anthropic-ai",
        disallow: "/",
      },
    ],
    sitemap: `${canonicalUrl}/sitemap.xml`,
    host: canonicalUrl,
  };
}

/**
 * Serialize robots configuration to robots.txt format.
 */
export function serializeRobots(config: RobotsConfig): string {
  const lines: string[] = [
    `# MyCodexVantaOS robots.txt`,
    `# Canonical URL: ${config.host}`,
    `# Generated: ${new Date().toISOString()}`,
    "",
  ];

  for (const rule of config.rules) {
    const agents = Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent];
    for (const agent of agents) {
      lines.push(`User-agent: ${agent}`);
    }

    if (rule.allow) {
      const allows = Array.isArray(rule.allow) ? rule.allow : [rule.allow];
      for (const path of allows) {
        lines.push(`Allow: ${path}`);
      }
    }

    if (rule.disallow) {
      const disallows = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
      for (const path of disallows) {
        lines.push(`Disallow: ${path}`);
      }
    }

    if (rule.crawlDelay !== undefined) {
      lines.push(`Crawl-delay: ${rule.crawlDelay}`);
    }

    lines.push("");
  }

  lines.push(`Sitemap: ${config.sitemap}`);
  lines.push(`Host: ${config.host}`);

  return lines.join("\n");
}

/**
 * Generate the complete robots.txt content.
 * Host and Sitemap MUST use https://mycodexvantaos.com in production.
 */
export function generateRobotsTxt(): string {
  const config = generateRobotsConfig();
  return serializeRobots(config);
}

// Next.js App Router robots.ts export
export default function robots() {
  const env = resolveEnvironment();
  const canonicalUrl = getCanonicalUrl(env);

  if (env !== "production") {
    return {
      rules: { userAgent: "*", disallow: "/" },
      sitemap: `${canonicalUrl}/sitemap.xml`,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/_next/", "/private/", "/internal/", "/auth/"],
      },
      { userAgent: "GPTBot", disallow: "/" },
      { userAgent: "ChatGPT-User", disallow: "/" },
      { userAgent: "CCBot", disallow: "/" },
      { userAgent: "anthropic-ai", disallow: "/" },
    ],
    sitemap: `${canonicalUrl}/sitemap.xml`,
    host: canonicalUrl,
  };
}
