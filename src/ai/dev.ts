import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-architecture-for-risks.ts';
import '@/ai/flows/generate-ci-cd-pipeline.ts';
import '@/ai/flows/validate-and-suggest-checklists.ts';
import '@/ai/flows/suggest-architecture-refinements-flow.ts';
import '@/ai/flows/global-pulse-sensing.ts';
import '@/ai/flows/zero-shot-tool-forge.ts';
import '@/ai/flows/advanced-analysis-flow.ts';
