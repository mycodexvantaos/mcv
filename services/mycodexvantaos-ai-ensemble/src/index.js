'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.AgentEnsemble = void 0;
class AgentEnsemble {
  kernel;
  constructor(kernel) {
    this.kernel = kernel;
  }
  async processQuery(token, query) {
    const obs = await this.kernel.registry.resolve('observability');
    obs.log('info', `🧠 AgentEnsemble receiving query: "${query}"`);
    // 1. Resolve Auth Capability & Verify
    const auth = await this.kernel.registry.resolve('auth');
    if (!(await auth.verifyToken(token))) {
      obs.log('error', 'Unauthorized access attempt.');
      throw new Error('Unauthorized');
    }
    // 2. Resolve Vector Store Capability & Retrieve
    const vectorStore = await this.kernel.registry.resolve('vector-store');
    obs.log('info', `🔍 Retrieving RAG context using ${vectorStore.manifest.provider}...`);
    const context = await vectorStore.searchSimilar([0.1, 0.2]);
    // 3. Resolve LLM Capability & Generate
    const llm = await this.kernel.registry.resolve('llm');
    obs.log('info', `💡 Generating response using ${llm.manifest.provider}...`);
    const response = await llm.generate({ prompt: `${query} Context: ${context[0].text}` });
    obs.publishMetrics('run-888', { length: response.content.length });
    return response.content;
  }
}
exports.AgentEnsemble = AgentEnsemble;
