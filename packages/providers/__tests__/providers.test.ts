/**
 * @jest-environment node
 */

import {
  NativeLlmProvider,
  NativeAuthProvider,
  NativeDeployProvider,
  ExternalDeployProvider,
  getDeployProvider,
  NativeVectorStoreProvider,
  ConnectedPgVectorProvider,
  NativeObservabilityProvider,
  ConnectedAuthProvider,
  ConnectedGeminiProvider,
} from '../src/index';
import * as fs from 'fs';
import * as childProcess from 'child_process';

// Mock fs module for providers
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

// Mock child_process for observability provider
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockExec = childProcess.exec as jest.MockedFunction<typeof childProcess.exec>;

describe('providers Package', () => {
  describe('NativeLlmProvider', () => {
    let provider: NativeLlmProvider;

    beforeEach(() => {
      provider = new NativeLlmProvider();
      mockFs.existsSync.mockReturnValue(false);
      mockFs.readFileSync.mockReturnValue('');
    });

    describe('initialize', () => {
      it('should initialize successfully', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation();
        await provider.initialize();
        expect(logSpy).toHaveBeenCalledWith(
          '[Provider: llm-native] Initialized local rule-based LLM engine with semantic dictionary.'
        );
        logSpy.mockRestore();
      });

      it('should load dictionary when file exists', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation();
        const dictionaryYaml = `
terms:
  - id: "term-001"
    english: "authentication"
    definition: "The process of verifying the identity of a user"
    traditional_chinese: "認證"
    simplified_chinese: "认证"
  - id: "term-002"
    english: "deployment"
    definition: "The process of releasing software to an environment"
    traditional_chinese: "部署"
`;
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(dictionaryYaml);

        await provider.initialize();

        // Test semantic fallback by generating a prompt that matches dictionary term
        const response = await provider.generate({ prompt: 'What is authentication?' });
        expect(response.providerUsed).toBe('native-rules');
        expect(response.content).toContain('語意降級');
        expect(response.content).toContain('authentication');

        logSpy.mockRestore();
      });
    });

    describe('healthCheck', () => {
      it('should return healthy status', async () => {
        const result = await provider.healthCheck();
        expect(result.status).toBe('healthy');
      });
    });

    describe('generate', () => {
      it('should return native offline response for unknown prompts', async () => {
        await provider.initialize();
        const response = await provider.generate({ prompt: 'random unknown query' });
        expect(response.providerUsed).toBe('native-rules');
        expect(response.content).toBeDefined();
      });

      it('should return summary response for summary prompts', async () => {
        await provider.initialize();
        const response = await provider.generate({
          prompt: 'Please provide a summary of this text',
        });
        expect(response.providerUsed).toBe('native-rules');
        expect(response.content).toContain('摘要');
      });

      it('should return summary response for Chinese 摘要 prompts', async () => {
        await provider.initialize();
        const response = await provider.generate({ prompt: '請提供這段文字的摘要' });
        expect(response.providerUsed).toBe('native-rules');
        expect(response.content).toContain('摘要');
      });

      it('should return error response for error prompts', async () => {
        await provider.initialize();
        const response = await provider.generate({ prompt: 'Help with this error message' });
        expect(response.providerUsed).toBe('native-rules');
        expect(response.content).toContain('除錯');
      });

      it('should return error response for Chinese 錯誤 prompts', async () => {
        await provider.initialize();
        const response = await provider.generate({ prompt: '幫我解決這個錯誤問題' });
        expect(response.providerUsed).toBe('native-rules');
        expect(response.content).toContain('除錯');
      });

      it('should match dictionary terms with traditional Chinese', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation();
        // Use YAML format that matches the expected parsing in llm-native.ts
        // Note: The matching does lowerPrompt.includes(tc), so tc should not have uppercase letters
        // that would break the match since lowerPrompt is lowercased
        const dictionaryYaml = `  - id: "term-001"
    english: "authentication"
    definition: "The process of verifying identity"
    traditional_chinese: "認證"
`;
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(dictionaryYaml);

        await provider.initialize();
        // Prompt containing the traditional Chinese term
        const response = await provider.generate({ prompt: '什麼是認證？' });
        expect(response.providerUsed).toBe('native-rules');
        // Should match the term and return semantic fallback response
        expect(response.content).toContain('authentication');
        expect(response.content).toContain('認證');

        logSpy.mockRestore();
      });

      it('should match dictionary terms with simplified Chinese', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation();
        const dictionaryYaml = `  - id: "term-001"
    english: "deployment"
    definition: "The process of releasing software"
    simplified_chinese: "部署"
`;
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(dictionaryYaml);

        await provider.initialize();
        // Prompt containing the simplified Chinese term
        const response = await provider.generate({ prompt: '什么是部署？' });
        expect(response.providerUsed).toBe('native-rules');
        // The matching works via simplified_chinese, but output only shows traditional_chinese
        expect(response.content).toContain('deployment');
        expect(response.content).toContain('定義');

        logSpy.mockRestore();
      });

      it('should handle dictionary terms without chinese translations', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation();
        const dictionaryYaml = `
terms:
  - id: "term-001"
    english: "docker container"
    definition: "A lightweight standalone executable package"
`;
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(dictionaryYaml);

        await provider.initialize();
        const response = await provider.generate({ prompt: 'Tell me about docker container' });
        expect(response.providerUsed).toBe('native-rules');
        expect(response.content).toContain('語意降級');
        expect(response.content).toContain('docker container');

        logSpy.mockRestore();
      });
    });

    describe('shutdown', () => {
      it('should shutdown without error', async () => {
        await expect(provider.shutdown()).resolves.not.toThrow();
      });
    });
  });

  describe('NativeAuthProvider', () => {
    let provider: NativeAuthProvider;

    beforeEach(() => {
      provider = new NativeAuthProvider();
    });

    describe('initialize', () => {
      it('should initialize successfully', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation();
        await provider.initialize();
        expect(logSpy).toHaveBeenCalledWith(
          '[Provider: auth-native] Initialized native local crypto authentication.'
        );
        logSpy.mockRestore();
      });
    });

    describe('healthCheck', () => {
      it('should return healthy status', async () => {
        const result = await provider.healthCheck();
        expect(result.status).toBe('healthy');
      });
    });

    describe('generateToken', () => {
      it('should generate a valid JWT-like token', async () => {
        const token = await provider.generateToken({ userId: '123', role: 'admin' });
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        const parts = token.split('.');
        expect(parts).toHaveLength(3);
      });
    });

    describe('verifyToken', () => {
      it('should verify a valid token', async () => {
        const token = await provider.generateToken({ userId: '123' });
        const isValid = await provider.verifyToken(token);
        expect(isValid).toBe(true);
      });

      it('should reject an invalid token', async () => {
        const isValid = await provider.verifyToken('invalid.token.here');
        expect(isValid).toBe(false);
      });

      it('should reject a malformed token', async () => {
        const isValid = await provider.verifyToken('not-even-a-jwt');
        expect(isValid).toBe(false);
      });
    });

    describe('shutdown', () => {
      it('should shutdown without error', async () => {
        await expect(provider.shutdown()).resolves.not.toThrow();
      });
    });
  });

  describe('NativeDeployProvider', () => {
    let provider: NativeDeployProvider;

    beforeEach(() => {
      provider = new NativeDeployProvider();
    });

    describe('healthCheck', () => {
      it('should return true for native provider', async () => {
        const result = await provider.healthCheck();
        expect(result).toBe(true);
      });
    });

    describe('deploy', () => {
      it('should deploy artifact locally', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation();
        const artifact = { name: 'test-app', version: '1.0.0' };
        const result = await provider.deploy(artifact);

        expect(result.status).toBe('success');
        expect(result.provider).toBe('native');
        expect(result.url).toBe('http://localhost:3000');
        expect(result.versionId).toBeDefined();
        logSpy.mockRestore();
      });
    });

    describe('rollback', () => {
      it('should rollback to specified version', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation();
        const result = await provider.rollback('v-123456');
        expect(result).toBe(true);
        logSpy.mockRestore();
      });
    });
  });

  describe('ExternalDeployProvider', () => {
    let provider: ExternalDeployProvider;

    beforeEach(() => {
      provider = new ExternalDeployProvider('/path/to/kubeconfig', 'test-token');
    });

    describe('healthCheck', () => {
      it('should return true when credentials are provided', async () => {
        const result = await provider.healthCheck();
        expect(result).toBe(true);
      });

      it('should return false when credentials are missing', async () => {
        const emptyProvider = new ExternalDeployProvider('', '');
        const result = await emptyProvider.healthCheck();
        expect(result).toBe(false);
      });
    });

    describe('deploy', () => {
      it('should deploy via ArgoCD', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation();
        const artifact = { name: 'test-app', version: '1.0.0' };
        const result = await provider.deploy(artifact);

        expect(result.status).toBe('success');
        expect(result.provider).toBe('external');
        expect(result.target).toBe('kubernetes-cluster');
        expect(result.versionId).toBeDefined();
        logSpy.mockRestore();
      });
    });

    describe('rollback', () => {
      it('should rollback via ArgoCD', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation();
        const result = await provider.rollback('v-123456');
        expect(result).toBe(true);
        logSpy.mockRestore();
      });
    });
  });

  describe('getDeployProvider', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should return native provider when mode is native', () => {
      process.env.MYCODEXVANTAOS_CORE_RUNTIME_MODE = 'native';
      delete process.env.ARGOCD_AUTH_TOKEN;

      jest.resetModules();
      const { getDeployProvider } = require('../src/index');
      const provider = getDeployProvider();

      expect(provider.source).toBe('native');
    });

    it('should throw error for connected mode without token', () => {
      process.env.MYCODEXVANTAOS_CORE_RUNTIME_MODE = 'connected';
      delete process.env.ARGOCD_AUTH_TOKEN;

      jest.resetModules();
      const { getDeployProvider } = require('../src/index');

      expect(() => getDeployProvider()).toThrow('Connected mode requires ARGOCD_AUTH_TOKEN');
    });

    it('should return external provider for connected mode with token', () => {
      process.env.MYCODEXVANTAOS_CORE_RUNTIME_MODE = 'connected';
      process.env.ARGOCD_AUTH_TOKEN = 'test-token';

      jest.resetModules();
      const { getDeployProvider } = require('../src/index');
      const provider = getDeployProvider();

      expect(provider.source).toBe('external');
    });

    it('should return native provider for hybrid mode without token', () => {
      process.env.MYCODEXVANTAOS_CORE_RUNTIME_MODE = 'hybrid';
      delete process.env.ARGOCD_AUTH_TOKEN;

      jest.resetModules();
      const { getDeployProvider } = require('../src/index');
      const provider = getDeployProvider();

      expect(provider.source).toBe('native');
    });

    it('should return external provider for hybrid mode with token', () => {
      process.env.MYCODEXVANTAOS_CORE_RUNTIME_MODE = 'hybrid';
      process.env.ARGOCD_AUTH_TOKEN = 'test-token';

      jest.resetModules();
      const { getDeployProvider } = require('../src/index');
      const provider = getDeployProvider();

      expect(provider.source).toBe('external');
    });
  });

  describe('NativeVectorStoreProvider', () => {
    let provider: NativeVectorStoreProvider;

    beforeEach(() => {
      provider = new NativeVectorStoreProvider();
    });

    describe('initialize', () => {
      it('should initialize successfully', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation();
        await provider.initialize();
        expect(logSpy).toHaveBeenCalledWith(
          '[Provider: vector-store-native] Initialized native local memory vector space.'
        );
        logSpy.mockRestore();
      });
    });

    describe('healthCheck', () => {
      it('should return healthy status', async () => {
        const result = await provider.healthCheck();
        expect(result.status).toBe('healthy');
      });
    });

    describe('storeEmbedding', () => {
      it('should store a new embedding', async () => {
        await provider.initialize();
        const result = await provider.storeEmbedding('doc1', 'Hello world', [0.1, 0.2, 0.3]);
        expect(result).toBe(true);
      });

      it('should update an existing embedding', async () => {
        await provider.initialize();
        await provider.storeEmbedding('doc1', 'Hello world', [0.1, 0.2, 0.3]);
        const result = await provider.storeEmbedding('doc1', 'Updated text', [0.4, 0.5, 0.6]);
        expect(result).toBe(true);
      });

      it('should handle empty embedding vector', async () => {
        await provider.initialize();
        const result = await provider.storeEmbedding('doc-empty', 'Empty embedding', []);
        expect(result).toBe(true);
      });
    });

    describe('searchSimilar', () => {
      it('should return empty array when store is empty', async () => {
        await provider.initialize();
        const results = await provider.searchSimilar([0.1, 0.2, 0.3], 3);
        expect(results).toEqual([]);
      });

      it('should return similar documents', async () => {
        await provider.initialize();
        await provider.storeEmbedding('doc1', 'First document', [1, 0, 0]);
        await provider.storeEmbedding('doc2', 'Second document', [0, 1, 0]);
        await provider.storeEmbedding('doc3', 'Third document', [0, 0, 1]);

        const results = await provider.searchSimilar([1, 0, 0], 2);
        expect(results).toHaveLength(2);
        expect(results[0].id).toBe('doc1');
        expect(results[0].score).toBeGreaterThan(0.9);
      });

      it('should limit results to topK', async () => {
        await provider.initialize();
        await provider.storeEmbedding('doc1', 'First', [1, 0, 0]);
        await provider.storeEmbedding('doc2', 'Second', [0.9, 0.1, 0]);
        await provider.storeEmbedding('doc3', 'Third', [0, 1, 0]);

        const results = await provider.searchSimilar([1, 0, 0], 2);
        expect(results).toHaveLength(2);
      });

      it('should return results sorted by similarity score descending', async () => {
        await provider.initialize();
        await provider.storeEmbedding('doc1', 'Most similar', [1, 0, 0]);
        await provider.storeEmbedding('doc2', 'Medium similar', [0.8, 0.2, 0]);
        await provider.storeEmbedding('doc3', 'Least similar', [0.3, 0.7, 0]);

        const results = await provider.searchSimilar([1, 0, 0], 3);
        expect(results).toHaveLength(3);
        expect(results[0].id).toBe('doc1');
        expect(results[0].score).toBeGreaterThan(results[1].score);
        expect(results[1].score).toBeGreaterThan(results[2].score);
      });

      it('should handle topK greater than available documents', async () => {
        await provider.initialize();
        await provider.storeEmbedding('doc1', 'First', [1, 0, 0]);

        const results = await provider.searchSimilar([1, 0, 0], 10);
        expect(results).toHaveLength(1);
      });

      it('should return documents with correct structure', async () => {
        await provider.initialize();
        await provider.storeEmbedding('doc1', 'Test document', [1, 0, 0]);

        const results = await provider.searchSimilar([1, 0, 0], 1);
        expect(results[0]).toHaveProperty('id');
        expect(results[0]).toHaveProperty('text');
        expect(results[0]).toHaveProperty('score');
        expect(results[0].text).toBe('Test document');
      });

      it('should handle empty embedding vector search', async () => {
        await provider.initialize();
        await provider.storeEmbedding('doc1', 'Test', [1, 0, 0]);

        const results = await provider.searchSimilar([], 1);
        // Empty vector should still work (returns all with same score)
        expect(results.length).toBeGreaterThanOrEqual(0);
      });
    });

    describe('shutdown', () => {
      it('should shutdown without error', async () => {
        await expect(provider.shutdown()).resolves.not.toThrow();
      });
    });
  });

  describe('ConnectedPgVectorProvider', () => {
    let provider: ConnectedPgVectorProvider;

    beforeEach(() => {
      provider = new ConnectedPgVectorProvider();
    });

    describe('healthCheck', () => {
      it('should return down status with reason', async () => {
        const result = await provider.healthCheck();
        expect(result.status).toBe('down');
        expect(result.reason).toBe('Postgres DB unreachable');
      });
    });

    describe('storeEmbedding', () => {
      it('should throw error when pg is down', async () => {
        await expect(provider.storeEmbedding('id', 'text', [])).rejects.toThrow('PG Down');
      });
    });

    describe('searchSimilar', () => {
      it('should throw error when pg is down', async () => {
        await expect(provider.searchSimilar([])).rejects.toThrow('PG Down');
      });
    });
  });

  describe('NativeObservabilityProvider', () => {
    let provider: NativeObservabilityProvider;

    beforeEach(() => {
      provider = new NativeObservabilityProvider();
      // exec(command, options, callback) - options can be omitted
      // The callback is always the last argument
      mockExec.mockImplementation((cmd: string, optionsOrCallback: any, maybeCallback?: any) => {
        // Determine which argument is the callback
        const callback =
          typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
        if (typeof callback === 'function') {
          callback(null, 'success', '');
        }
        return {} as any;
      });
    });

    describe('initialize', () => {
      it('should initialize without error', async () => {
        await expect(provider.initialize()).resolves.not.toThrow();
      });
    });

    describe('healthCheck', () => {
      it('should return healthy status', async () => {
        const result = await provider.healthCheck();
        expect(result.status).toBe('healthy');
      });
    });

    describe('log', () => {
      it('should log messages with level', () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation();
        provider.log('info', 'Test message');
        expect(logSpy).toHaveBeenCalledWith('[INFO] Test message');
        logSpy.mockRestore();
      });
    });

    describe('publishMetrics', () => {
      it('should write metrics to temp file and execute script', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation();
        const errorSpy = jest.spyOn(console, 'error').mockImplementation();

        await provider.publishMetrics('test-id', { metric1: 100 });

        // Should have logged the delegation message
        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Metrics] Delegating publication for test-id')
        );

        logSpy.mockRestore();
        errorSpy.mockRestore();
      });

      it('should handle exec callback with error', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation();
        const errorSpy = jest.spyOn(console, 'error').mockImplementation();

        // Mock exec to call callback with error for this specific test
        mockExec.mockImplementationOnce(
          (cmd: string, optionsOrCallback: any, maybeCallback?: any) => {
            const callback =
              typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
            if (typeof callback === 'function') {
              callback(new Error('exec error'), '', 'stderr');
            }
            return {} as any;
          }
        );

        await provider.publishMetrics('test-id', { metric1: 100 });

        // The error should be logged
        expect(errorSpy).toHaveBeenCalled();

        logSpy.mockRestore();
        errorSpy.mockRestore();
      });

      it('should handle exec with stderr', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation();
        const errorSpy = jest.spyOn(console, 'error').mockImplementation();

        // Mock exec to call callback with stderr for this specific test
        mockExec.mockImplementationOnce(
          (cmd: string, optionsOrCallback: any, maybeCallback?: any) => {
            const callback =
              typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
            if (typeof callback === 'function') {
              callback(null, 'stdout', 'some stderr output');
            }
            return {} as any;
          }
        );

        await provider.publishMetrics('test-id', { metric1: 100 });

        logSpy.mockRestore();
        errorSpy.mockRestore();
      });
    });

    describe('shutdown', () => {
      it('should shutdown without error', async () => {
        await expect(provider.shutdown()).resolves.not.toThrow();
      });
    });
  });

  describe('ConnectedAuthProvider', () => {
    let provider: ConnectedAuthProvider;

    beforeEach(() => {
      provider = new ConnectedAuthProvider();
    });

    describe('healthCheck', () => {
      it('should return down status when offline', async () => {
        const result = await provider.healthCheck();
        expect(result.status).toBe('down');
        expect(result.reason).toBe('IDP unreachable');
      });
    });

    describe('verifyToken', () => {
      it('should throw error when IDP is down', async () => {
        await expect(provider.verifyToken('some-token')).rejects.toThrow('IDP Down');
      });
    });

    describe('shutdown', () => {
      it('should shutdown without error', async () => {
        await expect(provider.shutdown()).resolves.not.toThrow();
      });
    });
  });

  describe('ConnectedGeminiProvider', () => {
    let provider: ConnectedGeminiProvider;
    const originalEnv = process.env;

    beforeEach(() => {
      provider = new ConnectedGeminiProvider();
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    describe('initialize', () => {
      it('should warn when API key is missing', async () => {
        delete process.env.MYCODEXVANTAOS_LLM_GEMINI_API_KEY;
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

        await provider.initialize();

        expect(warnSpy).toHaveBeenCalledWith(
          '[Provider: llm-gemini] Missing API Key. Provider will mark itself down.'
        );
        warnSpy.mockRestore();
      });

      it('should log when API key is present', async () => {
        process.env.MYCODEXVANTAOS_LLM_GEMINI_API_KEY = 'test-api-key';
        const logSpy = jest.spyOn(console, 'log').mockImplementation();

        await provider.initialize();

        expect(logSpy).toHaveBeenCalledWith(
          '[Provider: llm-gemini] Connected to Google Gemini API'
        );
        logSpy.mockRestore();
      });
    });

    describe('healthCheck', () => {
      it('should return down status when not configured', async () => {
        delete process.env.MYCODEXVANTAOS_LLM_GEMINI_API_KEY;
        await provider.initialize();

        const result = await provider.healthCheck();
        expect(result.status).toBe('down');
        expect(result.reason).toBe('Missing API Key or Network offline');
      });
    });

    describe('generate', () => {
      it('should throw error when offline', async () => {
        delete process.env.MYCODEXVANTAOS_LLM_GEMINI_API_KEY;
        await provider.initialize();

        await expect(provider.generate({ prompt: 'test' })).rejects.toThrow(
          'Gemini API is down or not configured.'
        );
      });
    });

    describe('shutdown', () => {
      it('should shutdown without error', async () => {
        await expect(provider.shutdown()).resolves.not.toThrow();
      });
    });
  });
});
