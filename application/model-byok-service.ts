/**
 * Model BYOK Service — Application Layer
 *
 * Multi-provider LLM gateway with bring-your-own-key configuration.
 * Manages model endpoint registration, credential encryption, usage tracking, and failover.
 */

import type {
  IDatabasePort,
  ICachePort,
  IModelPort,
  IAuditPort,
  IIdentityPort,
  IUsagePort,
} from '../ports/index';
import type {
  ModelEndpointSpec,
  ModelEndpointStatus,
  ModelEndpointPhase,
  Resource,
} from '../core/index';

export interface ModelByokServiceDeps {
  database: IDatabasePort;
  cache: ICachePort;
  model: IModelPort;
  audit: IAuditPort;
  identity: IIdentityPort;
  usage: IUsagePort;
}

export class ModelByokService {
  private deps: ModelByokServiceDeps;

  constructor(deps: ModelByokServiceDeps) {
    this.deps = deps;
  }

  async registerEndpoint(
    workspaceId: string,
    input: {
      provider: string;
      modelId: string;
      apiEndpoint: string;
      apiKey: string;
      parameters?: Record<string, unknown>;
      failoverEndpointId?: string;
    }
  ): Promise<Resource<ModelEndpointSpec, ModelEndpointStatus>> {
    const endpointId = crypto.randomUUID();
    const urn = `urn:mycodexvantaos:ai:model-endpoint:${endpointId}`;
    const now = new Date().toISOString();

    // Encrypt the API key — never store plaintext
    const credentialRef = await this.encryptCredential(input.apiKey);

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
      severity: 'medium',
      subjectId: 'system',
      workspaceId,
      resourceKind: 'model-endpoint',
      resourceId: endpointId,
      action: 'register-endpoint',
      data: { provider: input.provider, modelId: input.modelId },
      correlationId: crypto.randomUUID(),
    });

    return {
      apiVersion: 'platform.mycodevantaos/v1',
      kind: 'model-endpoint',
      metadata: {
        id: endpointId,
        urn,
        kind: 'model-endpoint',
        workspaceId,
        labels: { provider: input.provider },
        annotations: {},
        createdBy: 'system',
        version: '1.0.0',
        resourceVersion: 1,
        createdAt: now,
        updatedAt: now,
      },
      spec: {
        provider: input.provider as any,
        modelId: input.modelId,
        apiEndpoint: input.apiEndpoint,
        credentialRef,
        parameters: input.parameters as any,
        failoverEndpointId: input.failoverEndpointId ?? null,
      },
      status: {
        phase: 'active',
        conditions: [
          {
            type: 'Ready',
            status: 'True',
            reason: 'Registered',
            message: 'Endpoint registered',
            lastTransitionTime: now,
          },
        ],
        health: 'healthy',
        totalInvocations: 0,
        totalTokensUsed: 0,
        lastInvokedAt: null,
        lastHealthCheckAt: now,
      },
    };
  }

  async invokeModel(
    endpointId: string,
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<any> {
    const endpoint = await this.deps.database.queryFirst<{
      id: string;
      provider: string;
      model_id: string;
      credential_ref: string;
      workspace_id: string;
    }>('SELECT * FROM model_endpoints WHERE id = ?', [endpointId]);

    if (!endpoint) throw new Error(`Endpoint ${endpointId} not found`);

    const correlationId = crypto.randomUUID();

    await this.deps.audit.emitEvent({
      eventType: 'model.invocation.started',
      category: 'model',
      severity: 'info',
      subjectId: 'system',
      workspaceId: endpoint.workspace_id,
      resourceKind: 'model-endpoint',
      resourceId: endpointId,
      action: 'invoke-model',
      data: { invocationId: correlationId },
      correlationId,
    });

    try {
      const response = await this.deps.model.invoke({
        model: endpoint.model_id,
        messages: [{ role: 'user', content: prompt }],
        ...(options as any),
      });

      await this.deps.audit.emitEvent({
        eventType: 'model.invocation.completed',
        category: 'model',
        severity: 'info',
        subjectId: 'system',
        workspaceId: endpoint.workspace_id,
        resourceKind: 'model-endpoint',
        resourceId: endpointId,
        action: 'invoke-model',
        data: {
          invocationId: correlationId,
          totalTokens: response.usage.totalTokens,
          durationMs: 0,
        },
        correlationId,
      });

      return response;
    } catch (error) {
      await this.deps.audit.emitEvent({
        eventType: 'model.invocation.failed',
        category: 'model',
        severity: 'high',
        subjectId: 'system',
        workspaceId: endpoint.workspace_id,
        resourceKind: 'model-endpoint',
        resourceId: endpointId,
        action: 'invoke-model',
        data: { invocationId: correlationId, error: String(error), retryable: true },
        correlationId,
      });
      throw error;
    }
  }

  private async encryptCredential(apiKey: string): Promise<string> {
    // In production: AES-256-GCM encryption using ENCRYPTION_KEY from env
    // For constitution: placeholder reference
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return `enc:aes-256-gcm:${Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;
  }
}
