/**
 * MyCodeXvantaOS Native Logging Implementation
 * Provides a comprehensive logging system with multiple levels and formats
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  levelName: string;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  metadata?: Record<string, any>;
  includeTimestamp?: boolean;
}

export interface LoggerOptions {
  name?: string;
  level?: LogLevel;
  includeTimestamp?: boolean;
  includeStackTrace?: boolean;
  enableConsole?: boolean;
  enableFile?: boolean;
  filePath?: string;
  format?: 'json' | 'text';
}

export interface LogTransport {
  write(entry: LogEntry): Promise<void> | void;
}

class ConsoleTransport implements LogTransport {
  write(entry: LogEntry): void {
    const levelColors = {
      [LogLevel.DEBUG]: '\x1b[36m', // cyan
      [LogLevel.INFO]: '\x1b[32m', // green
      [LogLevel.WARN]: '\x1b[33m', // yellow
      [LogLevel.ERROR]: '\x1b[31m', // red
      [LogLevel.FATAL]: '\x1b[35m', // magenta
    };

    const color = levelColors[entry.level] || '\x1b[0m';
    const timestamp = entry.includeTimestamp ? entry.timestamp.toISOString() : '';
    const error = entry.error ? `\nError: ${entry.error.message}\nStack: ${entry.error.stack}` : '';
    const context = entry.context ? `\nContext: ${JSON.stringify(entry.context, null, 2)}` : '';

    const message = `${color}[${entry.levelName}]${'\x1b[0m'} ${timestamp ? `[${timestamp}]` : ''} ${entry.message}${error}${context}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message);
        break;
    }
  }

  private entry: LogEntry | null = null;
}

class FileTransport implements LogTransport {
  private filePath: string;
  private writeQueue: LogEntry[] = [];
  private isWriting: boolean = false;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async write(entry: LogEntry): Promise<void> {
    this.writeQueue.push(entry);
    await this.flush();
  }

  private async flush(): Promise<void> {
    if (this.isWriting || this.writeQueue.length === 0) return;

    this.isWriting = true;
    const entries = this.writeQueue.splice(0, this.writeQueue.length);

    try {
      const fs = require('fs').promises;
      const logs = entries.map((e) => JSON.stringify(e)).join('\n') + '\n';
      await fs.appendFile(this.filePath, logs, 'utf8');
    } catch (error) {
      console.error('Failed to write logs to file:', error);
    } finally {
      this.isWriting = false;
    }
  }
}

export class NativeLogger {
  private name: string;
  private level: LogLevel;
  private includeTimestamp: boolean;
  private includeStackTrace: boolean;
  private transports: LogTransport[] = [];
  private format: 'json' | 'text';

  constructor(options: LoggerOptions = {}) {
    this.name = options.name || 'default';
    this.level = options.level ?? LogLevel.INFO;
    this.includeTimestamp = options.includeTimestamp ?? true;
    this.includeStackTrace = options.includeStackTrace ?? false;
    this.format = options.format || 'text';

    if (options.enableConsole ?? true) {
      this.addTransport(new ConsoleTransport());
    }

    if (options.enableFile && options.filePath) {
      this.addTransport(new FileTransport(options.filePath));
    }
  }

  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatLevel(level: LogLevel): string {
    return LogLevel[level];
  }

  private async writeLog(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): Promise<void> {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      levelName: this.formatLevel(level),
      message,
      context,
      error: error && this.includeStackTrace ? error : error,
      metadata: {
        loggerName: this.name,
        includeTimestamp: this.includeTimestamp,
      },
    };

    for (const transport of this.transports) {
      try {
        await transport.write(entry);
      } catch (err) {
        console.error('Failed to write log to transport:', err);
      }
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.writeLog(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.writeLog(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.writeLog(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.writeLog(LogLevel.ERROR, message, context, error);
  }

  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.writeLog(LogLevel.FATAL, message, context, error);
  }

  async flush(): Promise<void> {
    for (const transport of this.transports) {
      if (transport instanceof FileTransport) {
        await transport.write({} as any);
      }
    }
  }

  child(childName: string): NativeLogger {
    const childLogger = new NativeLogger({
      name: `${this.name}.${childName}`,
      level: this.level,
      includeTimestamp: this.includeTimestamp,
      includeStackTrace: this.includeStackTrace,
      format: this.format,
    });
    childLogger.transports = [...this.transports];
    return childLogger;
  }
}

// Singleton logger instance
let defaultLogger: NativeLogger | null = null;

export function createLogger(options?: LoggerOptions): NativeLogger {
  return new NativeLogger(options);
}

export function setDefaultLogger(logger: NativeLogger): void {
  defaultLogger = logger;
}

export function getDefaultLogger(): NativeLogger {
  if (!defaultLogger) {
    defaultLogger = new NativeLogger();
  }
  return defaultLogger;
}

export function debug(message: string, context?: Record<string, any>): void {
  getDefaultLogger().debug(message, context);
}

export function info(message: string, context?: Record<string, any>): void {
  getDefaultLogger().info(message, context);
}

export function warn(message: string, context?: Record<string, any>): void {
  getDefaultLogger().warn(message, context);
}

export function error(message: string, error?: Error, context?: Record<string, any>): void {
  getDefaultLogger().error(message, error, context);
}

export function fatal(message: string, error?: Error, context?: Record<string, any>): void {
  getDefaultLogger().fatal(message, error, context);
}

export default NativeLogger;
