/**
 * @module packages/adapters
 * @description Barrel re-export for all adapter implementations.
 *
 * Adapters are the "outside" of the hexagonal architecture — they provide
 * concrete implementations of the ports defined in packages/ports/.
 *
 * Import paths:
 *   - @mycodexvantaos/adapters/cloudflare-d1
 *   - @mycodexvantaos/adapters/cloudflare-kv
 *   - @mycodexvantaos/adapters/cloudflare-r2
 *   - @mycodexvantaos/adapters/d1-full-text-search
 *   - @mycodexvantaos/adapters/openai
 *   - @mycodexvantaos/adapters/openrouter
 *   - @mycodexvantaos/adapters/workers-ai
 */

// ── Storage Adapters (Cloudflare) ──────────────────────────────────────
export { CloudflareD1Adapter, D1Repository } from "./cloudflare-d1/index.js";

export { CloudflareKVCacheStore, CloudflareKVSessionStore } from "./cloudflare-kv/index.js";

export { CloudflareR2Adapter } from "./cloudflare-r2/index.js";

// ── Search Adapters ────────────────────────────────────────────────────
export { D1FullTextSearchAdapter } from "./d1-full-text-search/index.js";

// ── Model Provider Adapters ────────────────────────────────────────────
export { OpenAIChatAdapter, OpenAIEmbeddingAdapter } from "./openai/index.js";

export { OpenRouterChatAdapter } from "./openrouter/index.js";

export { WorkersAIChatAdapter, WorkersAIEmbeddingAdapter } from "./workers-ai/index.js";
