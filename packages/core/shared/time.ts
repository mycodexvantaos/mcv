/**
 * MyCodexVantaOS — Shared Time Utilities
 * Platform-neutral timestamp handling.
 */

export function nowISO(): string {
  return new Date().toISOString();
}

export function parseISO(ts: string): Date {
  return new Date(ts);
}

export function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now();
}

export function addDays(isoTs: string, days: number): string {
  const d = new Date(isoTs);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function daysBetween(startISO: string, endISO: string): number {
  const start = new Date(startISO).getTime();
  const end = new Date(endISO).getTime();
  return Math.floor((end - start) / (1000 * 60 * 60 * 24));
}
