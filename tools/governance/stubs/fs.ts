/**
 * Browser/Worker stub for node:fs
 * The contracts-sdk uses readFileSync/readdirSync/existsSync at import time.
 * In the Worker, contracts are bundled at build time, not read from filesystem.
 * This stub provides no-op implementations that prevent bundling errors.
 */

export function readFileSync(): string {
  return '';
}

export function readdirSync(): string[] {
  return [];
}

export function existsSync(): boolean {
  return false;
}

export function statSync(): { isFile(): boolean; isDirectory(): boolean } {
  return { isFile: () => false, isDirectory: () => false };
}
