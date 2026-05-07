/**
 * Cloudflare Pages Type Definitions for MyCodeXvantaOS
 */

declare global {
  interface CloudflareEnv {
    // Cloudflare bindings
    CLOUDFLARE_ACCOUNT_ID: string;
    CLOUDFLARE_ZONE_ID: string;
    
    // Environment
    ENVIRONMENT: 'production' | 'preview' | 'development';
    NEXT_PUBLIC_APP_URL: string;
    
    // Database
    DATABASE_URL?: string;
    REDIS_URL?: string;
    
    // Authentication
    NEXTAUTH_SECRET?: string;
    NEXTAUTH_URL?: string;
    
    // AI Services
    GENKIT_API_KEY?: string;
    OPENAI_API_KEY?: string;
    ANTHROPIC_API_KEY?: string;
    GOOGLE_AI_API_KEY?: string;
  }
}

export interface PagesFunction<Env = CloudflareEnv> {
  (context: {
    request: Request;
    env: Env;
    params: Record<string, string>;
    data: Record<string, unknown>;
    next: (input?: Request | RequestInit) => Promise<Response>;
    functionPath: string;
  }): Promise<Response>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1Result>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  raw<T = unknown[]>(): Promise<T[]>;
}

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta?: {
    changed_db?: boolean;
    changes?: number;
    duration?: number;
    last_row_id?: number;
    rows_read?: number;
    rows_written?: number;
    size_after?: number;
  };
}

export {};