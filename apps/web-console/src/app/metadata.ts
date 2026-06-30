/**
 * MyCodexVantaOS Metadata Generator
 *
 * All metadata URLs MUST use the canonical production URL: https://mycodexvantaos.com
 * This includes: canonical, OpenGraph URL, Twitter card URL, structured data.
 *
 * Domain & Deployment Contract: https://mycodexvantaos.com
 */

import {
  buildCanonicalUrl,
  getCanonicalUrl,
  resolveEnvironment,
} from '@mycodexvantaos/core/config/domains';

export interface PageMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  openGraph: OpenGraphMetadata;
  twitter: TwitterMetadata;
  structuredData?: Record<string, unknown>;
}

export interface OpenGraphMetadata {
  title: string;
  description: string;
  url: string;
  siteName: string;
  images: Array<{ url: string; width: number; height: number; alt: string }>;
  type: 'website' | 'article' | 'product';
  locale: string;
}

export interface TwitterMetadata {
  card: 'summary' | 'summary_large_image' | 'app' | 'player';
  title: string;
  description: string;
  images: string[];
  site: string;
  creator?: string;
}

const SITE_NAME = 'MyCodexVantaOS';
const TWITTER_HANDLE = '@mycodexvantaos';
const DEFAULT_OG_IMAGE_PATH = '/og-image.png';
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

/**
 * Generate page metadata with canonical URL enforcement.
 * All URLs MUST use https://mycodexvantaos.com in production.
 */
export function generatePageMetadata(options: {
  title: string;
  description: string;
  path?: string;
  ogImagePath?: string;
  type?: 'website' | 'article' | 'product';
  locale?: string;
}): PageMetadata {
  const env = resolveEnvironment();
  const canonicalBase = getCanonicalUrl(env);
  const path = options.path ?? '/';
  const canonicalUrl = buildCanonicalUrl(path, env);
  const ogImagePath = options.ogImagePath ?? DEFAULT_OG_IMAGE_PATH;
  const ogImageUrl = buildCanonicalUrl(ogImagePath, env);

  return {
    title: `${options.title} | ${SITE_NAME}`,
    description: options.description,
    canonicalUrl,
    openGraph: {
      title: options.title,
      description: options.description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImageUrl,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: `${options.title} — ${SITE_NAME}`,
        },
      ],
      type: options.type ?? 'website',
      locale: options.locale ?? 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: options.title,
      description: options.description,
      images: [ogImageUrl],
      site: TWITTER_HANDLE,
    },
  };
}

/**
 * Generate structured data (JSON-LD) for the organization.
 * URL MUST use canonical production URL.
 */
export function generateOrganizationStructuredData(): Record<string, unknown> {
  const env = resolveEnvironment();
  const canonicalUrl = getCanonicalUrl(env);

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: canonicalUrl,
    logo: buildCanonicalUrl('/logo.png', env),
    sameAs: ['https://github.com/mycodexvantaos', 'https://twitter.com/mycodexvantaos'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'technical support',
      url: buildCanonicalUrl('/contact', env),
    },
  };
}

/**
 * Generate structured data (JSON-LD) for a software product.
 */
export function generateSoftwareProductStructuredData(): Record<string, unknown> {
  const env = resolveEnvironment();
  const canonicalUrl = getCanonicalUrl(env);

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Linux, macOS, Windows',
    url: canonicalUrl,
    description:
      'MyCodexVantaOS is an AI-era upstream software infrastructure platform that vertically integrates compute, data, algorithms, agents, declarative contracts, executable governance, and outcome-based billing.',
    offers: {
      '@type': 'Offer',
      url: buildCanonicalUrl('/pricing', env),
    },
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: canonicalUrl,
    },
  };
}

/**
 * Default root metadata for Next.js App Router layout.tsx
 */
export function getRootMetadata() {
  const env = resolveEnvironment();
  const canonicalUrl = getCanonicalUrl(env);

  return {
    metadataBase: new URL(canonicalUrl),
    title: {
      default: `${SITE_NAME} — AI-Era Infrastructure Platform`,
      template: `%s | ${SITE_NAME}`,
    },
    description:
      'MyCodexVantaOS is a contract-first AI infrastructure platform with executable governance, self-hostable architecture, and outcome-based billing.',
    applicationName: SITE_NAME,
    keywords: [
      'AI infrastructure',
      'agent runtime',
      'governance',
      'contract-first',
      'self-hostable',
    ],
    authors: [{ name: SITE_NAME, url: canonicalUrl }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    robots: {
      index: env === 'production',
      follow: env === 'production',
      googleBot: {
        index: env === 'production',
        follow: env === 'production',
      },
    },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: canonicalUrl,
      siteName: SITE_NAME,
      title: `${SITE_NAME} — AI-Era Infrastructure Platform`,
      description:
        'Contract-first AI infrastructure platform with executable governance and self-hostable architecture.',
      images: [
        {
          url: buildCanonicalUrl('/og-image.png', env),
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: `${SITE_NAME} — AI-Era Infrastructure Platform`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_NAME} — AI-Era Infrastructure Platform`,
      description: 'Contract-first AI infrastructure platform.',
      images: [buildCanonicalUrl('/og-image.png', env)],
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION ?? '',
    },
  };
}
