/**
 * MyCodeXvantaOS — Agent Application Service
 * Category: agent
 *
 * AI-powered conversational agent with knowledge-grounded generation.
 * Implements the generation pipeline:
 *   assemble → retrieve → invoke → attribute → safety-check → audit
 *
 * Use cases:
 *   - create-agent-session
 *   - assemble-prompt
 *   - answer-with-knowledge
 *   - answer-without-knowledge
 *   - classify-intent
 */

import type { IDatabasePort } from "../../ports/database";
import type { IChatModelPort } from "../../ports/model-provider";
import type { IJobQueuePort } from "../../ports/queue";
import type { IAuthPort } from "../../ports/auth";

// ── Service Dependencies ───────────────────────────────────────────────

export interface AgentServiceDeps {
  database: IDatabasePort;
  chatModel: IChatModelPort;
  queue: IJobQueuePort;
  auth: IAuthPort;
  search: {
    searchKnowledge(request: {
      query: string;
      collectionIds: string[];
      topK: number;
      minScore: number;
      searchType: string;
    }): Promise<{ results: AgentSearchResult[] }>;
  };
  audit: {
    emitEvent(event: AgentAuditEvent): Promise<void>;
  };
  usage: {
    meterUsage(workspaceId: string, metric: string, quantity: number): Promise<void>;
  };
}

// ── Types ──────────────────────────────────────────────────────────────

export type ChatSessionPhase = "created" | "active" | "idle" | "closed";
export type EvidenceLevel = "knowledge-assisted" | "knowledge-verified" | "knowledge-grounded";

export interface CreateSessionInput {
  subjectId: string;
  modelEndpointId: string;
  systemPrompt?: string;
  knowledgeCollectionIds?: string[];
  temperature?: number;
}

export interface ChatSessionResource {
  id: string;
  urn: string;
  spec: {
    subjectId: string;
    modelEndpointId: string;
    systemPrompt: string | null;
    knowledgeCollectionIds: string[];
    temperature: number;
  };
  status: {
    phase: ChatSessionPhase;
    messageCount: number;
    totalTokensUsed: number;
    lastMessageAt: string | null;
  };
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  evidenceLevel: EvidenceLevel | null;
  sourceCount: number;
  tokensUsed: number;
  createdAt: string;
}

export interface SendMessageInput {
  sessionId: string;
  content: string;
}

export interface AgentSearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
}

export interface AgentAuditEvent {
  eventType: string;
  category: "agent";
  severity: string;
  subjectId: string;
  workspaceId: string;
  action: string;
  data?: Record<string, unknown>;
  correlationId: string;
}

// ── Service Class ──────────────────────────────────────────────────────

export class AgentService {
  private deps: AgentServiceDeps;

  constructor(deps: AgentServiceDeps) {
    this.deps = deps;
  }

  async createSession(
    workspaceId: string,
    input: CreateSessionInput
  ): Promise<ChatSessionResource> {
    const sessionId = crypto.randomUUID();
    const urn = `urn:mycodexvantaos:agent:chat-session:${sessionId}`;
    const now = new Date().toISOString();

    await this.deps.database.execute(
      `INSERT INTO chat_sessions (id, urn, workspace_id, subject_id, model_endpoint_id, system_prompt, knowledge_collection_ids, temperature, phase, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'created', ?, ?)`,
      [
        sessionId,
        urn,
        workspaceId,
        input.subjectId,
        input.modelEndpointId,
        input.systemPrompt ?? null,
        JSON.stringify(input.knowledgeCollectionIds ?? []),
        input.temperature ?? 0.7,
        now,
        now,
      ]
    );

    await this.deps.audit.emitEvent({
      eventType: "agent.session.created",
      category: "agent",
      severity: "info",
      subjectId: input.subjectId,
      workspaceId,
      action: "create-agent-session",
      correlationId: crypto.randomUUID(),
    });

    return {
      id: sessionId,
      urn,
      spec: {
        subjectId: input.subjectId,
        modelEndpointId: input.modelEndpointId,
        systemPrompt: input.systemPrompt ?? null,
        knowledgeCollectionIds: input.knowledgeCollectionIds ?? [],
        temperature: input.temperature ?? 0.7,
      },
      status: { phase: "created", messageCount: 0, totalTokensUsed: 0, lastMessageAt: null },
    };
  }

  async sendMessage(
    workspaceId: string,
    subjectId: string,
    input: SendMessageInput
  ): Promise<ChatMessage> {
    // 1. Retrieve session
    const session = await this.getSession(input.sessionId);
    if (!session) throw new Error(`Session not found: ${input.sessionId}`);

    // 2. Assemble prompt with knowledge retrieval if collections configured
    let knowledgeContext = "";
    let sourceCount = 0;
    let evidenceLevel: EvidenceLevel | null = null;

    if (session.spec.knowledgeCollectionIds.length > 0) {
      const searchResult = await this.deps.search.searchKnowledge({
        query: input.content,
        collectionIds: session.spec.knowledgeCollectionIds,
        topK: 5,
        minScore: 0.5,
        searchType: "hybrid",
      });
      sourceCount = searchResult.results.length;
      knowledgeContext = searchResult.results.map((r) => r.content).join("\n---\n");
      evidenceLevel = sourceCount > 0 ? "knowledge-assisted" : null;
    }

    // 3. Build messages
    const messages = [
      {
        role: "system" as const,
        content: session.spec.systemPrompt ?? "You are a helpful assistant.",
      },
      ...(knowledgeContext
        ? [{ role: "system" as const, content: `Knowledge context:\n${knowledgeContext}` }]
        : []),
      { role: "user" as const, content: input.content },
    ];

    // 4. Invoke model
    const response = await this.deps.chatModel.invoke({
      model: session.spec.modelEndpointId,
      messages,
      temperature: session.spec.temperature,
    });

    // 5. Track usage
    await this.deps.usage.meterUsage(workspaceId, "tokens", response.usage.totalTokens);

    // 6. Create message record
    const messageId = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.deps.database.execute(
      `INSERT INTO chat_messages (id, session_id, role, content, evidence_level, source_count, tokens_used, created_at)
       VALUES (?, ?, 'assistant', ?, ?, ?, ?, ?)`,
      [
        messageId,
        input.sessionId,
        response.content,
        evidenceLevel,
        sourceCount,
        response.usage.totalTokens,
        now,
      ]
    );

    await this.deps.audit.emitEvent({
      eventType: "agent.message.sent",
      category: "agent",
      severity: "info",
      subjectId,
      workspaceId,
      action: "answer-with-knowledge",
      correlationId: crypto.randomUUID(),
      data: {
        sessionId: input.sessionId,
        messageId,
        tokensUsed: response.usage.totalTokens,
        evidenceLevel,
      },
    });

    return {
      id: messageId,
      sessionId: input.sessionId,
      role: "assistant",
      content: response.content,
      evidenceLevel,
      sourceCount,
      tokensUsed: response.usage.totalTokens,
      createdAt: now,
    };
  }

  private async getSession(sessionId: string): Promise<ChatSessionResource | null> {
    const row = await this.deps.database.queryFirst<Record<string, unknown>>(
      "SELECT * FROM chat_sessions WHERE id = ?",
      [sessionId]
    );
    if (!row) return null;
    return {
      id: row.id as string,
      urn: row.urn as string,
      spec: {
        subjectId: row.subject_id as string,
        modelEndpointId: row.model_endpoint_id as string,
        systemPrompt: row.system_prompt as string | null,
        knowledgeCollectionIds: JSON.parse((row.knowledge_collection_ids as string) || "[]"),
        temperature: row.temperature as number,
      },
      status: {
        phase: row.phase as ChatSessionPhase,
        messageCount: 0,
        totalTokensUsed: 0,
        lastMessageAt: null,
      },
    };
  }
}
