/**
 * Tests for AgentToolkit
 */

import { AgentToolkit, ToolDefinition, ToolkitConfig } from '../index';

describe('AgentToolkit', () => {
  let toolkit: AgentToolkit;

  const createMockTool = (
    name: string,
    executeFn?: (params: Record<string, unknown>) => Promise<unknown>
  ): ToolDefinition => ({
    name,
    description: `Mock tool: ${name}`,
    parameters: { param1: { type: 'string' } },
    execute: executeFn || jest.fn().mockResolvedValue({ result: 'success' }),
  });

  beforeEach(() => {
    toolkit = new AgentToolkit();
  });

  describe('constructor', () => {
    it('should create toolkit with default config', () => {
      expect(toolkit).toBeDefined();
    });

    it('should accept partial config', () => {
      const customToolkit = new AgentToolkit({
        maxConcurrentExecutions: 10,
        timeout: 60000,
      });
      expect(customToolkit).toBeDefined();
    });

    it('should accept empty config', () => {
      const emptyToolkit = new AgentToolkit({});
      expect(emptyToolkit).toBeDefined();
    });

    it('should use default values for unspecified config options', () => {
      const partialToolkit = new AgentToolkit({ timeout: 5000 });
      expect(partialToolkit).toBeDefined();
    });
  });

  describe('registerTool', () => {
    it('should register a tool', () => {
      const tool = createMockTool('test-tool');
      toolkit.registerTool(tool);
      expect(toolkit.getTool('test-tool')).toEqual(tool);
    });

    it('should register multiple tools', () => {
      const tool1 = createMockTool('tool-1');
      const tool2 = createMockTool('tool-2');
      toolkit.registerTool(tool1);
      toolkit.registerTool(tool2);
      expect(toolkit.listTools()).toContain('tool-1');
      expect(toolkit.listTools()).toContain('tool-2');
    });

    it('should overwrite tool with same name', () => {
      const tool1 = createMockTool('same-name');
      const tool2 = createMockTool('same-name');
      toolkit.registerTool(tool1);
      toolkit.registerTool(tool2);
      const retrieved = toolkit.getTool('same-name');
      expect(retrieved?.description).toBe('Mock tool: same-name');
    });
  });

  describe('getTool', () => {
    it('should return tool by name', () => {
      const tool = createMockTool('get-test');
      toolkit.registerTool(tool);
      expect(toolkit.getTool('get-test')).toEqual(tool);
    });

    it('should return undefined for non-existent tool', () => {
      expect(toolkit.getTool('non-existent')).toBeUndefined();
    });

    it('should return correct tool after multiple registrations', () => {
      const tool1 = createMockTool('tool-a');
      const tool2 = createMockTool('tool-b');
      toolkit.registerTool(tool1);
      toolkit.registerTool(tool2);
      expect(toolkit.getTool('tool-a')).toEqual(tool1);
      expect(toolkit.getTool('tool-b')).toEqual(tool2);
    });
  });

  describe('listTools', () => {
    it('should return empty array when no tools registered', () => {
      expect(toolkit.listTools()).toEqual([]);
    });

    it('should return array of tool names', () => {
      toolkit.registerTool(createMockTool('list-1'));
      toolkit.registerTool(createMockTool('list-2'));
      toolkit.registerTool(createMockTool('list-3'));
      const tools = toolkit.listTools();
      expect(tools).toHaveLength(3);
      expect(tools).toContain('list-1');
      expect(tools).toContain('list-2');
      expect(tools).toContain('list-3');
    });

    it('should return unique tool names', () => {
      toolkit.registerTool(createMockTool('unique'));
      toolkit.registerTool(createMockTool('unique')); // Same name
      expect(toolkit.listTools()).toHaveLength(1);
    });
  });

  describe('executeTool', () => {
    it('should execute tool and return result', async () => {
      const mockExecute = jest.fn().mockResolvedValue({ data: 'test-result' });
      const tool = createMockTool('exec-tool', mockExecute);
      toolkit.registerTool(tool);

      const result = await toolkit.executeTool('exec-tool', { param1: 'value' });
      expect(result).toEqual({ data: 'test-result' });
      expect(mockExecute).toHaveBeenCalledWith({ param1: 'value' });
    });

    it('should throw error for non-existent tool', async () => {
      await expect(toolkit.executeTool('missing-tool', {})).rejects.toThrow(
        'Tool not found: missing-tool'
      );
    });

    it('should pass params to tool execute function', async () => {
      const mockExecute = jest.fn().mockResolvedValue({ success: true });
      const tool = createMockTool('param-tool', mockExecute);
      toolkit.registerTool(tool);

      await toolkit.executeTool('param-tool', { key: 'value', nested: { a: 1 } });
      expect(mockExecute).toHaveBeenCalledWith({ key: 'value', nested: { a: 1 } });
    });

    it('should propagate errors from tool execution', async () => {
      const mockExecute = jest.fn().mockRejectedValue(new Error('Tool execution failed'));
      const tool = createMockTool('error-tool', mockExecute);
      toolkit.registerTool(tool);

      await expect(toolkit.executeTool('error-tool', {})).rejects.toThrow('Tool execution failed');
    });

    it('should handle async tools', async () => {
      const asyncTool: ToolDefinition = {
        name: 'async-tool',
        description: 'Async test tool',
        parameters: {},
        execute: async (params) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { async: true, params };
        },
      };
      toolkit.registerTool(asyncTool);

      const result = await toolkit.executeTool('async-tool', { test: 'async' });
      expect(result).toEqual({ async: true, params: { test: 'async' } });
    });

    it('should handle tools returning primitives', async () => {
      const stringTool: ToolDefinition = {
        name: 'string-tool',
        description: 'Returns string',
        parameters: {},
        execute: async () => 'string result',
      };
      toolkit.registerTool(stringTool);

      const result = await toolkit.executeTool('string-tool', {});
      expect(result).toBe('string result');
    });

    it('should handle tools returning null', async () => {
      const nullTool: ToolDefinition = {
        name: 'null-tool',
        description: 'Returns null',
        parameters: {},
        execute: async () => null,
      };
      toolkit.registerTool(nullTool);

      const result = await toolkit.executeTool('null-tool', {});
      expect(result).toBeNull();
    });

    it('should handle tools returning undefined', async () => {
      const undefinedTool: ToolDefinition = {
        name: 'undefined-tool',
        description: 'Returns undefined',
        parameters: {},
        execute: async () => undefined,
      };
      toolkit.registerTool(undefinedTool);

      const result = await toolkit.executeTool('undefined-tool', {});
      expect(result).toBeUndefined();
    });

    it('should handle empty params', async () => {
      const mockExecute = jest.fn().mockResolvedValue({});
      const tool = createMockTool('empty-params', mockExecute);
      toolkit.registerTool(tool);

      await toolkit.executeTool('empty-params', {});
      expect(mockExecute).toHaveBeenCalledWith({});
    });
  });

  describe('tool management workflows', () => {
    it('should support full tool lifecycle', async () => {
      // Register
      const tool = createMockTool('lifecycle-tool');
      toolkit.registerTool(tool);
      expect(toolkit.listTools()).toContain('lifecycle-tool');

      // Get
      expect(toolkit.getTool('lifecycle-tool')).toBeDefined();

      // Execute
      const result = await toolkit.executeTool('lifecycle-tool', { test: true });
      expect(result).toEqual({ result: 'success' });
    });

    it('should handle concurrent tool executions', async () => {
      const delayTool: ToolDefinition = {
        name: 'delay-tool',
        description: 'Tool with delay',
        parameters: {},
        execute: async (params) => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return { done: true, input: params };
        },
      };
      toolkit.registerTool(delayTool);

      const results = await Promise.all([
        toolkit.executeTool('delay-tool', { id: 1 }),
        toolkit.executeTool('delay-tool', { id: 2 }),
        toolkit.executeTool('delay-tool', { id: 3 }),
      ]);

      expect(results).toEqual([
        { done: true, input: { id: 1 } },
        { done: true, input: { id: 2 } },
        { done: true, input: { id: 3 } },
      ]);
    });

    it('should support tool replacement', async () => {
      const v1: ToolDefinition = {
        name: 'replaceable',
        description: 'Version 1',
        parameters: {},
        execute: async () => 'v1',
      };
      toolkit.registerTool(v1);

      expect(await toolkit.executeTool('replaceable', {})).toBe('v1');

      const v2: ToolDefinition = {
        name: 'replaceable',
        description: 'Version 2',
        parameters: {},
        execute: async () => 'v2',
      };
      toolkit.registerTool(v2);

      expect(await toolkit.executeTool('replaceable', {})).toBe('v2');
    });
  });

  describe('edge cases', () => {
    it('should handle tool with empty name', () => {
      const emptyNameTool: ToolDefinition = {
        name: '',
        description: 'Empty name tool',
        parameters: {},
        execute: async () => null,
      };
      toolkit.registerTool(emptyNameTool);
      expect(toolkit.getTool('')).toBeDefined();
    });

    it('should handle tool with special characters in name', () => {
      const specialTool: ToolDefinition = {
        name: 'tool-with-special-chars!@#$%',
        description: 'Special chars',
        parameters: {},
        execute: async () => 'special',
      };
      toolkit.registerTool(specialTool);
      expect(toolkit.getTool('tool-with-special-chars!@#$%')).toBeDefined();
    });

    it('should handle tool with unicode name', () => {
      const unicodeTool: ToolDefinition = {
        name: '工具-🛠️',
        description: 'Unicode tool',
        parameters: {},
        execute: async () => 'unicode',
      };
      toolkit.registerTool(unicodeTool);
      expect(toolkit.getTool('工具-🛠️')).toBeDefined();
    });

    it('should handle large parameter objects', async () => {
      const largeParams: Record<string, unknown> = {};
      for (let i = 0; i < 1000; i++) {
        largeParams[`key${i}`] = `value${i}`;
      }

      const mockExecute = jest.fn().mockResolvedValue({ received: true });
      const tool = createMockTool('large-params', mockExecute);
      toolkit.registerTool(tool);

      await toolkit.executeTool('large-params', largeParams);
      expect(mockExecute).toHaveBeenCalledWith(largeParams);
    });

    it('should handle tool with complex nested parameters', async () => {
      const nestedParams = {
        level1: {
          level2: {
            level3: {
              array: [1, 2, 3],
              object: { a: 'b' },
            },
          },
        },
      };

      const mockExecute = jest.fn().mockResolvedValue(nestedParams);
      const tool = createMockTool('nested', mockExecute);
      toolkit.registerTool(tool);

      const result = await toolkit.executeTool('nested', nestedParams);
      expect(result).toEqual(nestedParams);
    });
  });
});
