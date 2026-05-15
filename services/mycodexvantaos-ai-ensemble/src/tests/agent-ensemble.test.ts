/**
 * Tests for AgentEnsemble
 */

import { AgentEnsemble } from '../index';
import {
  Kernel,
  AuthProvider,
  VectorStoreProvider,
  LlmProvider,
  ObservabilityProvider,
} from '@mycodexvantaos/core-kernel';

// Mock the kernel and providers
jest.mock('@mycodexvantaos/core-kernel');

describe('AgentEnsemble', () => {
  let ensemble: AgentEnsemble;
  let mockKernel: jest.Mocked<Kernel>;
  let mockAuth: jest.Mocked<AuthProvider>;
  let mockVectorStore: jest.Mocked<VectorStoreProvider>;
  let mockLlm: jest.Mocked<LlmProvider>;
  let mockObs: jest.Mocked<ObservabilityProvider>;

  beforeEach(() => {
    // Create mock providers
    mockAuth = {
      verifyToken: jest.fn(),
    } as unknown as jest.Mocked<AuthProvider>;

    mockVectorStore = {
      manifest: { provider: 'mock-vector-store' },
      searchSimilar: jest.fn(),
    } as unknown as jest.Mocked<VectorStoreProvider>;

    mockLlm = {
      manifest: { provider: 'mock-llm' },
      generate: jest.fn().mockResolvedValue({ content: 'response', providerUsed: 'mock-llm' }),
    } as unknown as jest.Mocked<LlmProvider>;

    mockObs = {
      log: jest.fn(),
      publishMetrics: jest.fn(),
    } as unknown as jest.Mocked<ObservabilityProvider>;

    // Create mock kernel with registry
    mockKernel = {
      registry: {
        resolve: jest.fn().mockImplementation(async (name: string) => {
          switch (name) {
            case 'auth':
              return mockAuth;
            case 'vector-store':
              return mockVectorStore;
            case 'llm':
              return mockLlm;
            case 'observability':
              return mockObs;
            default:
              throw new Error(`Unknown provider: ${name}`);
          }
        }),
      },
    } as unknown as jest.Mocked<Kernel>;

    ensemble = new AgentEnsemble(mockKernel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create ensemble with kernel', () => {
      expect(ensemble).toBeDefined();
    });
  });

  describe('processQuery', () => {
    it('should process query successfully', async () => {
      // Setup mocks
      mockAuth.verifyToken.mockResolvedValue(true);
      mockVectorStore.searchSimilar.mockResolvedValue([{ text: 'context data' }]);
      mockLlm.generate.mockResolvedValue({ content: 'AI response', providerUsed: 'mock-llm' });

      const result = await ensemble.processQuery('valid-token', 'test query');

      expect(result).toBe('AI response');
      expect(mockAuth.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockVectorStore.searchSimilar).toHaveBeenCalled();
      expect(mockLlm.generate).toHaveBeenCalled();
    });

    it('should reject unauthorized access', async () => {
      mockAuth.verifyToken.mockResolvedValue(false);

      await expect(ensemble.processQuery('invalid-token', 'test query')).rejects.toThrow(
        'Unauthorized'
      );

      expect(mockAuth.verifyToken).toHaveBeenCalledWith('invalid-token');
      expect(mockObs.log).toHaveBeenCalledWith('error', 'Unauthorized access attempt.');
    });

    it('should log query received', async () => {
      mockAuth.verifyToken.mockResolvedValue(true);
      mockVectorStore.searchSimilar.mockResolvedValue([{ text: 'context' }]);
      mockLlm.generate.mockResolvedValue({ content: 'response', providerUsed: 'mock-llm' });

      await ensemble.processQuery('token', 'hello world');

      expect(mockObs.log).toHaveBeenCalledWith(
        'info',
        '🧠 AgentEnsemble receiving query: "hello world"'
      );
    });

    it('should log vector store retrieval', async () => {
      mockAuth.verifyToken.mockResolvedValue(true);
      mockVectorStore.searchSimilar.mockResolvedValue([{ text: 'context' }]);
      mockLlm.generate.mockResolvedValue({ content: 'response', providerUsed: 'mock-llm' });

      await ensemble.processQuery('token', 'test');

      expect(mockObs.log).toHaveBeenCalledWith(
        'info',
        expect.stringContaining('Retrieving RAG context using mock-vector-store')
      );
    });

    it('should log LLM generation', async () => {
      mockAuth.verifyToken.mockResolvedValue(true);
      mockVectorStore.searchSimilar.mockResolvedValue([{ text: 'context' }]);
      mockLlm.generate.mockResolvedValue({ content: 'response', providerUsed: 'mock-llm' });

      await ensemble.processQuery('token', 'test');

      expect(mockObs.log).toHaveBeenCalledWith(
        'info',
        expect.stringContaining('Generating response using mock-llm')
      );
    });

    it('should publish metrics', async () => {
      mockAuth.verifyToken.mockResolvedValue(true);
      mockVectorStore.searchSimilar.mockResolvedValue([{ text: 'context' }]);
      mockLlm.generate.mockResolvedValue({
        content: 'test response with length',
        providerUsed: 'mock-llm',
      });

      await ensemble.processQuery('token', 'test');

      expect(mockObs.publishMetrics).toHaveBeenCalledWith('run-888', {
        length: expect.any(Number),
      });
    });

    it('should include context in LLM prompt', async () => {
      mockAuth.verifyToken.mockResolvedValue(true);
      mockVectorStore.searchSimilar.mockResolvedValue([{ text: 'relevant context info' }]);
      mockLlm.generate.mockResolvedValue({ content: 'response', providerUsed: 'mock-llm' });

      await ensemble.processQuery('token', 'What is AI?');

      expect(mockLlm.generate).toHaveBeenCalledWith({
        prompt: expect.stringContaining('What is AI?'),
      });
      expect(mockLlm.generate).toHaveBeenCalledWith({
        prompt: expect.stringContaining('relevant context info'),
      });
    });

    it('should handle empty vector store results', async () => {
      mockAuth.verifyToken.mockResolvedValue(true);
      mockVectorStore.searchSimilar.mockResolvedValue([]);
      mockLlm.generate.mockResolvedValue({ content: 'response', providerUsed: 'mock-llm' });

      await expect(ensemble.processQuery('token', 'test')).rejects.toThrow();

      // The code expects context[0].text, so empty array will cause error
    });

    it('should propagate auth errors', async () => {
      mockAuth.verifyToken.mockRejectedValue(new Error('Auth service error'));

      await expect(ensemble.processQuery('token', 'test')).rejects.toThrow('Auth service error');
    });

    it('should propagate vector store errors', async () => {
      mockAuth.verifyToken.mockResolvedValue(true);
      mockVectorStore.searchSimilar.mockRejectedValue(new Error('Vector store error'));

      await expect(ensemble.processQuery('token', 'test')).rejects.toThrow('Vector store error');
    });

    it('should propagate LLM errors', async () => {
      mockAuth.verifyToken.mockResolvedValue(true);
      mockVectorStore.searchSimilar.mockResolvedValue([{ text: 'context' }]);
      mockLlm.generate.mockRejectedValue(new Error('LLM error'));

      await expect(ensemble.processQuery('token', 'test')).rejects.toThrow('LLM error');
    });

    it('should handle observability resolve errors', async () => {
      (mockKernel.registry.resolve as jest.Mock).mockImplementation(async (name: string) => {
        if (name === 'observability') {
          throw new Error('Observability not available');
        }
        return mockAuth;
      });

      await expect(ensemble.processQuery('token', 'test')).rejects.toThrow(
        'Observability not available'
      );
    });
  });

  describe('integration flows', () => {
    it('should execute full query flow', async () => {
      mockAuth.verifyToken.mockResolvedValue(true);
      mockVectorStore.searchSimilar.mockResolvedValue([
        { text: 'Document 1 content' },
        { text: 'Document 2 content' },
      ]);
      mockLlm.generate.mockResolvedValue({
        content: 'Generated response based on context',
        providerUsed: 'mock-llm',
      });

      const result = await ensemble.processQuery('user-token', 'Summarize documents');

      expect(result).toBe('Generated response based on context');

      // Verify order of operations by checking the calls
      const resolveCalls = (mockKernel.registry.resolve as jest.Mock).mock.calls;
      expect(resolveCalls[0][0]).toBe('observability');
      expect(resolveCalls[1][0]).toBe('auth');
      expect(resolveCalls[2][0]).toBe('vector-store');
      expect(resolveCalls[3][0]).toBe('llm');
    });

    it('should handle multiple sequential queries', async () => {
      mockAuth.verifyToken.mockResolvedValue(true);
      mockVectorStore.searchSimilar.mockResolvedValue([{ text: 'context' }]);
      mockLlm.generate.mockResolvedValue({ content: 'Response', providerUsed: 'mock-llm' });

      await ensemble.processQuery('token1', 'query1');
      await ensemble.processQuery('token2', 'query2');

      expect(mockAuth.verifyToken).toHaveBeenCalledTimes(2);
      expect(mockLlm.generate).toHaveBeenCalledTimes(2);
    });
  });
});
