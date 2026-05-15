/**
 * @mycodexvantaos/agent-toolkit
 * Agent toolkit utilities for MyCodeXvantaOS
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

export interface ToolkitConfig {
  tools: ToolDefinition[];
  maxConcurrentExecutions: number;
  timeout: number;
}

export class AgentToolkit {
  private tools: Map<string, ToolDefinition> = new Map();
  private config: ToolkitConfig;

  constructor(config: Partial<ToolkitConfig> = {}) {
    this.config = {
      tools: [],
      maxConcurrentExecutions: 5,
      timeout: 30000,
      ...config,
    };
  }

  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  listTools(): string[] {
    return Array.from(this.tools.keys());
  }

  async executeTool(name: string, params: Record<string, unknown>): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return tool.execute(params);
  }
}

export default AgentToolkit;
