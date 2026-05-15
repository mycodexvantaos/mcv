/**
 * Session Runtime Module
 *
 * This module provides session management capabilities including
 * session creation, storage, retrieval, and cleanup.
 */

export interface SessionData {
  id: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface SessionOptions {
  ttl?: number; // Time to live in seconds
  data?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface SessionStore {
  get(sessionId: string): Promise<SessionData | null>;
  set(sessionId: string, session: SessionData): Promise<void>;
  delete(sessionId: string): Promise<void>;
  clear(): Promise<void>;
  getAll(): Promise<SessionData[]>;
}

export interface SessionRuntimeOptions {
  defaultTTL?: number;
  cleanupInterval?: number;
  store?: SessionStore;
  autoStartCleanup?: boolean;
}

export class MemorySessionStore implements SessionStore {
  private sessions: Map<string, SessionData> = new Map();

  async get(sessionId: string): Promise<SessionData | null> {
    return this.sessions.get(sessionId) || null;
  }

  async set(sessionId: string, session: SessionData): Promise<void> {
    this.sessions.set(sessionId, session);
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async clear(): Promise<void> {
    this.sessions.clear();
  }

  async getAll(): Promise<SessionData[]> {
    return Array.from(this.sessions.values());
  }
}

export class SessionRuntime {
  private store: SessionStore;
  private defaultTTL: number;
  private cleanupInterval: number;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(options: SessionRuntimeOptions = {}) {
    this.store = options.store || new MemorySessionStore();
    this.defaultTTL = options.defaultTTL || 3600; // 1 hour default
    this.cleanupInterval = options.cleanupInterval || 300000; // 5 minutes

    // Only start cleanup timer if not disabled (for tests)
    if (options.autoStartCleanup !== false) {
      this.startCleanup();
    }
  }

  /**
   * Create a new session
   */
  async create(userId?: string, options: SessionOptions = {}): Promise<SessionData> {
    const sessionId = this.generateSessionId();
    const now = new Date();

    const ttl = options.ttl || this.defaultTTL;
    const expiresAt = ttl ? new Date(now.getTime() + ttl * 1000) : undefined;

    const session: SessionData = {
      id: sessionId,
      userId,
      createdAt: now,
      updatedAt: now,
      expiresAt,
      data: options.data || {},
      metadata: options.metadata || {},
    };

    await this.store.set(sessionId, session);
    return session;
  }

  /**
   * Get a session by ID
   */
  async get(sessionId: string): Promise<SessionData | null> {
    const session = await this.store.get(sessionId);

    if (!session) {
      return null;
    }

    // Check if expired
    if (session.expiresAt && new Date() > session.expiresAt) {
      await this.delete(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Update session data
   */
  async update(sessionId: string, data: Partial<SessionData>): Promise<SessionData | null> {
    const session = await this.get(sessionId);

    if (!session) {
      return null;
    }

    const updatedSession: SessionData = {
      ...session,
      ...data,
      id: session.id, // Preserve ID
      createdAt: session.createdAt, // Preserve creation time
      updatedAt: new Date(),
      // Merge data by default
      data: {
        ...session.data,
        ...(data.data || {}),
      },
      metadata: {
        ...session.metadata,
        ...(data.metadata || {}),
      },
    };

    await this.store.set(sessionId, updatedSession);
    return updatedSession;
  }

  /**
   * Delete a session
   */
  async delete(sessionId: string): Promise<boolean> {
    const session = await this.get(sessionId);
    if (!session) {
      return false;
    }

    await this.store.delete(sessionId);
    return true;
  }

  /**
   * Delete all sessions for a user
   */
  async deleteUserSessions(userId: string): Promise<number> {
    const sessions = await this.store.getAll();
    let deleted = 0;

    for (const session of sessions) {
      if (session.userId === userId) {
        await this.delete(session.id);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Get all sessions
   */
  async getAll(): Promise<SessionData[]> {
    return await this.store.getAll();
  }

  /**
   * Get active (non-expired) sessions
   */
  async getActiveSessions(): Promise<SessionData[]> {
    const sessions = await this.store.getAll();
    const now = new Date();

    return sessions.filter((session) => {
      if (session.expiresAt && now > session.expiresAt) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    const sessions = await this.store.getAll();
    return sessions.filter((session) => session.userId === userId);
  }

  /**
   * Clear all sessions
   */
  async clear(): Promise<void> {
    await this.store.clear();
  }

  /**
   * Extend session TTL
   */
  async extendSession(sessionId: string, ttl?: number): Promise<SessionData | null> {
    const session = await this.get(sessionId);

    if (!session) {
      return null;
    }

    const newTTL = ttl || this.defaultTTL;
    const expiresAt = newTTL ? new Date(Date.now() + newTTL * 1000) : undefined;

    return await this.update(sessionId, { expiresAt });
  }

  /**
   * Check if session is valid
   */
  async isValid(sessionId: string): Promise<boolean> {
    const session = await this.get(sessionId);
    return session !== null;
  }

  /**
   * Get session data field
   */
  async getData<T = any>(sessionId: string, key: string): Promise<T | null> {
    const session = await this.get(sessionId);
    if (!session) {
      return null;
    }
    return session.data[key] || null;
  }

  /**
   * Set session data field
   */
  async setData(sessionId: string, key: string, value: any): Promise<boolean> {
    const session = await this.get(sessionId);
    if (!session) {
      return false;
    }

    const updated = await this.update(sessionId, {
      data: {
        ...session.data,
        [key]: value,
      },
    });

    return updated !== null;
  }

  /**
   * Remove session data field
   */
  async removeData(sessionId: string, key: string): Promise<boolean> {
    const session = await this.get(sessionId);
    if (!session) {
      return false;
    }

    // Create a new data object without the key
    const newData: Record<string, any> = { ...session.data };
    delete newData[key];

    // Deep merge - don't use update() here to avoid merging
    const updatedSession: SessionData = {
      ...session,
      data: newData,
      updatedAt: new Date(),
    };

    // Directly update the store
    await this.store.set(sessionId, updatedSession);

    return true;
  }

  /**
   * Start cleanup timer
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(async () => {
      await this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanup(): Promise<number> {
    const sessions = await this.store.getAll();
    const now = new Date();
    let cleaned = 0;

    for (const session of sessions) {
      if (session.expiresAt && now > session.expiresAt) {
        await this.delete(session.id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}`;
  }

  /**
   * Shutdown the session runtime
   */
  async shutdown(): Promise<void> {
    this.stopCleanup();
  }
}

export default SessionRuntime;
