# Humaniser AI Content Detector — Integration Tasks

## Module Core (COMPLETED)
- [x] module-manifest.yaml
- [x] capabilities.yaml
- [x] package.json, tsconfig.json, jest.config.js
- [x] src/types/index.ts
- [x] src/core/feature-extractor.ts
- [x] src/core/detector.ts
- [x] src/core/rewriter.ts
- [x] src/core/scorer.ts
- [x] src/core/url-extractor.ts
- [x] src/core/engine.ts
- [x] src/index.ts
- [x] src/providers/native/* (detection, rewrite, barrel)
- [x] src/providers/external/* (detection, rewrite, barrel)
- [x] src/providers/index.ts
- [x] config/workflows/detect-and-humanise-workflow.yaml
- [x] config/presets/default-preset.yaml, strict-preset.yaml
- [x] contracts/service-definitions/ai-humaniser.yaml
- [x] contracts/schemas/humaniser-detection.schema.json

## Remaining Tasks
- [x] Tests: src/tests/detector.test.ts
- [x] Tests: src/tests/rewriter.test.ts
- [x] Tests: src/tests/scorer.test.ts
- [x] Tests: src/tests/feature-extractor.test.ts
- [x] Tests: src/tests/engine.test.ts
- [x] Contracts: contracts/schemas/humaniser-humanisation.schema.json
- [x] AI Flow: src/ai/flows/humaniser-detection-flow.ts
- [x] AI Flow: src/ai/flows/humaniser-rewrite-flow.ts
- [x] Next.js API Route: src/app/api/humaniser/detect/route.ts
- [x] Next.js API Route: src/app/api/humaniser/humanise/route.ts
- [x] Next.js API Route: src/app/api/humaniser/report/route.ts
- [x] Dashboard Page: src/app/dashboard/humaniser/page.tsx
- [x] Dashboard Layout: src/app/dashboard/humaniser/layout.tsx
- [x] UI Component: src/components/humaniser/humaniser-panel.tsx
- [x] UI Component: src/components/humaniser/detection-result.tsx
- [x] UI Component: src/components/humaniser/rewrite-comparison.tsx
- [x] UI Component: src/components/humaniser/highlighted-text.tsx
- [x] UI Component: src/components/humaniser/score-gauge.tsx
- [x] Module README: modules/mycodexvantaos-ai-humaniser/README.md
- [x] Examples: examples/basic-detection.ts
- [x] Examples: examples/detect-and-rewrite.ts
- [x] Examples: examples/batch-analysis.ts
- [x] Update: service-categories.yaml (add humaniser to ai category)
- [x] Validate: no conflicts with existing repo structure
- [ ] Push to feature branch
