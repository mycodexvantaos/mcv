/**
 * MyCodexVantaOS Agent Runtime Service
 *
 * Service ID: mycodexvantaos-agent-runtime
 * Foundation: Agent Foundation
 * Capability: Agent runtime, memory, tool calling, MCP, RAG, workflow DAG
 *
 * Machine Identity: mycodexvantaos
 * Canonical URL: https://mycodexvantaos.com
 */

export const SERVICE_ID = "mycodexvantaos-agent-runtime";
export const SERVICE_VERSION = "1.0.0";

export type AgentStatus = "idle" | "running" | "paused" | "completed" | "failed";
export type TaskPriority = "low" | "normal" | "high" | "critical";

export interface AgentTask {
  taskId: string;
  agentId: string;
  type: string;
  priority: TaskPriority;
  input: Record<string, unknown>;
  metadata: Record<string, string>;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: AgentStatus;
  result?: unknown;
  error?: string;
}

export interface AgentMemory {
  agentId: string;
  shortTerm: Array<{ role: "user" | "assistant" | "system"; content: string; timestamp: Date }>;
  longTerm: Array<{ key: string; value: unknown; createdAt: Date; expiresAt?: Date }>;
}

export interface ToolCall {
  toolId: string;
  toolName: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  error?: string;
  executedAt: Date;
  durationMs: number;
}

export interface AgentRuntime {
  agentId: string;
  status: AgentStatus;
  currentTask?: AgentTask;
  memory: AgentMemory;
  toolCalls: ToolCall[];
  startedAt: Date;
  lastActivityAt: Date;
}

/**
 * Agent Runtime Manager
 * Manages the lifecycle of AI agents within the MyCodexVantaOS platform.
 */
export class AgentRuntimeManager {
  private agents: Map<string, AgentRuntime> = new Map();
  private taskQueue: AgentTask[] = [];

  /**
   * Create and register a new agent runtime.
   */
  createAgent(agentId: string): AgentRuntime {
    if (this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} already exists`);
    }

    const runtime: AgentRuntime = {
      agentId,
      status: "idle",
      memory: {
        agentId,
        shortTerm: [],
        longTerm: [],
      },
      toolCalls: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
    };

    this.agents.set(agentId, runtime);
    return runtime;
  }

  /**
   * Submit a task to the agent runtime queue.
   */
  submitTask(task: Omit<AgentTask, "createdAt" | "status">): AgentTask {
    const fullTask: AgentTask = {
      ...task,
      createdAt: new Date(),
      status: "idle",
    };

    this.taskQueue.push(fullTask);
    return fullTask;
  }

  /**
   * Execute a task on the specified agent.
   */
  async executeTask(agentId: string, task: AgentTask): Promise<AgentTask> {
    const runtime = this.agents.get(agentId);
    if (!runtime) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (runtime.status === "running") {
      throw new Error(`Agent ${agentId} is already running a task`);
    }

    runtime.status = "running";
    runtime.currentTask = { ...task, status: "running", startedAt: new Date() };
    runtime.lastActivityAt = new Date();

    try {
      // Simulate task execution
      const result = await this.processTask(runtime, task);

      runtime.currentTask.status = "completed";
      runtime.currentTask.completedAt = new Date();
      runtime.currentTask.result = result;
      runtime.status = "idle";

      return runtime.currentTask;
    } catch (error) {
      runtime.currentTask.status = "failed";
      runtime.currentTask.completedAt = new Date();
      runtime.currentTask.error = error instanceof Error ? error.message : String(error);
      runtime.status = "idle";

      return runtime.currentTask;
    }
  }

  /**
   * Process a task (to be overridden by specific agent implementations).
   */
  private async processTask(runtime: AgentRuntime, task: AgentTask): Promise<unknown> {
    // Base implementation — specific agents override this
    return {
      taskId: task.taskId,
      agentId: runtime.agentId,
      processed: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Add a message to the agent's short-term memory.
   */
  addToMemory(
    agentId: string,
    role: "user" | "assistant" | "system",
    content: string
  ): void {
    const runtime = this.agents.get(agentId);
    if (!runtime) throw new Error(`Agent ${agentId} not found`);

    runtime.memory.shortTerm.push({ role, content, timestamp: new Date() });
    runtime.lastActivityAt = new Date();

    // Trim short-term memory to last 100 messages
    if (runtime.memory.shortTerm.length > 100) {
      runtime.memory.shortTerm = runtime.memory.shortTerm.slice(-100);
    }
  }

  /**
   * Record a tool call execution.
   */
  recordToolCall(agentId: string, toolCall: ToolCall): void {
    const runtime = this.agents.get(agentId);
    if (!runtime) throw new Error(`Agent ${agentId} not found`);

    runtime.toolCalls.push(toolCall);
    runtime.lastActivityAt = new Date();
  }

  /**
   * Get agent runtime status.
   */
  getAgent(agentId: string): AgentRuntime | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all active agents.
   */
  getActiveAgents(): AgentRuntime[] {
    return Array.from(this.agents.values()).filter((a) => a.status === "running");
  }

  /**
   * Terminate an agent runtime.
   */
  terminateAgent(agentId: string): void {
    const runtime = this.agents.get(agentId);
    if (!runtime) throw new Error(`Agent ${agentId} not found`);

    if (runtime.status === "running") {
      throw new Error(`Cannot terminate running agent ${agentId}. Pause it first.`);
    }

    this.agents.delete(agentId);
  }
}

// Default singleton runtime manager
export const agentRuntimeManager = new AgentRuntimeManager();
