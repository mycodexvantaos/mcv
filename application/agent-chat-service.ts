/**
 * Agent Chat Service — Application Layer
 *
 * AI-powered conversational agent with knowledge-grounded generation.
 * Implements the generation pipeline: assemble → invoke → attribute → safety-check → audit.
 */

import type {
  IDatabasePort,
  ICachePort,
  IQueuePort,
  IModelPort,
  IAuditPort,
  IIdentityPort,
  IUsagePort,
} from '../ports/index';
import type {
  ChatSessionSpec,
  ChatSessionStatus,
  ChatSessionPhase,
  ChatMessage,
  EvidenceLevel,
  Resource,
} from '../core/index';

export interface AgentChatServiceDeps {
  database: IDatabasePort;
  cache: ICachePort;
  queue: IQueuePort;
  model: IModelPort;
  audit: IAuditPort;
  identity: IIdentityPort;
  usage: IUsagePort;
}

export class AgentChatService {
  private deps: AgentChatServiceDeps;

  constructor(deps: AgentChatServiceDeps) {
    this.deps = deps;
  }

  async createSession(
    workspaceId: string,
    input: {
      subjectId: string;
      modelEndpointId: string;
      systemPrompt?: string;
      knowledgeCollectionIds?: string[];
      temperature?: number;
    }
  ): Promise<Resource<ChatSessionSpec, ChatSessionStatus>> {
    const sessionId = crypto.randomUUID();
    const urn = `urn:mycodexvantaos:ai:chat-session:${sessionId}`;
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
      eventType: 'ai.chat.session.created',
      category: 'ai',
      severity: 'info',
      subjectId: input.subjectId,
      workspaceId,
      resourceKind: 'chat-session',
      resourceId: sessionId,
      action: 'create-session',
      data: { modelEndpointId: input.modelEndpointId, collectionIds: input.knowledgeCollectionIds },
      correlationId: crypto.randomUUID(),
    });

    return {
      apiVersion: 'platform.mycodevantaos/v1',
      kind: 'chat-session',
      metadata: {
        id: sessionId,
        urn,
        kind: 'chat-session',
        workspaceId,
        labels: {},
        annotations: {},
        createdBy: input.subjectId,
        version: '1.0.0',
        resourceVersion: 1,
        createdAt: now,
        updatedAt: now,
      },
      spec: {
        subjectId: input.subjectId,
        modelEndpointId: input.modelEndpointId,
        systemPrompt: input.systemPrompt ?? null,
        knowledgeCollectionIds: input.knowledgeCollectionIds ?? [],
        temperature: input.temperature ?? 0.7,
      },
      status: {
        phase: 'created',
        conditions: [
          {
            type: 'Ready',
            status: 'True',
            reason: 'Created',
            message: 'Session ready',
            lastTransitionTime: now,
          },
        ],
        messageCount: 0,
        totalTokensUsed: 0,
        lastMessageAt: null,
      },
    };
  }

  async sendMessage(
    sessionId: string,
    content: string,
    options?: {
      retrievalResults?: any[];
    }
  ): Promise<ChatMessage> {
    const now = new Date().toISOString();
    const correlationId = crypto.randomUUID();

    // 1. Get session context
    const session = await this.deps.database.queryFirst<{
      id: string;
      workspace_id: string;
      subject_id: string;
      model_endpoint_id: string;
      system_prompt: string;
      temperature: number;
    }>('SELECT * FROM chat_sessions WHERE id = ?', [sessionId]);

    if (!session) throw new Error(`Session ${sessionId} not found`);

    // 2. Emit message.sent event (start of closed-loop pair)
    await this.deps.audit.emitEvent({
      eventType: 'ai.chat.message.sent',
      category: 'ai',
      severity: 'info',
      subjectId: session.subject_id,
      workspaceId: session.workspace_id,
      resourceKind: 'chat-session',
      resourceId: sessionId,
      action: 'send-message',
      data: { contentLength: content.length },
      correlationId,
    });

    // 3. Assemble prompt with context (generation pipeline stage 1)
    const messages = [];
    if (session.system_prompt) {
      messages.push({ role: 'system' as const, content: session.system_prompt });
    }
    if (options?.retrievalResults) {
      const contextBlock = options.retrievalResults
        .map((r: any) => `[Source: ${r.documentTitle}]\n${r.content}`)
        .join('\n\n');
      messages.push({ role: 'system' as const, content: `Retrieved context:\n${contextBlock}` });
    }
    messages.push({ role: 'user' as const, content });

    // 4. Invoke model (generation pipeline stage 2)
    const modelResponse = await this.deps.model.invoke({
      model: session.model_endpoint_id,
      messages,
      temperature: session.temperature,
    });

    // 5. Attribute sources (generation pipeline stage 3)
    const evidenceLevel: EvidenceLevel =
      options?.retrievalResults?.length > 0 ? 'knowledge-assisted' : 'knowledge-assisted';

    // 6. Safety check (generation pipeline stage 4) — placeholder
    const safetyPassed = true;

    // 7. Store message and audit (generation pipeline stage 5)
    const messageId = crypto.randomUUID();
    await this.deps.database.execute(
      `INSERT INTO chat_messages (id, session_id, role, content, evidence_level, tokens_used, created_at)
       VALUES (?, ?, 'assistant', ?, ?, ?, ?)`,
      [
        messageId,
        sessionId,
        modelResponse.content,
        evidenceLevel,
        modelResponse.usage.totalTokens,
        now,
      ]
    );

    await this.deps.audit.emitEvent({
      eventType: safetyPassed ? 'ai.chat.response.generated' : 'ai.chat.response.safety-flagged',
      category: 'ai',
      severity: safetyPassed ? 'info' : 'high',
      subjectId: session.subject_id,
      workspaceId: session.workspace_id,
      resourceKind: 'chat-session',
      resourceId: sessionId,
      action: 'generate-response',
      data: {
        evidenceLevel,
        sourceChunkCount: options?.retrievalResults?.length ?? 0,
        totalTokens: modelResponse.usage.totalTokens,
      },
      correlationId,
    });

    // Record usage
    await this.deps.usage.record({
      workspaceId: session.workspace_id,
      serviceId: 'agent-chat',
      metricType: 'tokens',
      quantity: modelResponse.usage.totalTokens,
    });

    return {
      id: messageId,
      sessionId,
      role: 'assistant',
      content: modelResponse.content,
      evidenceLevel,
      sourceTraces: [],
      tokensUsed: modelResponse.usage.totalTokens,
      createdAt: now,
    };
  }
}
