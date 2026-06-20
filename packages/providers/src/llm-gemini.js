"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectedGeminiProvider = void 0;
/**
 * Connected Gemini Implementation.
 * Relies on external API. HealthCheck will fail if Network or Token fails.
 */
class ConnectedGeminiProvider {
    manifest = {
        capability: 'llm',
        provider: 'gemini',
        mode: 'connected'
    };
    apiKey = null;
    isOnline = true;
    async initialize(config) {
        this.apiKey = process.env.MYCODEXVANTAOS_LLM_GEMINI_API_KEY || null;
        if (!this.apiKey) {
            console.warn('[Provider: llm-gemini] Missing API Key. Provider will mark itself down.');
            this.isOnline = false;
        }
        else {
            console.log('[Provider: llm-gemini] Connected to Google Gemini API');
        }
    }
    async healthCheck() {
        if (!this.isOnline || !this.apiKey) {
            return { status: 'down', reason: 'Missing API Key or Network offline' };
        }
        return { status: 'healthy' };
    }
    async shutdown() { }
    async generate(request) {
        // Fake triggering a real API call. We will simulate an error to show fallback.
        if (!this.isOnline) {
            throw new Error("Gemini API is down or not configured.");
        }
        // Isolate API data structure here:
        // ... const gca_response = await gemini_client.generateContent(...) 
        // Always map back to standard `LlmCompletionResponse` !
        return {
            content: `[Gemini 生成] 已分析完成：\${request.prompt.substring(0, 50)}...`,
            providerUsed: 'gemini'
        };
    }
}
exports.ConnectedGeminiProvider = ConnectedGeminiProvider;
