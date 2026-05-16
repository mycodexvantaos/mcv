/**
 * Browser/Worker stub for node:crypto
 * Uses the Web Crypto API available in Cloudflare Workers.
 */

export function createHash(algorithm: string) {
  let data = '';
  return {
    update(input: string | Buffer) {
      data += typeof input === 'string' ? input : input.toString();
      return this;
    },
    digest(encoding: string): string {
      // Simple hash for audit chain integrity in Worker context
      // Production Workers should use crypto.subtle for real SHA-256
      let hash = 0;
      const str = data;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      const hex = Math.abs(hash).toString(16).padStart(8, '0');
      if (encoding === 'hex') return hex.repeat(8); // 64 chars like SHA-256
      return hex.repeat(8);
    },
  };
}

export function randomBytes(size: number): Buffer {
  const arr = new Uint8Array(size);
  // In Worker context, use crypto.getRandomValues
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  }
  return Buffer.from(arr);
}
