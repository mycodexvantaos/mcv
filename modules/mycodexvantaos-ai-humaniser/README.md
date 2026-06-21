# @mycodexvantaos/ai-humaniser

AI Content Detection & Humanisation module for MyCodeXvantaOS.

## Overview

The Humaniser module detects AI-generated content in text and rewrites flagged sentences to sound more natural. It operates as a Local-first, Provider-agnostic service following all four MyCodeXvantaOS architecture principles.

### Core Capabilities

- **AI Content Detection** — Analyzes text for AI-generated patterns using linguistic and statistical feature extraction (perplexity proxy, lexical diversity, transition word overuse, punctuation density, etc.)
- **Content Humanisation** — Rewrites AI-flagged sentences with style-specific strategies (neutral, conversational, professional, academic, creative)
- **Confidence Scoring** — Provides per-sentence and overall confidence scores with letter grading (A+ through D)
- **Side-by-Side Comparison** — Generates highlighted text segments and diff views for before/after comparison
- **URL & File Extraction** — Extracts text from URLs and file inputs for analysis

### Architecture Principles

| Principle               | Implementation                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| **Local-first**         | Native detection and rewriting with zero external dependencies                                |
| **Provider-agnostic**   | `IDetectionProvider` / `IRewriteProvider` interfaces with native and external implementations |
| **Contract-first**      | Service definition YAML + JSON Schema validation under `contracts/`                           |
| **Governance-enforced** | Audit logging, integrity chain, integrity checks on results                                   |

## Installation

```bash
pnpm add @mycodexvantaos/ai-humaniser
```

## Quick Start

### Detection Only

```typescript
import { HumaniserEngine } from '@mycodexvantaos/ai-humaniser';

const engine = new HumaniserEngine({ mode: 'native' });
await engine.initialize();

const result = await engine.detect('Your text to analyze here.');

console.log(result.label); // 'ai' | 'human' | 'mixed' | 'uncertain'
console.log(result.aiScore); // 0-1 probability
console.log(result.confidence); // 0-1 confidence
console.log(result.explanation); // Human-readable explanation

// Per-sentence breakdown
result.sentences.forEach((s) => {
  console.log(`[${s.label}] ${s.text} (AI: ${(s.aiScore * 100).toFixed(0)}%)`);
});

await engine.shutdown();
```

### Detection + Humanisation

```typescript
const engine = new HumaniserEngine({ mode: 'auto' });
await engine.initialize();

const { detection, humanisation } = await engine.detectAndHumanise(
  'Furthermore, it is important to leverage these capabilities to facilitate optimal outcomes.'
);

console.log('Original AI Score:', detection.aiScore);
console.log('Humanised text:', humanisation.humanisedText);
console.log('Score improvement:', humanisation.changeSummary.avgScoreImprovement);

// Side-by-side comparison
humanisation.comparison.diffs.forEach((diff) => {
  console.log(`[${diff.type}] ${diff.original || diff.humanised}`);
});
```

### Hybrid Mode (Native + LLM)

```typescript
const engine = new HumaniserEngine({
  mode: 'hybrid',
  externalEndpoint: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY,
});
await engine.initialize();

// Native detection runs first, LLM enhances when available
const result = await engine.detect(text);
console.log(result.providerSource); // 'hybrid' | 'native' (fallback)
```

## Configuration

| Option                   | Type                                            | Default         | Description                             |
| ------------------------ | ----------------------------------------------- | --------------- | --------------------------------------- |
| `mode`                   | `'native' \| 'connected' \| 'hybrid' \| 'auto'` | `'auto'`        | Runtime mode                            |
| `detectionThreshold`     | `number`                                        | `0.65`          | AI detection threshold (0-1)            |
| `minSentenceLength`      | `number`                                        | `3`             | Minimum words per sentence to analyze   |
| `nativeOnly`             | `boolean`                                       | `false`         | Force native-only mode                  |
| `externalEndpoint`       | `string`                                        | —               | LLM API endpoint                        |
| `apiKey`                 | `string`                                        | —               | LLM API key                             |
| `defaultStyle`           | `RewriteStyle`                                  | `'neutral'`     | Default rewrite style                   |
| `preserveTechnicalTerms` | `boolean`                                       | `true`          | Preserve technical terms during rewrite |
| `defaultFormality`       | `FormalityLevel`                                | `'semi-formal'` | Default formality level                 |
| `cacheTtlSeconds`        | `number`                                        | `300`           | Cache TTL for detection results         |
| `maxTextLength`          | `number`                                        | `100000`        | Maximum input text length               |

## Rewrite Styles

| Style            | Description                                                                             |
| ---------------- | --------------------------------------------------------------------------------------- |
| `neutral`        | Removes AI-typical patterns (delve, leverage, utilize, facilitate) with minimal changes |
| `conversational` | Replaces formal connectors with casual equivalents, adds hedging, splits long sentences |
| `professional`   | Elevates casual language to professional vocabulary                                     |
| `academic`       | Replaces casual phrasing with academic equivalents                                      |
| `creative`       | Varies sentence openings and structure for more natural flow                            |

## Detection Signals

The native detector uses these weighted features:

| Feature                | Weight | AI Indicator                           |
| ---------------------- | ------ | -------------------------------------- |
| `perplexityProxy`      | 0.15   | Low (uniform patterns) → AI-like       |
| `lexicalDiversity`     | 0.15   | Low (repetitive vocabulary) → AI-like  |
| `repetitionScore`      | 0.12   | Very low (too clean) → AI-like         |
| `avgWordFrequency`     | 0.10   | High (only common words) → AI-like     |
| `complexity`           | 0.10   | Uniform range → AI-like                |
| `vocabularyRichness`   | 0.10   | Low (few uncommon words) → AI-like     |
| `transitionSmoothness` | 0.07   | High (overuse of connectors) → AI-like |
| `avgWordLength`        | 0.08   | Very uniform (4.2–5.8) → AI-like       |
| `punctuationDensity`   | 0.08   | Very low or very high → AI-like        |
| `wordCount`            | 0.05   | Very short or very long → AI-like      |

## API Reference

### `HumaniserEngine`

Main entry point implementing `IHumaniserEngine`.

- `detect(text: string, source?: InputSource): Promise<DetectionResult>`
- `humanise(request: HumaniserRequest): Promise<HumaniserResult>`
- `detectAndHumanise(text, source?, style?, formality?): Promise<{ detection, humanisation }>`
- `healthCheck(): Promise<boolean>`
- `shutdown(): Promise<void>`
- `getRuntimeMode(): HumaniserRuntimeMode`
- `getConfig(): Readonly<HumaniserConfig>`

### Core Utilities

- `detectNative(text, source?)` — Native AI detection
- `humaniseNative(request)` — Native rule-based rewriting
- `extractFeatures(sentence)` — Feature extraction
- `splitIntoSentences(text)` — Sentence splitting
- `computeWeightedAiScore(sentences)` — Weighted scoring
- `computeGrade(aiScore)` — Letter grading
- `generateReport(detectionResult)` — Comprehensive report

### Providers

- `NativeDetectionProvider` — Zero-dep detection
- `NativeRewriteProvider` — Zero-dep rewriting
- `ExternalDetectionProvider` — LLM-powered detection (OpenAI-compatible)
- `ExternalRewriteProvider` — LLM-powered rewriting (OpenAI-compatible)

## Contract Integration

- **Service Definition**: `contracts/service-definitions/ai-humaniser.yaml`
- **Detection Schema**: `contracts/schemas/humaniser-detection.schema.json`
- **Humanisation Schema**: `contracts/schemas/humaniser-humanisation.schema.json`
- **Module Manifest**: `modules/mycodexvantaos-ai-humaniser/module-manifest.yaml`
- **Capabilities**: `modules/mycodexvantaos-ai-humaniser/capabilities.yaml`

## Dashboard Integration

The Humaniser integrates into the MyCodeXvantaOS dashboard:

- **Page**: `/dashboard/humaniser`
- **API Routes**: `/api/humaniser/detect`, `/api/humaniser/humanise`, `/api/humaniser/report`
- **AI Flows**: `src/ai/flows/humaniser-detection-flow.ts`, `src/ai/flows/humaniser-rewrite-flow.ts`

## License

MIT
