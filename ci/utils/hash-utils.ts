/**
 * ci/utils/hash-utils.ts
 *
 * Hash utilities for content-addressed and natural-key normalization.
 * Based on naming-spec-v1.md Section 9.7, Section 9.9
 */

import { createHash } from "crypto";

/**
 * Section 9.9 — Generate a content-addressed id from a prefix and content.
 * Format: <prefix>--sha256-<first12>
 */
export function contentAddressedId(prefix: string, content: string): string {
  const hash = createHash("sha256").update(content).digest("hex");
  return `${prefix}--sha256-${hash.slice(0, 12)}`;
}

/**
 * Section 9.7 — Normalize a natural key to kebab-case for use in composite identifiers.
 * Steps: trim → lowercase → slugify → remove forbidden chars → optional hash suffix
 */
export function normalizeNaturalKey(
  raw: string,
  opts: { maxLength?: number; addHashSuffix?: boolean } = {}
): string {
  const maxLength = opts.maxLength ?? 50;

  let slug = raw
    .trim()
    .toLowerCase()
    // Replace whitespace and underscores with hyphens
    .replace(/[\s_]+/g, "-")
    // Remove all characters not in [a-z0-9-]
    .replace(/[^a-z0-9-]/g, "")
    // Collapse multiple consecutive hyphens into one
    .replace(/-+/g, "-")
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, "");

  if (slug.length > maxLength || opts.addHashSuffix) {
    const hash = createHash("sha256").update(raw).digest("hex").slice(0, 8);
    slug = `${slug.slice(0, maxLength - 10)}--sha256-${hash}`;
  }

  return slug;
}

/**
 * Section 9.8 — Generate a timestamped auto-generated id.
 * Format: <prefix>--<YYYYMMDD>--<random6>
 */
export function timestampedId(prefix: string, date?: Date): string {
  const d = date ?? new Date();
  const yyyymmdd = d.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).slice(2, 8).padEnd(6, "0");
  return `${prefix}--${yyyymmdd}--${random}`;
}

/**
 * Section 9.10 — Generate a UUID-based id.
 * Format: <prefix>--<uuid-without-dashes>
 */
export function uuidBasedId(prefix: string, uuid: string): string {
  const normalized = uuid.replace(/-/g, "").toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(normalized)) {
    throw new Error(`Invalid UUID format: "${uuid}"`);
  }
  return `${prefix}--${normalized}`;
}
