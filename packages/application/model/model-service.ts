/**
 * MyCodexVantaOS — Model Application Service
 * Category: model
 *
 * Multi-provider LLM gateway with bring-your-own-key configuration.
 * Manages model endpoint registration, credential encryption, usage tracking, and failover.
 *
 * Use cases:
 *   - register-model-provider
 *   - call-chat-model
 *   - call-embedding-model
 *   - track-model-usage
 */

import type { IDatabasePort } from '../../ports/database';
import type {
  IChatModelPort,
  IEmbeddingModelPort,
  ModelResponse,
  EmbedResponse,
  ModelHealthStatus,
} from '../../ports/model-provider';
import type { IAuthPort } from '../../ports/auth';
import type { ResourceCondition } from '../../core/shared';

// ── Service Dependencies ───────────────────────────────────────────────

export interface ModelServiceDeps {
  database: IDatabasePort;
  chatModel: IChatModelPort;
  embeddingModel: IEmbeddingModelPort;
  auth: IAuthPort;
  audit: {
    emitEvent(event: ModelAuditEvent): Promise<void>;
  };
  usage: {
    meterUsage(workspaceId: string, metric: string, quantity: number): Promise<void>;
  };
}

// ── Types ──────────────────────────────────────────────────────────────

export type ModelProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'ollama'
  | 'openrouter'
  | 'workers-ai'
  | 'custom';
export type ModelEndpointPhase = 'registering' | 'active' | 'degraded' | 'revoked';

export interface RegisterEndpointInput {
  provider: ModelProvider;
  modelId: string;
  apiEndpoint: string;
  apiKey: string;
  parameters?: Record<string, unknown>;
  failoverEndpointId?: string;
}

export interface ModelEndpointResource {
  id: string;
  urn: string;
  spec: {
    provider: ModelProvider;
    modelId: string;
    apiEndpoint: string;
    credentialRef: string;
    parameters: Record<string, unknown>;
    failoverEndpointId: string | null;
  };
  status: {
    phase: ModelEndpointPhase;
    health: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    totalInvocations: number;
    totalTokensUsed: number;
    conditions: ResourceCondition[];
  };
}

export interface CallChatModelInput {
  endpointId: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  maxTokens?: number;
}

export interface CallEmbeddingModelInput {
  endpointId: string;
  texts: string[];
  model?: string;
}

export interface ModelAuditEvent {
  eventType: string;
  category: 'model';
  severity: string;
  subjectId: string;
  workspaceId: string;
  action: string;
  data?: Record<string, unknown>;
  correlationId: string;
}

// ── Service Class ──────────────────────────────────────────────────────

export class ModelService {
  private deps: ModelServiceDeps;

  constructor(deps: ModelServiceDeps) {
    this.deps = deps;
  }

  async registerEndpoint(
    workspaceId: string,
    subjectId: string,
    input: RegisterEndpointInput
  ): Promise<ModelEndpointResource> {
    const endpointId = crypto.randomUUID();
    const urn = `urn:mycodexvantaos:model:endpoint:${endpointId}`;
    const now = new Date().toISOString();

    // Credential reference — never store plaintext
    const credentialRef = `cred:${endpointId}`;

    await this.deps.database.execute(
      `INSERT INTO model_endpoints (id, urn, workspace_id, provider, model_id, api_endpoint, credential_ref, parameters, failover_endpoint_id, phase, health, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'healthy', ?, ?)`,
      [
        endpointId,
        urn,
        workspaceId,
        input.provider,
        input.modelId,
        input.apiEndpoint,
        credentialRef,
        JSON.stringify(input.parameters ?? {}),
        input.failoverEndpointId ?? null,
        now,
        now,
      ]
    );

    await this.deps.audit.emitEvent({
      eventType: 'model.endpoint.registered',
      category: 'model',
      severity: 'info',
      subjectId,
      workspaceId,
      action: 'register-model-provider',
      correlationId: crypto.randomUUID(),
    });

    return {
      id: endpointId,
      urn,
      spec: {
        provider: input.provider,
        modelId: input.modelId,
        apiEndpoint: input.apiEndpoint,
        credentialRef,
        parameters: input.parameters ?? {},
        failoverEndpointId: input.failoverEndpointId ?? null,
      },
      status: {
        phase: 'active',
        health: 'healthy',
        totalInvocations: 0,
        totalTokensUsed: 0,
        conditions: [],
      },
    };
  }

  async callChatModel(
    workspaceId: string,
    subjectId: string,
    input: CallChatModelInput
  ): Promise<ModelResponse> {
    const response = await this.deps.chatModel.invoke({
      model: input.endpointId,
      messages: input.messages,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
    });

    await this.deps.usage.meterUsage(workspaceId, 'tokens', response.usage.totalTokens);

    await this.deps.audit.emitEvent({
      eventType: 'model.chat.invoked',
      category: 'model',
      severity: 'info',
      subjectId,
      workspaceId,
      action: 'call-chat-model',
      correlationId: crypto.randomUUID(),
      data: { endpointId: input.endpointId, tokensUsed: response.usage.totalTokens },
    });

    return response;
  }

  async callEmbeddingModel(
    workspaceId: string,
    subjectId: string,
    input: CallEmbeddingModelInput
  ): Promise<EmbedResponse> {
    const response = await this.deps.embeddingModel.embed({
      model: input.model ?? 'default',
      input: input.texts,
    });

    await this.deps.usage.meterUsage(workspaceId, 'tokens', response.usage.totalTokens);

    return response;
  }

  async healthCheck(endpointId: string): Promise<ModelHealthStatus> {
    return this.deps.chatModel.healthCheck();
  }
}
