import { TestGenerator, TestSuite } from '../src/index';

describe('TestGenerator', () => {
  let generator: TestGenerator;

  beforeEach(() => {
    generator = new TestGenerator({
      framework: 'jest',
      language: 'typescript',
      coverage: true,
      mocking: true,
      includeSnapshots: false,
    });
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      const defaultGen = new TestGenerator();
      expect(defaultGen).toBeInstanceOf(TestGenerator);
    });

    it('should initialize with custom options', () => {
      const customGen = new TestGenerator({
        framework: 'mocha',
        language: 'javascript',
        coverage: false,
      });
      expect(customGen).toBeInstanceOf(TestGenerator);
    });
  });

  describe('generateUnitTest', () => {
    it('should generate unit tests for a class', () => {
      const testSuite = generator.generateUnitTest('UserService', ['getUser', 'createUser']);

      expect(testSuite.name).toBe('UserService unit tests');
      expect(testSuite.subject).toBe('UserService');
      expect(testSuite.type).toBe('unit');
      expect(testSuite.methods).toHaveLength(4); // 2 methods x 2 tests each
    });

    it('should generate success and error tests for each method', () => {
      const testSuite = generator.generateUnitTest('Calculator', ['add']);

      expect(testSuite.methods).toHaveLength(2);
      expect(testSuite.methods[0].name).toContain('successfully');
      expect(testSuite.methods[1].name).toContain('handle errors');
    });

    it('should include custom imports', () => {
      const testSuite = generator.generateUnitTest(
        'UserService',
        ['getUser'],
        ["import { User } from './models';"]
      );

      expect(testSuite.imports).toContain("import { User } from './models';");
    });
  });

  describe('generateIntegrationTests', () => {
    it('should generate integration tests for API endpoints', () => {
      const endpoints = [
        {
          method: 'GET',
          path: '/api/users',
          responses: [{ statusCode: 200 }],
        },
        {
          method: 'POST',
          path: '/api/users',
          responses: [{ statusCode: 201 }],
        },
      ];

      const testSuite = generator.generateIntegrationTests('UserAPI', endpoints);

      expect(testSuite.name).toBe('UserAPI integration tests');
      expect(testSuite.type).toBe('integration');
      expect(testSuite.methods).toHaveLength(2);
    });

    it('should generate appropriate test actions', () => {
      const endpoints = [
        {
          method: 'GET',
          path: '/api/users',
          responses: [{ statusCode: 200 }],
        },
      ];

      const testSuite = generator.generateIntegrationTests('UserAPI', endpoints);

      expect(testSuite.methods[0].name).toContain('retrieve');
    });

    it('should use correct HTTP method in setup', () => {
      const endpoints = [
        {
          method: 'POST',
          path: '/api/users',
          responses: [{ statusCode: 201 }],
        },
      ];

      const testSuite = generator.generateIntegrationTests('UserAPI', endpoints);

      expect(testSuite.methods[0].setup).toContain("request(app).post('/api/users')");
    });

    it('should add assertions for success responses', () => {
      const endpoints = [
        {
          method: 'GET',
          path: '/api/users',
          responses: [{ statusCode: 200 }],
        },
      ];

      const testSuite = generator.generateIntegrationTests('UserAPI', endpoints);

      expect(testSuite.methods[0].assertions).toContain('expect(response.status).toBe(200)');
    });
  });

  describe('generateE2ETest', () => {
    it('should generate E2E test for a scenario', () => {
      const steps = [
        "await page.goto('https://example.com')",
        "await page.click('#login-button')",
        "await page.fill('#username', 'testuser')",
      ];

      const testSuite = generator.generateE2ETest('User Login', steps);

      expect(testSuite.name).toBe('User Login E2E test');
      expect(testSuite.type).toBe('e2e');
      expect(testSuite.methods).toHaveLength(1);
      expect(testSuite.methods[0].name).toContain('User Login');
    });

    it('should include Playwright imports', () => {
      const testSuite = generator.generateE2ETest('Test', []);

      expect(testSuite.imports?.some((i) => i.includes('@playwright/test'))).toBe(true);
    });

    it('should include step execution in test method', () => {
      const steps = ["await page.click('#button')"];
      const testSuite = generator.generateE2ETest('Click Test', steps);

      expect(testSuite.methods[0].setup).toContain("await page.click('#button')");
    });
  });

  describe('generateTestFile', () => {
    it('should generate Jest-compatible test file', () => {
      const testSuite = generator.generateUnitTest('UserService', ['getUser']);
      const content = generator.generateTestFile(testSuite);

      expect(content).toContain('describe');
      expect(content).toContain('it');
      expect(content).toContain('@jest/globals');
    });

    it('should include imports in test file', () => {
      const testSuite: TestSuite = {
        name: 'Test',
        subject: 'TestClass',
        type: 'unit',
        methods: [],
        imports: ["import { something } from './module';"],
      };
      const content = generator.generateTestFile(testSuite);

      expect(content).toContain("import { something } from './module';");
    });

    it('should include setup code in test methods', () => {
      const testSuite = generator.generateUnitTest('UserService', ['getUser']);
      const content = generator.generateTestFile(testSuite);

      expect(content).toContain('let instance: UserService');
    });

    it('should include cleanup code for integration tests', () => {
      const testSuite = generator.generateIntegrationTests('UserAPI', []);
      const content = generator.generateTestFile(testSuite);

      expect(content).toContain('beforeAll');
      expect(content).toContain('afterAll');
    });
  });

  describe('generateCoverageConfig', () => {
    it('should generate coverage configuration with defaults', () => {
      const config = generator.generateCoverageConfig();
      const parsed = JSON.parse(config.replace('export default ', '').replace(/;$/, ''));

      expect(parsed.coverageThreshold.global.statements).toBe(80);
      expect(parsed.coverageThreshold.global.branches).toBe(80);
      expect(parsed.coverageThreshold.global.functions).toBe(80);
      expect(parsed.coverageThreshold.global.lines).toBe(80);
    });

    it('should generate coverage configuration with custom thresholds', () => {
      const config = generator.generateCoverageConfig({
        statements: 90,
        branches: 85,
        functions: 95,
        lines: 90,
      });
      const parsed = JSON.parse(config.replace('export default ', '').replace(/;$/, ''));

      expect(parsed.coverageThreshold.global.statements).toBe(90);
      expect(parsed.coverageThreshold.global.branches).toBe(85);
      expect(parsed.coverageThreshold.global.functions).toBe(95);
      expect(parsed.coverageThreshold.global.lines).toBe(90);
    });

    it('should specify correct coverage collection paths', () => {
      const config = generator.generateCoverageConfig();
      const parsed = JSON.parse(config.replace('export default ', '').replace(/;$/, ''));

      expect(parsed.collectCoverageFrom).toContain('src/**/*.ts');
      expect(parsed.collectCoverageFrom).toContain('!src/**/*.d.ts');
    });
  });

  describe('generateMockData', () => {
    it('should generate mock data from schema', () => {
      const schema = {
        name: 'User',
        properties: {
          id: 'string',
          name: 'string',
          age: 'number',
          active: 'boolean',
        },
      };

      const mockData = generator.generateMockData(schema);

      expect(mockData).toContain('mockUser');
      expect(mockData).toContain('id:');
      expect(mockData).toContain('name:');
      expect(mockData).toContain('age:');
      expect(mockData).toContain('active:');
    });

    it('should generate default name if not provided', () => {
      const schema = {
        properties: {
          id: 'string',
        },
      };

      const mockData = generator.generateMockData(schema);
      expect(mockData).toContain('mockData');
    });
  });

  describe('generateTestHelpers', () => {
    it('should generate wait helper function', () => {
      const helpers = generator.generateTestHelpers();

      expect(helpers).toContain('export const wait');
      expect(helpers).toContain('Promise<void>');
      expect(helpers).toContain('setTimeout');
    });

    it('should generate mock response helper', () => {
      const helpers = generator.generateTestHelpers();

      expect(helpers).toContain('export const createMockResponse');
      expect(helpers).toContain('ok');
      expect(helpers).toContain('status');
    });

    it('should generate random string helper', () => {
      const helpers = generator.generateTestHelpers();

      expect(helpers).toContain('export const randomString');
      expect(helpers).toContain('toString(36)');
    });

    it('should generate random number helper', () => {
      const helpers = generator.generateTestHelpers();

      expect(helpers).toContain('export const randomNumber');
      expect(helpers).toContain('Math.random');
      expect(helpers).toContain('Math.floor');
    });
  });
});
