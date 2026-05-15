/**
 * MyCodeXvantaOS Persona Engine - Root Cause Analyzer
 *
 * Analyzes problems through multiple layers to identify root causes.
 * URN: urn:mycodexvantaos:core:root-cause-analyzer
 */

import type { AnalysisLayer, RootCauseDiagnosis, ActionStep, SolutionCategory } from '../types';

/**
 * Analysis layer configuration
 */
interface LayerConfig {
  name: string;
  description: string;
  probing_questions: string[];
  indicators: string[];
  depth_level: number;
}

/**
 * Default analysis layers configuration
 */
const ANALYSIS_LAYERS: Record<AnalysisLayer, LayerConfig> = {
  surface_symptoms: {
    name: '表面症狀識別',
    description: 'Identifying visible symptoms and immediate manifestations',
    probing_questions: [
      'What specifically is happening?',
      'When does this occur?',
      'What do you observe directly?',
      'How does this manifest in your daily life?',
    ],
    indicators: [
      'observable_behavior',
      'reported_feelings',
      'situational_triggers',
      'immediate_consequences',
    ],
    depth_level: 1,
  },
  behavioral_patterns: {
    name: '行為模式分析',
    description: 'Analyzing recurring patterns and habits',
    probing_questions: [
      'How often does this happen?',
      'Is there a pattern to when this occurs?',
      'What behaviors consistently accompany this?',
      'What have you tried before?',
    ],
    indicators: ['frequency', 'triggers', 'routine_associations', 'past_attempts'],
    depth_level: 2,
  },
  cognitive_structures: {
    name: '認知結構檢查',
    description: 'Examining thought patterns and mental frameworks',
    probing_questions: [
      'What thoughts come up when this happens?',
      'What beliefs underlie this reaction?',
      'How do you interpret this situation?',
      'What assumptions are you making?',
    ],
    indicators: [
      'automatic_thoughts',
      'core_beliefs',
      'cognitive_distortions',
      'interpretation_patterns',
    ],
    depth_level: 3,
  },
  emotional_drivers: {
    name: '情感驅動探索',
    description: 'Exploring emotional motivations and drivers',
    probing_questions: [
      'What emotions arise with this?',
      'What feeling are you avoiding?',
      'What would you feel if this changed?',
      'What emotional need is unmet?',
    ],
    indicators: ['primary_emotions', 'avoided_emotions', 'emotional_needs', 'emotional_history'],
    depth_level: 4,
  },
  core_beliefs: {
    name: '核心信念挖掘',
    description: 'Uncovering fundamental beliefs about self and world',
    probing_questions: [
      'What does this say about who you are?',
      'What would it mean if this were true?',
      'What rule or standard are you applying?',
      'Where did this belief come from?',
    ],
    indicators: ['self_concept', 'world_assumptions', 'value_conflicts', 'origin_memories'],
    depth_level: 5,
  },
  root_causes: {
    name: '創傷根源定位',
    description: 'Identifying original sources and foundational experiences',
    probing_questions: [
      'When did this pattern first appear?',
      'What was happening in your life then?',
      "What did you need that you didn't get?",
      'What decision did you make at that time?',
    ],
    indicators: [
      'originating_events',
      'unmet_needs',
      'adaptive_decisions',
      'formative_experiences',
    ],
    depth_level: 6,
  },
};

/**
 * Analysis context containing all gathered information
 */
export interface AnalysisContext {
  original_problem: string;
  layers: Map<AnalysisLayer, LayerAnalysis>;
  current_layer: AnalysisLayer;
  confidence_score: number;
  timestamp: string;
}

/**
 * Analysis for a single layer
 */
export interface LayerAnalysis {
  layer: AnalysisLayer;
  config: LayerConfig;
  findings: string[];
  evidence: string[];
  questions_asked: string[];
  responses: string[];
  confidence: number;
  connections_to_other_layers: string[];
}

/**
 * Complete analysis result
 */
export interface CompleteAnalysisResult {
  context: AnalysisContext;
  diagnosis: RootCauseDiagnosis[];
  root_causes: string[];
  recommended_focus: AnalysisLayer[];
  next_questions: string[];
  confidence: number;
  summary: string;
}

/**
 * RootCauseAnalyzer class
 * Performs multi-layer analysis to identify root causes
 */
export class RootCauseAnalyzer {
  private layerOrder: AnalysisLayer[] = [
    'surface_symptoms',
    'behavioral_patterns',
    'cognitive_structures',
    'emotional_drivers',
    'core_beliefs',
    'root_causes',
  ];

  private minConfidenceThreshold: number;

  constructor(minConfidenceThreshold: number = 0.6) {
    this.minConfidenceThreshold = minConfidenceThreshold;
  }

  /**
   * Get layer configuration
   */
  getLayerConfig(layer: AnalysisLayer): LayerConfig {
    return ANALYSIS_LAYERS[layer];
  }

  /**
   * Get all layer configurations
   */
  getAllLayerConfigs(): Record<AnalysisLayer, LayerConfig> {
    return { ...ANALYSIS_LAYERS };
  }

  /**
   * Initialize a new analysis context
   */
  initializeAnalysis(problem: string): AnalysisContext {
    return {
      original_problem: problem,
      layers: new Map(),
      current_layer: 'surface_symptoms',
      confidence_score: 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get next probing questions for current layer
   */
  getProbingQuestions(context: AnalysisContext, count: number = 3): string[] {
    const layerConfig = ANALYSIS_LAYERS[context.current_layer];
    const questions: string[] = [];

    // Get questions not yet asked
    for (const question of layerConfig.probing_questions) {
      const layerAnalysis = context.layers.get(context.current_layer);
      if (layerAnalysis && layerAnalysis.questions_asked.includes(question)) {
        continue;
      }
      questions.push(question);
      if (questions.length >= count) break;
    }

    return questions;
  }

  /**
   * Record findings for a layer
   */
  recordFindings(
    context: AnalysisContext,
    layer: AnalysisLayer,
    findings: string[],
    evidence: string[],
    questionsAsked: string[],
    responses: string[]
  ): AnalysisContext {
    const config = ANALYSIS_LAYERS[layer];

    // Calculate confidence based on evidence and findings
    const confidence = this.calculateLayerConfidence(findings, evidence, responses);

    // Find connections to other layers
    const connections = this.findConnections(layer, findings, context);

    const layerAnalysis: LayerAnalysis = {
      layer,
      config,
      findings,
      evidence,
      questions_asked: questionsAsked,
      responses,
      confidence,
      connections_to_other_layers: connections,
    };

    context.layers.set(layer, layerAnalysis);

    // Update overall confidence
    context.confidence_score = this.calculateOverallConfidence(context);

    return context;
  }

  /**
   * Calculate confidence for a single layer
   */
  private calculateLayerConfidence(
    findings: string[],
    evidence: string[],
    responses: string[]
  ): number {
    if (findings.length === 0) return 0;

    const findingScore = Math.min(findings.length / 3, 1) * 0.4;
    const evidenceScore = Math.min(evidence.length / 2, 1) * 0.3;
    const responseScore = responses.filter((r) => r.length > 20).length > 0 ? 0.3 : 0.15;

    return Math.min(findingScore + evidenceScore + responseScore, 1);
  }

  /**
   * Calculate overall analysis confidence
   */
  private calculateOverallConfidence(context: AnalysisContext): number {
    if (context.layers.size === 0) return 0;

    let totalConfidence = 0;
    let totalWeight = 0;

    for (const [layer, analysis] of context.layers) {
      const weight = ANALYSIS_LAYERS[layer].depth_level;
      totalConfidence += analysis.confidence * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalConfidence / totalWeight : 0;
  }

  /**
   * Find connections between layers
   */
  private findConnections(
    layer: AnalysisLayer,
    findings: string[],
    context: AnalysisContext
  ): string[] {
    const connections: string[] = [];

    for (const [otherLayer, analysis] of context.layers) {
      if (otherLayer === layer) continue;

      for (const finding of findings) {
        for (const otherFinding of analysis.findings) {
          if (this.areRelated(finding, otherFinding)) {
            connections.push(`Related to ${otherLayer}: ${otherFinding}`);
          }
        }
      }
    }

    return connections;
  }

  /**
   * Check if two findings are related
   */
  private areRelated(finding1: string, finding2: string): boolean {
    // Simple keyword matching - could be enhanced with NLP
    const words1 = finding1.toLowerCase().split(/\s+/);
    const words2 = finding2.toLowerCase().split(/\s+/);

    const commonWords = words1.filter((w) => w.length > 3 && words2.includes(w));

    return commonWords.length >= 2;
  }

  /**
   * Advance to next layer
   */
  advanceToNextLayer(context: AnalysisContext): AnalysisLayer | null {
    const currentIndex = this.layerOrder.indexOf(context.current_layer);

    if (currentIndex < this.layerOrder.length - 1) {
      context.current_layer = this.layerOrder[currentIndex + 1];
      return context.current_layer;
    }

    return null; // Already at deepest layer
  }

  /**
   * Check if ready to advance to next layer
   */
  isReadyToAdvance(context: AnalysisContext): boolean {
    const currentAnalysis = context.layers.get(context.current_layer);

    if (!currentAnalysis) return false;

    return currentAnalysis.confidence >= this.minConfidenceThreshold;
  }

  /**
   * Generate complete analysis result
   */
  generateResult(context: AnalysisContext): CompleteAnalysisResult {
    const diagnosis: RootCauseDiagnosis[] = [];
    const rootCauses: string[] = [];
    const recommendedFocus: AnalysisLayer[] = [];

    for (const [layer, analysis] of context.layers) {
      diagnosis.push({
        layer,
        findings: analysis.findings,
        confidence: analysis.confidence,
        connections: analysis.connections_to_other_layers,
        recommended_actions: this.generateLayerRecommendations(layer, analysis.findings),
      });

      // Root causes are findings from the deepest analyzed layer
      if (layer === 'root_causes' && analysis.findings.length > 0) {
        rootCauses.push(...analysis.findings);
      }
    }

    // Identify layers needing more attention
    for (const [layer, analysis] of context.layers) {
      if (analysis.confidence < this.minConfidenceThreshold) {
        recommendedFocus.push(layer);
      }
    }

    // Generate next questions
    const nextQuestions = this.generateNextQuestions(context);

    return {
      context,
      diagnosis,
      root_causes: rootCauses,
      recommended_focus: recommendedFocus,
      next_questions: nextQuestions,
      confidence: context.confidence_score,
      summary: this.generateSummary(context, diagnosis),
    };
  }

  /**
   * Generate recommendations for a layer
   */
  private generateLayerRecommendations(layer: AnalysisLayer, findings: string[]): string[] {
    const recommendations: string[] = [];

    const layerRecommendations: Record<AnalysisLayer, string[]> = {
      surface_symptoms: [
        'Track when symptoms occur',
        'Document triggers and context',
        'Rate intensity on a scale',
      ],
      behavioral_patterns: [
        'Identify pattern triggers',
        'Note antecedents and consequences',
        'Track frequency and duration',
      ],
      cognitive_structures: [
        'Challenge automatic thoughts',
        'Examine evidence for beliefs',
        'Consider alternative interpretations',
      ],
      emotional_drivers: [
        'Name the emotions precisely',
        'Explore what emotions are avoided',
        'Connect to emotional needs',
      ],
      core_beliefs: [
        'Identify the origin of beliefs',
        'Test against current reality',
        'Consider alternative beliefs',
      ],
      root_causes: [
        'Process originating experiences',
        'Address unmet needs',
        'Reconsider early decisions',
      ],
    };

    return layerRecommendations[layer] || [];
  }

  /**
   * Generate next probing questions
   */
  private generateNextQuestions(context: AnalysisContext): string[] {
    // First, check if current layer needs more exploration
    const currentAnalysis = context.layers.get(context.current_layer);

    if (currentAnalysis && currentAnalysis.confidence < this.minConfidenceThreshold) {
      return this.getProbingQuestions(context, 3);
    }

    // Otherwise, get questions for the next layer
    const nextLayer = this.advanceToNextLayer(context);
    if (nextLayer) {
      return this.getProbingQuestions(context, 3);
    }

    // If at deepest layer with sufficient confidence, generate synthesis questions
    return [
      'How do these findings connect to each other?',
      'What pattern emerges from this analysis?',
      'What would need to change at the root level?',
    ];
  }

  /**
   * Generate analysis summary
   */
  private generateSummary(context: AnalysisContext, diagnosis: RootCauseDiagnosis[]): string {
    const layerSummaries: string[] = [];

    for (const d of diagnosis) {
      const config = ANALYSIS_LAYERS[d.layer];
      layerSummaries.push(
        `**${config.name}** (confidence: ${(d.confidence * 100).toFixed(0)}%): ${d.findings.join('; ')}`
      );
    }

    return (
      `## Analysis Summary\n\nOriginal Problem: ${context.original_problem}\n\n` +
      `### Layer Analysis\n${layerSummaries.join('\n\n')}\n\n` +
      `### Overall Confidence: ${(context.confidence_score * 100).toFixed(0)}%`
    );
  }

  /**
   * Perform quick analysis (single pass)
   */
  quickAnalyze(problem: string): {
    suggested_layers: AnalysisLayer[];
    initial_questions: Partial<Record<AnalysisLayer, string[]>>;
    hypothesis: string[];
  } {
    const suggestedLayers = this.suggestRelevantLayers(problem);
    const initialQuestions: Partial<Record<AnalysisLayer, string[]>> = {};

    for (const layer of suggestedLayers) {
      initialQuestions[layer] = ANALYSIS_LAYERS[layer].probing_questions.slice(0, 2);
    }

    const hypothesis = this.generateHypotheses(problem, suggestedLayers);

    return {
      suggested_layers: suggestedLayers,
      initial_questions: initialQuestions,
      hypothesis,
    };
  }

  /**
   * Suggest which layers are most relevant based on problem description
   */
  private suggestRelevantLayers(problem: string): AnalysisLayer[] {
    const lowerProblem = problem.toLowerCase();
    const suggested: AnalysisLayer[] = ['surface_symptoms']; // Always start with symptoms

    // Keyword-based layer suggestion
    const layerKeywords: Record<AnalysisLayer, string[]> = {
      surface_symptoms: ['happening', 'when', 'what', 'occur'],
      behavioral_patterns: ['always', 'never', 'every time', 'pattern', 'habit', 'repeat'],
      cognitive_structures: ['think', 'believe', 'assume', 'should', 'must', 'ought'],
      emotional_drivers: ['feel', 'afraid', 'anxious', 'angry', 'sad', 'hurt'],
      core_beliefs: ['worth', 'value', 'deserve', 'identity', 'who i am'],
      root_causes: ['childhood', 'past', 'origin', 'first time', 'started when'],
    };

    for (const [layer, keywords] of Object.entries(layerKeywords)) {
      if (keywords.some((kw) => lowerProblem.includes(kw))) {
        suggested.push(layer as AnalysisLayer);
      }
    }

    // Remove duplicates and return in order
    return this.layerOrder.filter((l) => suggested.includes(l));
  }

  /**
   * Generate initial hypotheses based on problem
   */
  private generateHypotheses(problem: string, layers: AnalysisLayer[]): string[] {
    const hypotheses: string[] = [];

    // Simple hypothesis generation based on patterns
    if (layers.includes('behavioral_patterns')) {
      hypotheses.push('This may be a recurring pattern that serves some function');
    }
    if (layers.includes('cognitive_structures')) {
      hypotheses.push('Underlying beliefs may be driving this behavior');
    }
    if (layers.includes('emotional_drivers')) {
      hypotheses.push('Unprocessed emotions may be a key factor');
    }
    if (layers.includes('core_beliefs')) {
      hypotheses.push('Core beliefs about self may need examination');
    }
    if (layers.includes('root_causes')) {
      hypotheses.push('Early experiences may have established this pattern');
    }

    return hypotheses;
  }

  /**
   * Export analysis for storage or sharing
   */
  exportAnalysis(context: AnalysisContext): string {
    const exportData = {
      problem: context.original_problem,
      timestamp: context.timestamp,
      confidence: context.confidence_score,
      layers: Array.from(context.layers.entries()).map(([layer, analysis]) => ({
        layer,
        findings: analysis.findings,
        confidence: analysis.confidence,
        connections: analysis.connections_to_other_layers,
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import analysis from exported format
   */
  importAnalysis(exported: string): AnalysisContext {
    const data = JSON.parse(exported);
    const context = this.initializeAnalysis(data.problem);
    context.timestamp = data.timestamp;
    context.confidence_score = data.confidence;

    for (const layerData of data.layers) {
      const config = ANALYSIS_LAYERS[layerData.layer as AnalysisLayer];
      context.layers.set(layerData.layer as AnalysisLayer, {
        layer: layerData.layer as AnalysisLayer,
        config,
        findings: layerData.findings,
        evidence: [],
        questions_asked: [],
        responses: [],
        confidence: layerData.confidence,
        connections_to_other_layers: layerData.connections || [],
      });
    }

    return context;
  }
}

export default RootCauseAnalyzer;
