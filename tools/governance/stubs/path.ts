/**
 * Browser/Worker stub for node:path
 * Provides the path utilities needed by contracts-sdk.
 */

export function resolve(...paths: string[]): string {
  return paths.join('/');
}

export function join(...paths: string[]): string {
  return paths.join('/');
}

export function extname(path: string): string {
  const dot = path.lastIndexOf('.');
  return dot >= 0 ? path.slice(dot) : '';
}

export function dirname(path: string): string {
  const slash = path.lastIndexOf('/');
  return slash >= 0 ? path.slice(0, slash) : '.';
}

export function basename(path: string, ext?: string): string {
  const slash = path.lastIndexOf('/');
  const base = slash >= 0 ? path.slice(slash + 1) : path;
  return ext && base.endsWith(ext) ? base.slice(0, -ext.length) : base;
}

export const sep = '/';
