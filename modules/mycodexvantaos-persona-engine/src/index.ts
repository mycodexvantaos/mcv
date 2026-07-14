/**
 * MyCodexVantaOS Persona Engine
 *
 * Main entry point for the persona engine module.
 * URN: urn:mycodexvantaos:module:persona-engine
 *
 * @version 1.0.0
 */

// Core Types
export * from './types';

// Core Components
export { SemanticMaskDetector } from './core/semantic-mask-detector';
export type { MaskDetectionResult, DetectedMask } from './core/semantic-mask-detector';

export { RootCauseAnalyzer } from './core/root-cause-analyzer';
export type {
  AnalysisContext,
  LayerAnalysis,
  CompleteAnalysisResult,
} from './core/root-cause-analyzer';

export { SolutionGenerator } from './core/solution-generator';
export type {
  SolutionContext,
  SolutionConstraints,
  SolutionPreferences,
  SolutionGenerationResult,
} from './core/solution-generator';

export { PersonaEngine } from './core/persona-engine';
export type {
  PersonaEngineConfig,
  PersonaProcessingResult,
  PersonaResponse,
} from './core/persona-engine';

export {
  PersonaManager,
  getDefaultPersonaManager,
  resetDefaultPersonaManager,
} from './core/persona-manager';
export type { PersonaManagerConfig } from './core/persona-manager';

export { OrchestratorAdapter } from './core/orchestrator-adapter';
export type {
  OrchestratorAdapterConfig,
  OrchestratorRequest,
  OrchestratorResponse,
  AdapterEvent,
  AdapterEventListener,
} from './core/orchestrator-adapter';

// Enhanced Components
export { PersonaCacheManager } from './core/persona-cache-manager';
export type {
  CacheEntry,
  CacheStatistics,
  CacheManagerConfig,
  CacheEvent,
  CacheEventListener,
} from './core/persona-cache-manager';

export { PersonaValidator } from './core/persona-validator';
export type {
  ValidationSeverity,
  ValidationIssue,
  ValidationResult,
  ValidationOptions,
} from './core/persona-validator';

export { BehavioralAdjuster } from './core/behavioral-adjuster';
export type {
  AdjustmentContext,
  AdjustmentRule,
  AdjustmentResult,
  BehavioralAdjusterConfig,
} from './core/behavioral-adjuster';

// Integration
export {
  PersonaOrchestratorIntegration,
  createIntegration,
} from './integration/orchestrator-integration';
export type {
  IntegrationConfig,
  AgentRegistration,
  OrchestratorTask,
  TaskResult,
} from './integration/orchestrator-integration';

// Version info
export const PERSONA_ENGINE_VERSION = '1.0.0';
export const PERSONA_ENGINE_URN = 'urn:mycodexvantaos:module:persona-engine';
