/**
 * MyCodexVantaOS Redirect Rules
 *
 * Enforces Domain & Deployment Contract redirect requirements:
 * - www.mycodexvantaos.com → 301 → https://mycodexvantaos.com
 * - http://mycodexvantaos.com → 301 → https://mycodexvantaos.com
 *
 * FORBIDDEN: Using vendor-generated URLs as redirect targets.
 */

import { AppEnvironment, domains, resolveEnvironment } from "../config/domains";

export interface RedirectRule {
  source: string | RegExp;
  destination: string;
  statusCode: 301 | 302 | 307 | 308;
  permanent: boolean;
}

export interface RedirectResult {
  shouldRedirect: boolean;
  destination?: string;
  statusCode?: 301 | 302 | 307 | 308;
}

/**
 * Production redirect rules derived from Domain & Deployment Contract.
 */
export function getProductionRedirectRules(): RedirectRule[] {
  const { canonicalUrl, wwwUrl } = domains.production;

  return [
    // www → apex (301 permanent)
    {
      source: /^https?:\/\/www\.mycodexvantaos\.com(\/.*)?$/,
      destination: canonicalUrl,
      statusCode: 301,
      permanent: true,
    },
    // HTTP → HTTPS (301 permanent)
    {
      source: /^http:\/\/mycodexvantaos\.com(\/.*)?$/,
      destination: canonicalUrl,
      statusCode: 301,
      permanent: true,
    },
    // HTTP www → HTTPS apex (301 permanent)
    {
      source: /^http:\/\/www\.mycodexvantaos\.com(\/.*)?$/,
      destination: canonicalUrl,
      statusCode: 301,
      permanent: true,
    },
  ];
}

/**
 * Evaluate whether a request URL should be redirected.
 *
 * @param requestUrl - The full request URL
 * @param env - The application environment
 * @returns RedirectResult indicating whether to redirect and where
 */
export function evaluateRedirect(requestUrl: string, env?: AppEnvironment): RedirectResult {
  const resolvedEnv = env ?? resolveEnvironment();

  if (resolvedEnv !== "production") {
    return { shouldRedirect: false };
  }

  const rules = getProductionRedirectRules();

  for (const rule of rules) {
    let matches = false;
    let pathMatch = "";

    if (rule.source instanceof RegExp) {
      const match = requestUrl.match(rule.source);
      if (match) {
        matches = true;
        pathMatch = match[1] ?? "";
      }
    } else {
      matches = requestUrl === rule.source;
    }

    if (matches) {
      const destination = pathMatch ? `${rule.destination}${pathMatch}` : rule.destination;

      return {
        shouldRedirect: true,
        destination,
        statusCode: rule.statusCode,
      };
    }
  }

  return { shouldRedirect: false };
}

/**
 * Check if a request is from the www subdomain and should be redirected.
 */
export function isWwwRedirect(host: string): boolean {
  return host === "www.mycodexvantaos.com" || host.startsWith("www.");
}

/**
 * Check if a request is HTTP and should be redirected to HTTPS.
 */
export function isHttpRedirect(protocol: string): boolean {
  return protocol === "http" || protocol === "http:";
}

/**
 * Get the canonical redirect destination for a given host and path.
 */
export function getCanonicalRedirectDestination(
  host: string,
  path: string = "/",
  env?: AppEnvironment
): string | null {
  const resolvedEnv = env ?? resolveEnvironment();
  if (resolvedEnv !== "production") return null;

  const canonicalHost = "mycodexvantaos.com";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (host === `www.${canonicalHost}` || host === `www.${canonicalHost}:443`) {
    return `https://${canonicalHost}${normalizedPath}`;
  }

  return null;
}

/**
 * Next.js redirect configuration for next.config.js.
 * Returns an array of redirect rules compatible with Next.js.
 */
export function getNextJsRedirects(): Array<{
  source: string;
  destination: string;
  permanent: boolean;
  has?: Array<{ type: string; key: string; value: string }>;
}> {
  return [
    // www → apex
    {
      source: "/:path*",
      destination: "https://mycodexvantaos.com/:path*",
      permanent: true,
      has: [{ type: "host", key: "host", value: "www.mycodexvantaos.com" }],
    },
  ];
}

/**
 * Cloudflare Pages / Workers redirect rules (_redirects file format).
 */
export function getCloudflareRedirects(): string {
  return [
    "# MyCodexVantaOS Redirect Rules",
    "# Domain & Deployment Contract: https://mycodexvantaos.com",
    "",
    "# www → apex (301 permanent)",
    "https://www.mycodexvantaos.com/* https://mycodexvantaos.com/:splat 301",
    "",
    "# HTTP → HTTPS (handled by Cloudflare edge, but defined here for completeness)",
    "http://mycodexvantaos.com/* https://mycodexvantaos.com/:splat 301",
    "http://www.mycodexvantaos.com/* https://mycodexvantaos.com/:splat 301",
  ].join("\n");
}
