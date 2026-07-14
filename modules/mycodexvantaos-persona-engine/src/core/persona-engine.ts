/**
 * MyCodexVantaOS Persona Engine - Main Engine
 *
 * Integrates all persona components for comprehensive analysis and solution generation.
 * URN: urn:mycodexvantaos:core:persona-engine
 */

import type {
  PersonaProfile,
  PersonaArchetype,
  PersonaSession,
  PersonaInteraction,
  SemanticMask,
  RootCauseDiagnosis,
  SolutionProposal,
  BehavioralParameters,
  EthicalBoundaries,
  ResponseProtocols,
} from '../types';

import { SemanticMaskDetector, MaskDetectionResult } from './semantic-mask-detector';
import { RootCauseAnalyzer, AnalysisContext, CompleteAnalysisResult } from './root-cause-analyzer';
import { SolutionGenerator, SolutionContext, SolutionGenerationResult } from './solution-generator';

/**
 * Persona engine configuration
 */
export interface PersonaEngineConfig {
  persona: PersonaProfile;
  customMasks?: SemanticMask[];
  minDiagnosisConfidence?: number;
  maxSolutionsPerResponse?: number;
}

/**
 * Processing result from the persona engine
 */
export interface PersonaProcessingResult {
  input: string;
  persona_urn: string;
  timestamp: string;
  mask_detection?: MaskDetectionResult;
  analysis?: CompleteAnalysisResult;
  solutions?: SolutionGenerationResult;
  response: PersonaResponse;
  follow_up_questions: string[];
  session_id: string;
  /** Detected semantic masks */
  masks?: SemanticMask[];
  /** Root cause diagnosis */
  diagnosis?: RootCauseDiagnosis;
  /** Generated solutions array */
  solutionsArray?: SolutionProposal[];
}

/**
 * Generated response from persona
 */
export interface PersonaResponse {
  style: 'critical' | 'constructive' | 'balanced' | 'integrated';
  content: string;
  critique_section?: string;
  solution_section?: string;
  action_steps?: string[];
  tone: string;
  confidence: number;
  /** Critical track content */
  criticalTrack?: string;
  /** Constructive track content */
  constructiveTrack?: string;
}

/**
 * PersonaEngine class
 * Main engine integrating mask detection, analysis, and solution generation
 */
export class PersonaEngine {
  private persona: PersonaProfile;
  private maskDetector: SemanticMaskDetector;
  private rootCauseAnalyzer: RootCauseAnalyzer;
  private solutionGenerator: SolutionGenerator;
  private sessions: Map<string, PersonaSession>;
  private config: Required<Omit<PersonaEngineConfig, 'persona' | 'customMasks'>> & {
    customMasks?: SemanticMask[];
  };

  constructor(config: PersonaEngineConfig) {
    this.persona = config.persona;
    this.config = {
      minDiagnosisConfidence: config.minDiagnosisConfidence ?? 0.6,
      maxSolutionsPerResponse: config.maxSolutionsPerResponse ?? 3,
      customMasks: config.customMasks,
    };

    // Initialize components
    this.maskDetector = new SemanticMaskDetector(config.customMasks);
    this.rootCauseAnalyzer = new RootCauseAnalyzer(this.config.minDiagnosisConfidence);
    this.solutionGenerator = new SolutionGenerator();
    this.sessions = new Map();
  }

  /**
   * Get the persona profile
   */
  getPersona(): PersonaProfile {
    return this.persona;
  }

  /**
   * Get persona behavioral parameters
   */
  getBehavioralParameters(): BehavioralParameters {
    return this.persona.behavioral_parameters;
  }

  /**
   * Get persona ethical boundaries
   */
  getEthicalBoundaries(): EthicalBoundaries {
    return this.persona.ethical_boundaries || {};
  }

  /**
   * Get response protocols
   */
  getResponseProtocols(): ResponseProtocols {
    return this.persona.response_protocols || {};
  }

  /**
   * Create a new session
   */
  createSession(): string {
    const sessionId = this.generateSessionId();
    const session: PersonaSession = {
      session_id: sessionId,
      persona_urn: this.persona.urn,
      created_at: new Date().toISOString(),
      context: {},
      history: [],
      current_state: 'active',
    };
    this.sessions.set(sessionId, session);
    return sessionId;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): PersonaSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Process input through the persona engine
   */
  process(input: string, sessionId?: string): PersonaProcessingResult {
    // Create or get session
    const sid = sessionId || this.createSession();
    const session = this.sessions.get(sid);
    if (!session) {
      throw new Error(`Session ${sid} not found`);
    }

    const timestamp = new Date().toISOString();

    // Step 1: Detect semantic masks
    const maskDetection = this.shouldDetectMasks() ? this.maskDetector.detect(input) : undefined;

    // Step 2: Analyze root causes (if persona is analytical)
    let analysis: CompleteAnalysisResult | undefined;
    if (this.shouldAnalyzeRootCauses()) {
      const context = this.rootCauseAnalyzer.initializeAnalysis(input);

      // Use detected masks to inform analysis
      if (maskDetection?.detected) {
        const initialFindings = maskDetection.masks.map(
          (m) => `Detected ${m.mask.name}: ${m.truth_reframe.truth_exposure}`
        );
        this.rootCauseAnalyzer.recordFindings(
          context,
          'surface_symptoms',
          initialFindings,
          maskDetection.masks.map((m) => m.matched_pattern),
          [],
          []
        );
      }

      analysis = this.rootCauseAnalyzer.generateResult(context);
    }

    // Step 3: Generate solutions (if persona is solution-focused)
    let solutions: SolutionGenerationResult | undefined;
    if (this.shouldGenerateSolutions() && analysis) {
      const solutionContext: SolutionContext = {
        problem: input,
        diagnosis: analysis.diagnosis,
        constraints: {
          maximum_solutions: this.config.maxSolutionsPerResponse,
        },
        preferences: {
          preferred_approach: this.getPreferredApproach(),
          urgency: 'medium',
        },
      };
      solutions = this.solutionGenerator.generate(solutionContext);
    }

    // Step 4: Generate persona response
    const response = this.generateResponse(input, maskDetection, analysis, solutions);

    // Step 5: Generate follow-up questions
    const followUpQuestions = this.generateFollowUpQuestions(maskDetection, analysis, solutions);

    // Record interaction in session
    const interaction: PersonaInteraction = {
      timestamp,
      input,
      detected_masks: maskDetection?.masks.map((m) => m.mask),
      diagnosis: analysis?.diagnosis,
      solutions: solutions?.solutions,
      response: response.content,
      follow_up_questions: followUpQuestions,
    };
    session.history.push(interaction);

    return {
      input,
      persona_urn: this.persona.urn,
      timestamp,
      mask_detection: maskDetection,
      analysis,
      solutions,
      response,
      follow_up_questions: followUpQuestions,
      session_id: sid,
    };
  }

  /**
   * Check if mask detection should be performed
   */
  private shouldDetectMasks(): boolean {
    const params = this.persona.behavioral_parameters;
    return (params.truth_commitment ?? 0.5) > 0.3 || (params.critical_intensity ?? 0.5) > 0.3;
  }

  /**
   * Check if root cause analysis should be performed
   */
  private shouldAnalyzeRootCauses(): boolean {
    const params = this.persona.behavioral_parameters;
    return (params.analytical_depth ?? 0.5) > 0.4;
  }

  /**
   * Check if solutions should be generated
   */
  private shouldGenerateSolutions(): boolean {
    const params = this.persona.behavioral_parameters;
    return (params.constructive_orientation ?? 0.5) > 0.3 || (params.solution_focus ?? 0.5) > 0.3;
  }

  /**
   * Get preferred approach based on behavioral parameters
   */
  private getPreferredApproach(): 'structured' | 'flexible' | 'intensive' {
    const params = this.persona.behavioral_parameters;
    const depth = params.analytical_depth ?? 0.5;

    if (depth > 0.7) return 'intensive';
    if (depth > 0.4) return 'structured';
    return 'flexible';
  }

  /**
   * Generate persona response
   */
  private generateResponse(
    input: string,
    maskDetection?: MaskDetectionResult,
    analysis?: CompleteAnalysisResult,
    solutions?: SolutionGenerationResult
  ): PersonaResponse {
    const archetype = this.persona.archetype;
    const params = this.persona.behavioral_parameters;
    const protocols = this.getResponseProtocols();

    // Determine response style based on archetype and detected content
    const style = this.determineResponseStyle(archetype, maskDetection);

    // Build response content
    const content = this.buildResponseContent(input, maskDetection, analysis, solutions, style);

    // Extract action steps if solutions available
    const actionSteps = solutions?.solutions
      .flatMap((s) => s.action_steps.map((a) => a.action))
      .slice(0, 5);

    // Calculate confidence
    const confidence = this.calculateResponseConfidence(maskDetection, analysis, solutions);

    return {
      style,
      content,
      critique_section:
        style === 'critical' || style === 'integrated'
          ? this.buildCritiqueSection(maskDetection, analysis)
          : undefined,
      solution_section:
        style === 'constructive' || style === 'integrated'
          ? this.buildSolutionSection(solutions)
          : undefined,
      action_steps: actionSteps,
      tone: this.determineTone(params),
      confidence,
    };
  }

  /**
   * Determine response style
   */
  private determineResponseStyle(
    archetype: PersonaArchetype,
    maskDetection?: MaskDetectionResult
  ): 'critical' | 'constructive' | 'balanced' | 'integrated' {
    const params = this.persona.behavioral_parameters;
    const criticalIntensity = params.critical_intensity ?? 0.5;
    const constructiveOrientation = params.constructive_orientation ?? 0.5;

    // If masks detected with high severity, lean toward critical
    if (maskDetection && maskDetection.total_severity > 5) {
      if (constructiveOrientation > 0.6) return 'integrated';
      return 'critical';
    }

    // Balance based on behavioral parameters
    if (criticalIntensity > 0.6 && constructiveOrientation > 0.6) return 'integrated';
    if (criticalIntensity > constructiveOrientation) return 'critical';
    if (constructiveOrientation > criticalIntensity) return 'constructive';
    return 'balanced';
  }

  /**
   * Build response content
   */
  private buildResponseContent(
    input: string,
    maskDetection: MaskDetectionResult | undefined,
    analysis: CompleteAnalysisResult | undefined,
    solutions: SolutionGenerationResult | undefined,
    style: 'critical' | 'constructive' | 'balanced' | 'integrated'
  ): string {
    const sections: string[] = [];

    // Opening based on archetype
    sections.push(this.getOpeningStatement());

    // Add critique section if relevant
    if ((style === 'critical' || style === 'integrated') && maskDetection?.detected) {
      sections.push(this.buildCritiqueSection(maskDetection, analysis));
    }

    // Add analysis section if available
    if (analysis && style !== 'constructive') {
      sections.push(this.buildAnalysisSection(analysis));
    }

    // Add solution section if relevant
    if ((style === 'constructive' || style === 'integrated') && solutions) {
      sections.push(this.buildSolutionSection(solutions));
    }

    // Closing
    sections.push(this.getClosingStatement());

    return sections.filter((s) => s.length > 0).join('\n\n');
  }

  /**
   * Get opening statement based on archetype
   */
  private getOpeningStatement(): string {
    const archetype = this.persona.archetype;
    const openings: Record<PersonaArchetype, string> = {
      disrupter: 'Let me examine this directly.',
      analyst: 'Let me analyze this systematically.',
      mediator: 'I want to understand both sides of this.',
      architect: 'Let me look at the structure of this situation.',
      critic: 'I have some observations about this.',
      creative_thinker: 'Let me offer a different perspective.',
      facilitator: 'Let me help you work through this.',
      mentor: 'Let me share some thoughts that might help.',
      synthesizer: 'Let me integrate these ideas together.',
    };

    return openings[archetype] || 'Let me consider this.';
  }

  /**
   * Get closing statement
   */
  private getClosingStatement(): string {
    const params = this.persona.behavioral_parameters;

    if ((params.solution_focus ?? 0) > 0.6) {
      return 'What would you like to explore first?';
    }

    if ((params.critical_intensity ?? 0) > 0.6) {
      return 'Consider what resonates with you from this analysis.';
    }

    return "Let me know if you'd like to explore any aspect further.";
  }

  /**
   * Build critique section
   */
  private buildCritiqueSection(
    maskDetection?: MaskDetectionResult,
    analysis?: CompleteAnalysisResult
  ): string {
    const parts: string[] = [];

    if (maskDetection?.detected) {
      parts.push('### Observations\n');
      for (const detected of maskDetection.masks.slice(0, 3)) {
        parts.push(`- **${detected.mask.name}**: ${detected.truth_reframe.truth_exposure}`);
      }
    }

    if (analysis && analysis.diagnosis.length > 0) {
      parts.push('\n### Analysis\n');
      for (const d of analysis.diagnosis.slice(0, 2)) {
        if (d.findings.length > 0) {
          parts.push(`- ${d.findings[0]}`);
        }
      }
    }

    return parts.join('\n');
  }

  /**
   * Build analysis section
   */
  private buildAnalysisSection(analysis: CompleteAnalysisResult): string {
    const parts: string[] = ['### Deeper Analysis\n'];

    for (const diagnosis of analysis.diagnosis) {
      if (diagnosis.confidence > 0.5 && diagnosis.findings.length > 0) {
        parts.push(`**${diagnosis.layer.replace(/_/g, ' ')}**:`);
        parts.push(diagnosis.findings.map((f) => `  - ${f}`).join('\n'));
      }
    }

    if (analysis.root_causes && analysis.root_causes.length > 0) {
      parts.push('\n**Potential root causes**:');
      parts.push(analysis.root_causes.map((r) => `  - ${r}`).join('\n'));
    }

    return parts.join('\n');
  }

  /**
   * Build solution section
   */
  private buildSolutionSection(solutions?: SolutionGenerationResult): string {
    if (!solutions || solutions.solutions.length === 0) {
      return '';
    }

    const parts: string[] = ['### Suggested Approaches\n'];

    for (let i = 0; i < Math.min(solutions.solutions.length, 3); i++) {
      const solution = solutions.solutions[i];
      parts.push(`\n**${i + 1}. ${solution.title}** (${solution.category.replace(/_/g, ' ')})`);
      parts.push(solution.description);

      if (solution.action_steps.length > 0) {
        parts.push('\nFirst steps:');
        for (const step of solution.action_steps.slice(0, 2)) {
          parts.push(`  ${step.step_number}. ${step.action}`);
        }
      }
    }

    return parts.join('\n');
  }

  /**
   * Determine tone based on behavioral parameters
   */
  private determineTone(params: BehavioralParameters): string {
    const empathy = params.empathy_level ?? 0.5;
    const clarity = params.communication_clarity ?? 0.5;
    const critical = params.critical_intensity ?? 0.5;

    if (empathy > 0.7 && critical < 0.4) return 'supportive';
    if (critical > 0.7 && empathy < 0.4) return 'direct';
    if (clarity > 0.7) return 'clear and direct';
    return 'balanced';
  }

  /**
   * Calculate response confidence
   */
  private calculateResponseConfidence(
    maskDetection?: MaskDetectionResult,
    analysis?: CompleteAnalysisResult,
    solutions?: SolutionGenerationResult
  ): number {
    let confidence = 0.5;

    if (maskDetection?.detected) {
      confidence += 0.1 * Math.min(maskDetection.masks.length, 3);
    }

    if (analysis) {
      confidence += 0.15 * Math.min(analysis.confidence, 1);
    }

    if (solutions && solutions.solutions.length > 0) {
      confidence += 0.1 * Math.min(solutions.solutions.length, 3);
    }

    return Math.min(confidence, 1);
  }

  /**
   * Generate follow-up questions
   */
  private generateFollowUpQuestions(
    maskDetection?: MaskDetectionResult,
    analysis?: CompleteAnalysisResult,
    solutions?: SolutionGenerationResult
  ): string[] {
    const questions: string[] = [];

    // Questions from mask detection
    if (maskDetection?.detected) {
      for (const detected of maskDetection.masks.slice(0, 2)) {
        if (detected.truth_reframe.follow_up_question) {
          questions.push(detected.truth_reframe.follow_up_question);
        }
      }
    }

    // Questions from analysis
    if (analysis && analysis.next_questions.length > 0) {
      questions.push(...analysis.next_questions.slice(0, 2));
    }

    // Questions from solutions
    if (solutions && solutions.solutions.length > 0) {
      const firstSolution = solutions.solutions[0];
      if (firstSolution.action_steps.length > 0) {
        questions.push(`How ready do you feel to try "${firstSolution.action_steps[0].action}"?`);
      }
    }

    // Default questions if none generated
    if (questions.length === 0) {
      questions.push('What aspect of this would you like to explore further?');
    }

    return questions.slice(0, 3);
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * End a session
   */
  endSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.current_state = 'completed';
      return true;
    }
    return false;
  }

  /**
   * Get session summary
   */
  getSessionSummary(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) return 'Session not found';

    const interactionCount = session.history.length;
    const masksDetected = session.history.flatMap((h) => h.detected_masks || []).length;
    const solutionsProposed = session.history.flatMap((h) => h.solutions || []).length;

    return (
      `Session ${sessionId}\n` +
      `Persona: ${this.persona.name}\n` +
      `Interactions: ${interactionCount}\n` +
      `Masks detected: ${masksDetected}\n` +
      `Solutions proposed: ${solutionsProposed}`
    );
  }

  /**
   * Export session data
   */
  exportSession(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) return '';

    return JSON.stringify(
      {
        session,
        persona: {
          urn: this.persona.urn,
          name: this.persona.name,
          archetype: this.persona.archetype,
        },
      },
      null,
      2
    );
  }
}

export default PersonaEngine;
