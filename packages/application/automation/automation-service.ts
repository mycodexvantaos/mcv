/**
 * MyCodeXvantaOS — Automation Application Service
 * Category: automation
 *
 * Async job processing: enqueue, lease, complete, fail.
 * Implements the job lifecycle for all async platform operations.
 *
 * Use cases:
 *   - enqueue-job
 *   - lease-job
 *   - complete-job
 *   - fail-job
 */

import type { IDatabasePort } from "../../ports/database";
import type { IJobQueuePort, JobType, JobPayload } from "../../ports/queue";

// ── Service Dependencies ───────────────────────────────────────────────

export interface AutomationServiceDeps {
  database: IDatabasePort;
  queue: IJobQueuePort;
  audit: {
    emitEvent(event: AutomationAuditEvent): Promise<void>;
  };
}

// ── Types ──────────────────────────────────────────────────────────────

export type JobPhase = "pending" | "leased" | "completed" | "failed" | "dead-letter";

export interface EnqueueJobInput {
  jobType: JobType;
  workspaceId: string;
  data: Record<string, unknown>;
  priority?: number;
  maxRetries?: number;
}

export interface JobResource {
  id: string;
  spec: {
    jobType: JobType;
    workspaceId: string;
    data: Record<string, unknown>;
    priority: number;
    maxRetries: number;
  };
  status: {
    phase: JobPhase;
    leasedBy: string | null;
    leasedAt: string | null;
    completedAt: string | null;
    retryCount: number;
    error: string | null;
  };
}

export interface AutomationAuditEvent {
  eventType: string;
  category: "automation";
  severity: string;
  subjectId: string;
  workspaceId: string;
  action: string;
  data?: Record<string, unknown>;
  correlationId: string;
}

// ── Service Class ──────────────────────────────────────────────────────

export class AutomationService {
  private deps: AutomationServiceDeps;

  constructor(deps: AutomationServiceDeps) {
    this.deps = deps;
  }

  async enqueueJob(subjectId: string, input: EnqueueJobInput): Promise<JobResource> {
    const jobId = await this.deps.queue.enqueue({
      jobId: crypto.randomUUID(),
      jobType: input.jobType,
      workspaceId: input.workspaceId,
      data: input.data,
      priority: input.priority ?? 0,
      maxRetries: input.maxRetries ?? 3,
    });

    await this.deps.audit.emitEvent({
      eventType: "automation.job.enqueued",
      category: "automation",
      severity: "info",
      subjectId,
      workspaceId: input.workspaceId,
      action: "enqueue-job",
      correlationId: crypto.randomUUID(),
      data: { jobId, jobType: input.jobType },
    });

    return {
      id: jobId,
      spec: {
        jobType: input.jobType,
        workspaceId: input.workspaceId,
        data: input.data,
        priority: input.priority ?? 0,
        maxRetries: input.maxRetries ?? 3,
      },
      status: {
        phase: "pending",
        leasedBy: null,
        leasedAt: null,
        completedAt: null,
        retryCount: 0,
        error: null,
      },
    };
  }

  async leaseJob(workerId: string, jobType: JobType): Promise<JobResource | null> {
    const job = await this.deps.queue.lease(jobType, workerId, 300000); // 5 min lease

    if (!job) return null;

    return {
      id: job.jobId,
      spec: {
        jobType: job.jobType,
        workspaceId: job.workspaceId,
        data: job.data,
        priority: job.priority ?? 0,
        maxRetries: job.maxRetries ?? 3,
      },
      status: {
        phase: "leased",
        leasedBy: workerId,
        leasedAt: new Date().toISOString(),
        completedAt: null,
        retryCount: 0,
        error: null,
      },
    };
  }

  async completeJob(jobId: string, result?: Record<string, unknown>): Promise<void> {
    await this.deps.queue.complete(jobId, result);
  }

  async failJob(jobId: string, error: string, retry = true): Promise<void> {
    await this.deps.queue.fail(jobId, error, retry);
  }
}
