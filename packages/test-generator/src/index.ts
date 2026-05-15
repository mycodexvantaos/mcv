/**
 * Test Generator Module
 *
 * This module provides capabilities for generating unit tests, integration tests,
 * and E2E tests from code models and API specifications.
 */

export interface TestMethod {
  name: string;
  type: 'unit' | 'integration' | 'e2e';
  assertions: string[];
  setup?: string;
  teardown?: string;
  mocks?: any[];
}

export interface TestSuite {
  name: string;
  subject: string;
  type: 'unit' | 'integration' | 'e2e';
  methods: TestMethod[];
  imports?: string[];
  setup?: string;
  teardown?: string;
}

export interface TestGeneratorOptions {
  framework?: 'jest' | 'mocha' | 'vitest';
  language?: 'typescript' | 'javascript';
  coverage?: boolean;
  mocking?: boolean;
  includeSnapshots?: boolean;
}

export interface ApiEndpoint {
  method: string;
  path: string;
  description?: string;
  parameters?: any[];
  requestBody?: any;
  responses?: any[];
}

export class TestGenerator {
  private options: TestGeneratorOptions;

  constructor(options: TestGeneratorOptions = {}) {
    this.options = {
      framework: 'jest',
      language: 'typescript',
      coverage: true,
      mocking: true,
      includeSnapshots: false,
      ...options,
    };
  }

  /**
   * Generate unit tests for a class
   */
  generateUnitTest(className: string, methods: string[], imports: string[] = []): TestSuite {
    const testMethods: TestMethod[] = [];

    for (const methodName of methods) {
      testMethods.push({
        name: `should execute ${methodName} successfully`,
        type: 'unit',
        assertions: [`expect(result).toBeDefined()`, `expect(result).not.toThrow()`],
        mocks: [
          {
            method: methodName,
            returnValue: '{}',
          },
        ],
      });

      testMethods.push({
        name: `should handle errors in ${methodName}`,
        type: 'unit',
        assertions: [`expect(error).toBeDefined()`, `expect(spy).toHaveBeenCalled()`],
        mocks: [
          {
            method: methodName,
            throwError: 'new Error("Test error")',
          },
        ],
      });
    }

    return {
      name: `${className} unit tests`,
      subject: className,
      type: 'unit',
      methods: testMethods,
      imports: [
        this.options.framework === 'jest'
          ? `import { describe, it, expect, jest } from '@jest/globals';`
          : '',
        ...imports,
      ],
      setup: 'let instance: ' + className + ';',
      teardown: 'jest.clearAllMocks();',
    };
  }

  /**
   * Generate integration tests for API endpoints
   */
  generateIntegrationTests(apiName: string, endpoints: ApiEndpoint[]): TestSuite {
    const testMethods: TestMethod[] = [];

    for (const endpoint of endpoints) {
      const testMethod: TestMethod = {
        name: `should ${this.getTestAction(endpoint.method)} ${endpoint.path}`,
        type: 'integration',
        assertions: [],
        setup: `const response = await request(app).${endpoint.method.toLowerCase()}('${endpoint.path}');`,
        mocks: [],
      };

      // Add assertions based on responses
      if (endpoint.responses) {
        const successResponse = endpoint.responses.find(
          (r) => r.statusCode >= 200 && r.statusCode < 300
        );
        if (successResponse) {
          testMethod.assertions.push(
            'expect(response.status).toBe(' + successResponse.statusCode + ')'
          );
          testMethod.assertions.push('expect(response.body).toBeDefined()');
        }
      }

      testMethods.push(testMethod);
    }

    return {
      name: `${apiName} integration tests`,
      subject: apiName,
      type: 'integration',
      methods: testMethods,
      imports: ["import request from 'supertest';", "import { app } from '../src/app';"],
      setup: '',
      teardown: '',
    };
  }

  /**
   * Generate E2E test scenarios
   */
  generateE2ETest(scenarioName: string, steps: string[]): TestSuite {
    const testMethods: TestMethod[] = [
      {
        name: `should complete ${scenarioName} scenario`,
        type: 'e2e',
        assertions: ['expect(finalState).toBeDefined()', 'expect(finalState).toBe(true)'],
        setup: steps.join('\n  '),
        teardown: 'await cleanupTestData();',
      },
    ];

    return {
      name: `${scenarioName} E2E test`,
      subject: scenarioName,
      type: 'e2e',
      methods: testMethods,
      imports: ["import { test, expect } from '@playwright/test';"],
      setup: '',
      teardown: '',
    };
  }

  /**
   * Generate test file content
   */
  generateTestFile(testSuite: TestSuite): string {
    let content = '';

    // Add imports
    if (testSuite.imports && testSuite.imports.length > 0) {
      content += testSuite.imports.filter((i) => i).join('\n') + '\n\n';
    }

    // Add describe block
    content += `describe('${testSuite.name}', () => {\n`;

    // Add setup
    if (testSuite.setup) {
      content += `  ${testSuite.setup}\n\n`;
    }

    // Add beforeAll/afterAll if needed
    if (testSuite.type === 'integration') {
      content += `  beforeAll(async () => {\n`;
      content += `    // Setup test database\n`;
      content += `  });\n\n`;
      content += `  afterAll(async () => {\n`;
      content += `    // Cleanup test database\n`;
      content += `  });\n\n`;
    }

    // Add test methods
    for (const method of testSuite.methods) {
      content += `  it('${method.name}', async () => {\n`;

      // Add setup code
      if (method.setup) {
        content += `    ${method.setup}\n`;
      }

      // Add assertions
      for (const assertion of method.assertions) {
        content += `    ${assertion}\n`;
      }

      // Add teardown code
      if (method.teardown) {
        content += `    ${method.teardown}\n`;
      }

      content += `  });\n\n`;
    }

    // Add teardown
    if (testSuite.teardown) {
      content += `  ${testSuite.teardown}\n`;
    }

    content += `});\n`;

    return content;
  }

  /**
   * Generate test coverage configuration
   */
  generateCoverageConfig(
    thresholds: {
      statements?: number;
      branches?: number;
      functions?: number;
      lines?: number;
    } = {}
  ): string {
    const config = {
      collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/*.interface.ts',
        '!src/types/**',
        '!**/__tests__/**',
      ],
      coverageThreshold: {
        global: {
          statements: thresholds.statements || 80,
          branches: thresholds.branches || 80,
          functions: thresholds.functions || 80,
          lines: thresholds.lines || 80,
        },
      },
      coverageReporters: ['text', 'lcov', 'html', 'json'],
    };

    if (this.options.framework === 'jest') {
      return `export default ${JSON.stringify(config, null, 2)};`;
    } else {
      return JSON.stringify(config, null, 2);
    }
  }

  /**
   * Generate mock data
   */
  generateMockData(schema: Record<string, any>): string {
    let mockData = '// Auto-generated mock data\n\n';

    mockData += `const mock${this.formatTypeName(schema.name || 'Data')} = {\n`;

    for (const [key, value] of Object.entries(schema.properties || {})) {
      const mockValue = this.generateMockValue(value);
      mockData += `  ${key}: ${mockValue},\n`;
    }

    mockData += `};\n\n`;
    mockData += `export default mock${this.formatTypeName(schema.name || 'Data')};\n`;

    return mockData;
  }

  /**
   * Generate test helpers
   */
  generateTestHelpers(): string {
    let helpers = '// Test helper functions\n\n';

    // Add wait helper
    helpers += `export const wait = (ms: number): Promise<void> =>\n`;
    helpers += `  new Promise((resolve) => setTimeout(resolve, ms));\n\n`;

    // Add mock response helper
    helpers += `export const createMockResponse = <T>(data: T, status = 200) =>\n`;
    helpers += `  ({\n`;
    helpers += `    ok: status >= 200 && status < 300,\n`;
    helpers += `    status,\n`;
    helpers += `    json: async () => data,\n`;
    helpers += `  } as Response);\n\n`;

    // Add random data generator
    helpers += `export const randomString = (length = 10): string =>\n`;
    helpers += `  Math.random().toString(36).substring(2, 2 + length);\n\n`;

    helpers += `export const randomNumber = (min = 0, max = 100): number =>\n`;
    helpers += `  Math.floor(Math.random() * (max - min + 1)) + min;\n\n`;

    return helpers;
  }

  /**
   * Get test action description
   */
  private getTestAction(method: string): string {
    const actions: Record<string, string> = {
      GET: 'retrieve',
      POST: 'create',
      PUT: 'update',
      DELETE: 'delete',
      PATCH: 'partially update',
    };
    return actions[method] || 'handle';
  }

  /**
   * Generate mock value based on type
   */
  private generateMockValue(typeInfo: any): string {
    if (typeof typeInfo === 'string') {
      return JSON.stringify(typeInfo);
    }

    const type = typeInfo.type || 'string';
    const mockValues: Record<string, string> = {
      string: "'test string'",
      number: '123',
      integer: '123',
      boolean: 'true',
      object: '{}',
      array: '[]',
      date: "'2023-01-01T00:00:00.000Z'",
    };

    return mockValues[type] || "'test'";
  }

  /**
   * Format type name
   */
  private formatTypeName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/[^a-zA-Z0-9]/g, '');
  }
}

export default TestGenerator;
