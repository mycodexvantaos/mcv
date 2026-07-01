# AI Development Instructions

## Overview

The AI layer uses Google Genkit for all AI capabilities. Do NOT use LangChain, OpenAI SDK directly, or other frameworks in business logic.

## Genkit Setup

### Prerequisites

```bash
# Verify Genkit CLI (minimum version 1.29.0)
genkit --version

# Install/upgrade if needed
npm install -g genkit-cli@^1.29.0
```

### Development Server

```bash
# Start Genkit dev server
npm run genkit:dev

# Start with watch mode
npm run genkit:watch
```

## CRITICAL: API Knowledge Warning

Genkit recently went through a **major breaking API change**. Internal knowledge about Genkit APIs may be outdated. ALWAYS use:

```bash
genkit docs:read js/get-started.md
genkit docs:read js/flows.md
genkit docs:read js/tools.md
genkit docs:read js/models.md
```

## AI Layer Structure

```
src/ai/                          — Main AI application code
packages/ai-agent/               — AI agent abstractions
packages/ai-embedding/           — Embedding utilities
packages/ai-llm/                 — LLM provider abstractions
packages/ai-memory/              — Memory management
modules/mycodexvantaos-ai-agent/ — Agent module
modules/mycodexvantaos-ai-embedding/ — Embedding module
modules/mycodexvantaos-ai-llm/   — LLM module
modules/mycodexvantaos-ai-memory/ — Memory module
modules/mycodexvantaos-ai-team-orchestrator/ — Team orchestration
services/mycodexvantaos-ai-*     — AI microservices
schemas/ai-team/                 — AI team schemas
```

## Code Patterns

### Basic Flow

```typescript
import { z, genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";

const ai = genkit({
  plugins: [googleAI()],
});

export const myFlow = ai.defineFlow(
  {
    name: "myFlow",
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (input) => {
    const response = await ai.generate({
      model: googleAI.model("gemini-2.5-flash"),
      prompt: `Process: ${input}`,
    });
    return response.text;
  }
);
```

### Provider Abstraction

```typescript
// CORRECT: Use provider abstraction
import { LLMProvider } from "@mycodexvantaos/ai-llm";

// WRONG: Direct SDK import in business logic
import { GoogleGenerativeAI } from "@google/generative-ai"; // NO
```

## Skills Reference

Detailed Genkit development patterns are in:

- `.agents/skills/developing-genkit-js/SKILL.md`
- `.agents/skills/developing-genkit-js/references/best-practices.md`
- `.agents/skills/developing-genkit-js/references/common-errors.md`
- `.agents/skills/developing-genkit-js/references/docs-and-cli.md`
- `.agents/skills/developing-genkit-js/references/examples.md`
- `.agents/skills/developing-genkit-js/references/setup.md`

## AI Team Schemas

Agent communication schemas are defined in `schemas/ai-team/`:

- `agent-message.schema.json` — Message format between agents
- `agent-profile.schema.json` — Agent profile definition
- `agent-task.schema.json` — Task assignment format

## Testing AI Code

```bash
# Start Genkit dev for interactive testing
npm run genkit:dev

# Run AI-related service tests
npm run test:services

# Validate AI contracts
npm run contracts:validate
```

## Constraints

- Always use Genkit for AI capabilities (not raw SDK calls)
- Follow Provider abstraction for model access
- Define schemas with Zod for all AI inputs/outputs
- Test flows in Genkit dev UI before committing
- Never hardcode API keys (use environment variables)
- Memory operations go through `@mycodexvantaos/ai-memory`
