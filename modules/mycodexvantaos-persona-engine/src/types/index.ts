/**
 * MyCodeXvantaOS Persona Engine - Type Definitions
 *
 * Core type definitions for the persona system aligned with MyCodeXvantaOS specifications.
 * URN Format: urn:mycodexvantaos:persona:{identifier}
 */

// ============================================================================
// Core Persona Types
// ============================================================================

/**
 * Persona archetype defines the fundamental approach and behavior pattern
 */
export type PersonaArchetype =
  | 'disrupter' // Challenging assumptions, provocative analysis
  | 'analyst' // Deep analytical thinking, data-driven insights
  | 'mediator' // Balance-seeking, conflict resolution
  | 'architect' // System design, structural thinking
  | 'critic' // Critical evaluation, quality assurance
  | 'creative_thinker' // Innovative solutions, out-of-box thinking
  | 'facilitator' // Process guidance, collaboration enablement
  | 'mentor' // Teaching, guidance, knowledge transfer
  | 'synthesizer'; // Integration, pattern recognition, holistic view

/**
 * Response style for interaction patterns
 */
export type ResponseStyle = 'direct' | 'diplomatic' | 'analytical' | 'provocative' | 'supportive';

/**
 * Engagement level for persona interactions
 */
export type EngagementLevel = 'passive' | 'reactive' | 'proactive' | 'aggressive';

/**
 * Feedback approach style
 */
export type FeedbackApproach = 'constructive' | 'critical' | 'balanced' | 'encouraging';

/**
 * Response patterns configuration
 */
export interface ResponsePatterns {
  /** Default response style */
  default_style?: ResponseStyle;
  /** Response length preference */
  length_preference?: 'concise' | 'normal' | 'detailed';
  /** Tone adjustments */
  tone_adjustments?: Record<string, number>;
  /** Format preferences */
  format_preferences?: string[];
  /** Opening style for responses */
  opening_style?: string;
  /** Analytical framework to use */
  analytical_framework?: string;
  /** Conclusion style for responses */
  conclusion_style?: string;
}

/**
 * Governance configuration for persona
 */
export interface GovernanceConfig {
  /** Whether governance is enabled */
  enabled?: boolean;
  /** Required approvals for actions */
  required_approvals?: string[];
  /** Audit level */
  audit_level?: 'none' | 'basic' | 'full';
  /** Compliance rules */
  compliance_rules?: Record<string, boolean>;
  /** Governance tier level */
  tier?: number;
  hitl_checkpoint?: boolean;
  audit_required?: boolean;
  /** Governance constraints */
  constraints?: Record<string, boolean>;
}

/**
 * Memory configuration type
 */
export type MemoryType = 'sliding_window' | 'summary' | 'vector_store';

// ============================================================================
// Behavioral Parameters
// ============================================================================

/**
 * Quantifiable behavioral parameters (0-1 scale)
 * These control how the persona behaves and responds
 */
export interface BehavioralParameters {
  /** Tendency to provoke intellectual discourse */
  intellectual_provocation?: number;
  /** Intensity of critical analysis */
  critical_intensity?: number;
  /** Tendency toward constructive solutions */
  constructive_orientation?: number;
  /** Level of empathy in communication */
  empathy_level?: number;
  /** Depth of analysis applied to problems */
  analytical_depth?: number;
  /** Focus on generating actionable solutions */
  solution_focus?: number;
  /** Clarity and directness in communication */
  communication_clarity?: number;
  /** Ability to adapt approach based on context */
  adaptability?: number;
  /** Commitment to truth-telling */
  truth_commitment?: number;
  /** Practical wisdom in application */
  practical_wisdom?: number;
  /** Sarcasm intensity (should be controlled) */
  sarcasm_intensity?: number;
  /** Cognitive challenge level */
  cognitive_challenge?: number;
  /** Reality questioning tendency */
  reality_questioning?: number;
  /** Psychological penetration depth */
  psychological_penetration?: number;
  /** Tolerance for critical feedback */
  critical_tolerance?: number;
  /** Directness in communication style */
  directness?: number;
  /** Preference for abstract vs concrete thinking */
  abstraction_preference?: number;
  /** Depth of questioning in interactions */
  questioning_depth?: number;
  /** Frequency of introducing contradictions */
  contradiction_frequency?: number;
}

// ============================================================================
// Core Paradigm
// ============================================================================

/**
 * Core paradigm defines the persona's philosophical foundation
 */
export interface CoreParadigm {
  /** Core philosophical approach */
  philosophy: string;
  /** Primary mission statement */
  mission: string;
  /** Unique value this persona provides */
  value_proposition?: string;
  /** Fatal flaw fix description */
  fatal_flaw_fix?: string;
}

// ============================================================================
// Dual Track System
// ============================================================================

/**
 * Track capability definition
 */
export interface TrackCapability {
  name: string;
  function: string;
  capabilities: string[];
}

/**
 * Dual track system for critical + constructive approaches
 */
export interface DualTrackSystem {
  critical_track: TrackCapability;
  constructive_track: TrackCapability;
}

// ============================================================================
// Interaction Patterns
// ============================================================================

/**
 * Conversation style configuration
 */
export interface ConversationStyle {
  frequency?: 'low' | 'medium' | 'high';
  intensity?: 'mild' | 'moderate' | 'strong';
  target_selection?: 'intellectual' | 'emotional' | 'behavioral' | 'comprehensive';
  multi_vector_attack?: boolean;
}

/**
 * Interaction patterns configuration
 */
export interface InteractionPatterns {
  response_style?: ResponseStyle;
  engagement_level?: EngagementLevel;
  feedback_approach?: FeedbackApproach;
  provocation_strategies?: string[];
  conversation_style?: ConversationStyle;
}

// ============================================================================
// Response Protocols
// ============================================================================

/**
 * Response protocols define how persona structures its outputs
 */
export interface ResponseProtocols {
  /** Ratio of critique to solution content (e.g., "1:2") */
  critique_to_solution_ratio?: string;
  /** Minimum depth of solutions provided */
  minimum_solution_depth?: number;
  /** Whether action steps are required in responses */
  action_steps_required?: boolean;
  /** Whether to include follow-up questions */
  follow_up_questions?: boolean;
  /** Whether to track progress */
  progress_tracking?: boolean;
}

// ============================================================================
// Ethical Boundaries
// ============================================================================

/**
 * Ethical boundaries configuration
 */
export interface EthicalBoundaries {
  /** Avoid using sarcasm */
  avoid_sarcasm?: boolean;
  /** No shaming language */
  no_shaming?: boolean;
  /** Respect user autonomy */
  respect_autonomy?: boolean;
  /** Support without creating dependency */
  support_without_dependency?: boolean;
  /** Deliver truth with constructive intent */
  truth_with_constructive_intent?: boolean;
  /** Prevent harm actively */
  harm_prevention?: 'inactive' | 'passive' | 'active' | 'enhanced';
}

// ============================================================================
// Safety Parameters
// ============================================================================

/**
 * Safety parameters for persona operations
 */
export interface SafetyParameters {
  output_filter?: 'standard' | 'enhanced' | 'strict';
  stability_monitoring?: boolean;
  ethical_boundary?: 'relaxed' | 'maintained' | 'strict';
  harm_prevention?: 'inactive' | 'passive' | 'active' | 'enhanced';
}

// ============================================================================
// Memory Configuration
// ============================================================================

/**
 * Memory configuration for persona context retention
 */
export interface MemoryConfig {
  type: MemoryType;
  max_tokens?: number;
  compression_enabled?: boolean;
  context_window?: number;
}

// ============================================================================
// Quality Metrics
// ============================================================================

/**
 * Quality metrics thresholds
 */
export interface QualityMetrics {
  solution_quality?: number;
  actionability?: number;
  empathy_in_delivery?: number;
  precision_level?: number;
  reframing_intensity?: number;
  [key: string]: number | undefined;
}

// ============================================================================
// Metadata
// ============================================================================

/**
 * Persona metadata
 */
export interface PersonaMetadata {
  created_at?: string;
  updated_at?: string;
  author?: string;
  tags?: string[];
  version_history?: string[];
}

// ============================================================================
// Core Persona Profile
// ============================================================================

/**
 * Complete persona profile definition
 * Aligned with MyCodeXvantaOS specification
 */
export interface PersonaProfile {
  /** Unique resource identifier (urn:mycodexvantaos:persona:{id}) */
  urn: string;
  /** Display name */
  name: string;
  /** Semantic version */
  version: string;
  /** Brief description */
  description?: string;
  /** Core archetype */
  archetype: PersonaArchetype;
  /** Core paradigm (philosophy, mission, value) */
  core_paradigm?: CoreParadigm;
  /** Dual track system (critical + constructive) */
  dual_track_system?: DualTrackSystem;
  /** Behavioral parameters (quantifiable 0-1) */
  behavioral_parameters: BehavioralParameters;
  /** Integrated behavioral parameters */
  integrated_behavioral_parameters?: BehavioralParameters;
  /** Core traits */
  core_traits?: {
    archetype?: string;
    primary_traits?: string[];
    secondary_traits?: string[];
  };
  /** Permitted capabilities */
  permitted_capabilities?: string[];
  /** Restricted capabilities */
  restricted_capabilities?: string[];
  /** Interaction patterns */
  interaction_patterns?: InteractionPatterns;
  /** Response protocols */
  response_protocols?: ResponseProtocols;
  /** Ethical boundaries */
  ethical_boundaries?: EthicalBoundaries;
  /** Safety parameters */
  safety_parameters?: SafetyParameters;
  /** Quality metrics */
  quality_metrics?: QualityMetrics;
  /** Memory configuration */
  memory_config?: MemoryConfig;
  /** Governance tier (-1 to 3) */
  governance_tier?: number;
  /** Governance configuration */
  governance?: GovernanceConfig;
  /** Response patterns */
  response_patterns?: ResponsePatterns;
  /** Core functions */
  core_functions?: Record<string, CoreFunction>;
  /** Metadata */
  metadata?: PersonaMetadata;
}

/**
 * Core function definition for persona capabilities
 */
export interface CoreFunction {
  description: string;
  precision_level?: number;
  detection_patterns?: string[];
  solution_integration?: string;
  reframing_intensity?: number;
  truth_exposure_level?: string;
  examples?: ReframingExample[];
  diagnosis_depth?: string;
  analysis_layers?: string[];
  solution_types?: SolutionType[];
  guidance_framework?: Record<string, string>;
}

/**
 * Reframing example for reality alignment
 */
export interface ReframingExample {
  input: string;
  truth_exposure: string;
  constructive_solution: string;
}

/**
 * Solution type definition
 */
export interface SolutionType {
  type: string;
  description: string;
  tools: string[];
}

// ============================================================================
// Semantic Mask Types
// ============================================================================

/**
 * Semantic mask type enumeration
 */
export type SemanticMaskType =
  | 'comforting_platitude' // 正念安慰句式
  | 'vague_healing_language' // 模糊療癒語言
  | 'psychological_jargon_misuse' // 心理學術語誤用
  | 'emotional_avoidance' // 情緒迴避語句
  | 'responsibility_transfer' // 責任轉移表達
  | 'reality_denial' // 現實否認結構
  | 'self_deception' // 自我欺騙模式
  | 'cognitive_dissonance_mask'; // 認知失調掩飾

/**
 * Truth reframe configuration
 */
export interface TruthReframe {
  pattern_name: string;
  truth_exposure: string;
  constructive_alternative: string;
  follow_up_question?: string;
}

/**
 * Semantic mask definition
 */
export interface SemanticMask {
  /** Unique resource identifier */
  urn: string;
  /** Mask type */
  mask_type: SemanticMaskType;
  /** Display name */
  name: string;
  /** Description */
  description?: string;
  /** Detection patterns (regex or phrases) */
  patterns: string[];
  /** Truth reframe configurations */
  truth_reframe: TruthReframe;
  /** Detection precision */
  precision?: number;
  /** Severity level */
  severity?: 'low' | 'medium' | 'high';
}

// ============================================================================
// Root Cause Analysis Types
// ============================================================================

/**
 * Root cause analysis layer
 */
export type AnalysisLayer =
  | 'surface_symptoms' // 表面症狀識別
  | 'behavioral_patterns' // 行為模式分析
  | 'cognitive_structures' // 認知結構檢查
  | 'emotional_drivers' // 情感驅動探索
  | 'core_beliefs' // 核心信念挖掘
  | 'root_causes'; // 創傷根源定位

/**
 * Root cause diagnosis result
 */
export interface RootCauseDiagnosis {
  layer: AnalysisLayer;
  findings: string[];
  confidence: number;
  connections?: string[];
  recommended_actions?: string[];
}

// ============================================================================
// Solution Types
// ============================================================================

/**
 * Solution category
 */
export type SolutionCategory =
  | 'cognitive_restructuring' // 認知重構方案
  | 'behavioral_action' // 行動方案
  | 'skill_development' // 技能培養方案
  | 'environment_adjustment' // 環境調整方案
  | 'emotional_processing'; // 情感處理方案

/**
 * Solution proposal
 */
export interface SolutionProposal {
  category: SolutionCategory;
  title: string;
  description: string;
  tools: string[];
  action_steps: ActionStep[];
  expected_outcome?: string;
  time_frame?: string;
  success_metrics?: string[];
}

/**
 * Action step for solution execution
 */
export interface ActionStep {
  step_number: number;
  action: string;
  rationale?: string;
  resources_needed?: string[];
  verification_method?: string;
}

// ============================================================================
// Execution Guidance
// ============================================================================

/**
 * Execution guidance framework
 */
export interface ExecutionGuidance {
  current_state: string;
  target_state: string;
  key_obstacles: string[];
  action_steps: ActionStep[];
  checkpoints: string[];
  time_frame: string;
  contingency_plans?: string[];
}

// ============================================================================
// Persona Session Types
// ============================================================================

/**
 * Persona session state
 */
export interface PersonaSession {
  session_id: string;
  persona_urn: string;
  created_at: string;
  context: Record<string, unknown>;
  history: PersonaInteraction[];
  current_state: 'active' | 'paused' | 'completed';
}

/**
 * Persona interaction record
 */
export interface PersonaInteraction {
  timestamp: string;
  input: string;
  detected_masks?: SemanticMask[];
  diagnosis?: RootCauseDiagnosis[];
  solutions?: SolutionProposal[];
  response: string;
  follow_up_questions?: string[];
}

// ============================================================================
// Events and Notifications
// ============================================================================

/**
 * Persona event types
 */
export type PersonaEventType =
  | 'mask_detected'
  | 'diagnosis_completed'
  | 'solution_generated'
  | 'guidance_provided'
  | 'session_started'
  | 'session_ended';

/**
 * Persona event
 */
export interface PersonaEvent {
  type: PersonaEventType;
  timestamp: string;
  persona_urn: string;
  session_id?: string;
  data: Record<string, unknown>;
}

// ============================================================================
// Export all types
