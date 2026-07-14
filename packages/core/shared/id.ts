/**
 * MyCodexVantaOS — Shared ID Utilities
 * Platform-neutral ID generation and validation.
 * No cloud vendor dependencies.
 */

export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${timestamp}_${random}`;
}

export function generateUrn(
  namespace: string,
  service: string,
  collection: string,
  id: string
): string {
  return `urn:${namespace}:${service}:${collection}:${id}`;
}

export function isValidKebabCase(name: string): boolean {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name);
}

export const PLATFORM_NAMESPACE = 'mycodexvantaos';
export const URN_SCHEME = 'urn:mycodexvantaos';
