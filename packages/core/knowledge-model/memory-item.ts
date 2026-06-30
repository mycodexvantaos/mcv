/**
 * MyCodeXvantaOS — Memory Item Model
 * Episodic and semantic memory for persistent agent context.
 *
 * Memory items enable agents to maintain context across sessions
 * and build long-term knowledge about user preferences and patterns.
 * MVP: short-term (session-scoped) only. Long-term is post-MVP.
 */

export type MemoryType = "short-term" | "long-term" | "episodic" | "semantic";

export interface MemoryItemSpec {
  /** The session that created this memory */
  sessionId: string;
  /** The memory content (compressed summary) */
  content: string;
  /** Classification of memory type */
  memoryType: MemoryType;
  /** Importance score (0.0–1.0) for retention decisions */
  importance: number;
  /** Optional tags for categorization */
  tags?: string[];
  /** Time-to-live in seconds (null = no expiry) */
  ttlSeconds?: number | null;
}

export interface MemoryItemStatus {
  phase: MemoryPhase;
  accessCount: number;
  lastAccessedAt: string | null;
  decayScore: number;
}

export type MemoryPhase = "active" | "decaying" | "consolidated" | "forgotten" | "archived";
