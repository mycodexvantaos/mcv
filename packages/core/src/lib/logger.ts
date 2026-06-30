/**
 * Structured logger for MyCodexVantaOS core services.
 *
 * Provides a `createLogger(namespace)` factory that returns a logger
 * with `info`, `warn`, and `error` methods.  Each method accepts
 * (data: unknown, message?: string) and writes a single JSON-lines
 * entry to stdout/stderr, making logs grep-able and pipe-friendly.
 *
 * @module @mycodexvantaos/core/lib/logger
 */

export interface Logger {
  info(data: unknown, message?: string): void;
  warn(data: unknown, message?: string): void;
  error(data: unknown, message?: string): void;
}

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  namespace: string;
  message?: string;
  data?: unknown;
}

function formatEntry(
  level: LogEntry["level"],
  namespace: string,
  data: unknown,
  message?: string
): string {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    namespace,
    ...(message ? { message } : {}),
    ...(data !== undefined ? { data } : {}),
  };
  return JSON.stringify(entry);
}

/**
 * Create a scoped logger instance.
 *
 * @param namespace - Logical scope (e.g. 'api-node', 'core-auth:jwt')
 * @returns Logger with info/warn/error methods
 */
export function createLogger(namespace: string): Logger {
  return {
    info(data: unknown, message?: string): void {
      process.stdout.write(formatEntry("info", namespace, data, message) + "\n");
    },
    warn(data: unknown, message?: string): void {
      process.stderr.write(formatEntry("warn", namespace, data, message) + "\n");
    },
    error(data: unknown, message?: string): void {
      process.stderr.write(formatEntry("error", namespace, data, message) + "\n");
    },
  };
}
