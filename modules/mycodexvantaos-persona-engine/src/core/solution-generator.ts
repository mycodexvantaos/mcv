/**
 * MyCodexVantaOS Persona Engine - Solution Generator
 *
 * Generates actionable solutions based on root cause analysis.
 * URN: urn:mycodexvantaos:core:solution-generator
 */

import type {
  SolutionCategory,
  SolutionProposal,
  ActionStep,
  RootCauseDiagnosis,
  AnalysisLayer,
} from '../types';

/**
 * Solution template for a category
 */
interface SolutionTemplate {
  category: SolutionCategory;
  name: string;
  description: string;
  applicability_criteria: string[];
  tools: string[];
  time_frame_range: {
    min_days: number;
    max_days: number;
  };
}

/**
 * Solution templates library
 */
const SOLUTION_TEMPLATES: SolutionTemplate[] = [
  // Cognitive Restructuring Solutions
  {
    category: 'cognitive_restructuring',
    name: 'Thought Record Practice',
    description: 'Systematic documentation and challenging of automatic thoughts',
    applicability_criteria: ['cognitive_distortions', 'negative_thoughts', 'irrational_beliefs'],
    tools: ['thought_record', 'evidence_examination', 'alternative_thinking'],
    time_frame_range: { min_days: 14, max_days: 90 },
  },
  {
    category: 'cognitive_restructuring',
    name: 'Belief Testing',
    description: 'Experimental testing of core beliefs through behavioral experiments',
    applicability_criteria: ['core_beliefs', 'self_doubt', 'limiting_beliefs'],
    tools: ['behavioral_experiment', 'prediction_testing', 'evidence_gathering'],
    time_frame_range: { min_days: 7, max_days: 30 },
  },
  {
    category: 'cognitive_restructuring',
    name: 'Perspective Taking',
    description: 'Developing alternative viewpoints and interpretations',
    applicability_criteria: ['rigid_thinking', 'black_white_thinking', 'perspective_blindness'],
    tools: ['multiple_perspectives', 'devil_advocate', 'best_friend_test'],
    time_frame_range: { min_days: 7, max_days: 21 },
  },

  // Behavioral Action Solutions
  {
    category: 'behavioral_action',
    name: 'Gradual Exposure',
    description: 'Systematic approach to feared or avoided situations',
    applicability_criteria: ['avoidance', 'fear', 'anxiety', 'phobia'],
    tools: ['exposure_hierarchy', 'fear_ladder', 'gradual_steps'],
    time_frame_range: { min_days: 14, max_days: 90 },
  },
  {
    category: 'behavioral_action',
    name: 'Habit Replacement',
    description: 'Replacing unwanted behaviors with constructive alternatives',
    applicability_criteria: ['bad_habits', 'unwanted_behaviors', 'compulsive_actions'],
    tools: ['habit_stacking', 'implementation_intention', 'environmental_design'],
    time_frame_range: { min_days: 21, max_days: 66 },
  },
  {
    category: 'behavioral_action',
    name: 'Activation Planning',
    description: 'Structured increase in meaningful activities',
    applicability_criteria: ['depression', 'inactivity', 'withdrawal', 'low_motivation'],
    tools: ['activity_scheduling', 'mood_tracking', 'value_aligned_activities'],
    time_frame_range: { min_days: 7, max_days: 28 },
  },

  // Skill Development Solutions
  {
    category: 'skill_development',
    name: 'Communication Skills Training',
    description: 'Developing effective interpersonal communication abilities',
    applicability_criteria: ['relationship_issues', 'conflict', 'assertiveness_needed'],
    tools: ['active_listening', 'i_statements', 'assertive_communication'],
    time_frame_range: { min_days: 14, max_days: 60 },
  },
  {
    category: 'skill_development',
    name: 'Emotional Regulation Skills',
    description: 'Building capacity to manage and respond to emotions effectively',
    applicability_criteria: ['emotional_dysregulation', 'impulsivity', 'mood_swings'],
    tools: ['grounding_techniques', 'opposite_action', 'tipp_skills'],
    time_frame_range: { min_days: 21, max_days: 90 },
  },
  {
    category: 'skill_development',
    name: 'Problem-Solving Training',
    description: 'Structured approach to identifying and solving problems',
    applicability_criteria: ['decision_making', 'problem_avoidance', 'analysis_paralysis'],
    tools: ['problem_definition', 'brainstorming', 'pros_cons_analysis'],
    time_frame_range: { min_days: 7, max_days: 21 },
  },

  // Environment Adjustment Solutions
  {
    category: 'environment_adjustment',
    name: 'Support System Building',
    description: 'Developing and maintaining a network of supportive relationships',
    applicability_criteria: ['isolation', 'lack_of_support', 'loneliness'],
    tools: ['relationship_mapping', 'connection_planning', 'boundary_setting'],
    time_frame_range: { min_days: 30, max_days: 180 },
  },
  {
    category: 'environment_adjustment',
    name: 'Environment Restructuring',
    description: 'Modifying physical and social environments to support goals',
    applicability_criteria: ['environmental_triggers', 'unsupportive_environment', 'distractions'],
    tools: ['environmental_audit', 'trigger_removal', 'cues_design'],
    time_frame_range: { min_days: 3, max_days: 14 },
  },
  {
    category: 'environment_adjustment',
    name: 'Boundary Implementation',
    description: 'Establishing and maintaining healthy boundaries',
    applicability_criteria: ['boundary_issues', 'people_pleasing', 'overcommitment'],
    tools: ['boundary_identification', 'communication_planning', 'consequence_setting'],
    time_frame_range: { min_days: 14, max_days: 60 },
  },

  // Emotional Processing Solutions
  {
    category: 'emotional_processing',
    name: 'Emotional Expression Practice',
    description: 'Safe and structured expression of suppressed emotions',
    applicability_criteria: ['suppressed_emotions', 'emotional_avoidance', 'numbing'],
    tools: ['journaling', 'emotional_check_ins', 'expressive_writing'],
    time_frame_range: { min_days: 14, max_days: 60 },
  },
  {
    category: 'emotional_processing',
    name: 'Trauma Processing',
    description: 'Working through past traumatic experiences',
    applicability_criteria: ['trauma', 'ptsd_symptoms', 'intrusive_memories'],
    tools: ['narrative_exposure', 'memory_reconsolidation', 'safety_building'],
    time_frame_range: { min_days: 60, max_days: 365 },
  },
  {
    category: 'emotional_processing',
    name: 'Grief Work',
    description: 'Processing loss and moving toward integration',
    applicability_criteria: ['loss', 'grief', 'unprocessed_loss'],
    tools: ['memorial_creation', 'meaning_making', 'continuing_bonds'],
    time_frame_range: { min_days: 30, max_days: 365 },
  },
];

/**
 * Solution generation context
 */
export interface SolutionContext {
  problem: string;
  diagnosis: RootCauseDiagnosis[];
  constraints: SolutionConstraints;
  preferences: SolutionPreferences;
}

/**
 * Constraints for solution generation
 */
export interface SolutionConstraints {
  time_limit_days?: number;
  available_resources?: string[];
  excluded_categories?: SolutionCategory[];
  maximum_solutions?: number;
}

/**
 * User preferences for solutions
 */
export interface SolutionPreferences {
  preferred_categories?: SolutionCategory[];
  preferred_approach?: 'structured' | 'flexible' | 'intensive';
  support_level?: 'self_guided' | 'guided' | 'professional';
  urgency?: 'low' | 'medium' | 'high';
}

/**
 * Solution generation result
 */
export interface SolutionGenerationResult {
  solutions: SolutionProposal[];
  prioritized_order: number[];
  rationale: string;
  estimated_time_frame: string;
  success_factors: string[];
  potential_obstacles: string[];
}

/**
 * SolutionGenerator class
 * Generates tailored solutions based on diagnosis and context
 */
export class SolutionGenerator {
  private templates: SolutionTemplate[];

  constructor(customTemplates?: SolutionTemplate[]) {
    this.templates = customTemplates || [...SOLUTION_TEMPLATES];
  }

  /**
   * Get all available templates
   */
  getTemplates(): SolutionTemplate[] {
    return [...this.templates];
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: SolutionCategory): SolutionTemplate[] {
    return this.templates.filter((t) => t.category === category);
  }

  /**
   * Generate solutions based on diagnosis
   */
  generate(context: SolutionContext): SolutionGenerationResult {
    const applicableSolutions = this.findApplicableSolutions(context);
    const scoredSolutions = this.scoreSolutions(applicableSolutions, context);
    const rankedSolutions = this.rankSolutions(scoredSolutions);

    const maxSolutions = context.constraints.maximum_solutions || 5;
    const topSolutions = rankedSolutions.slice(0, maxSolutions);

    return {
      solutions: topSolutions,
      prioritized_order: topSolutions.map((_, i) => i),
      rationale: this.generateRationale(topSolutions, context),
      estimated_time_frame: this.estimateTotalTimeFrame(topSolutions),
      success_factors: this.identifySuccessFactors(topSolutions, context),
      potential_obstacles: this.identifyObstacles(topSolutions, context),
    };
  }

  /**
   * Find solutions applicable to the diagnosis
   */
  private findApplicableSolutions(context: SolutionContext): SolutionProposal[] {
    const solutions: SolutionProposal[] = [];
    const excludedCategories = context.constraints.excluded_categories || [];

    for (const diagnosis of context.diagnosis) {
      const relevantTemplates = this.findRelevantTemplates(diagnosis, excludedCategories);

      for (const template of relevantTemplates) {
        const solution = this.createSolutionFromTemplate(template, diagnosis, context);
        solutions.push(solution);
      }
    }

    return this.deduplicateSolutions(solutions);
  }

  /**
   * Find templates relevant to a diagnosis
   */
  private findRelevantTemplates(
    diagnosis: RootCauseDiagnosis,
    excludedCategories: SolutionCategory[]
  ): SolutionTemplate[] {
    const relevantTemplates: SolutionTemplate[] = [];

    // Map layers to likely applicable solution categories
    const layerCategoryMap: Record<AnalysisLayer, SolutionCategory[]> = {
      surface_symptoms: ['behavioral_action', 'environment_adjustment'],
      behavioral_patterns: ['behavioral_action', 'skill_development'],
      cognitive_structures: ['cognitive_restructuring', 'skill_development'],
      emotional_drivers: ['emotional_processing', 'skill_development'],
      core_beliefs: ['cognitive_restructuring', 'emotional_processing'],
      root_causes: ['emotional_processing', 'cognitive_restructuring'],
    };

    const relevantCategories = layerCategoryMap[diagnosis.layer] || [];

    for (const template of this.templates) {
      if (excludedCategories.includes(template.category)) continue;

      // Check if template is relevant to the layer
      if (relevantCategories.includes(template.category)) {
        // Check if applicability criteria match findings
        const matchesFinding = template.applicability_criteria.some((criteria) =>
          diagnosis.findings.some(
            (finding) =>
              finding.toLowerCase().replace(/_/g, ' ').includes(criteria.replace(/_/g, ' ')) ||
              criteria.replace(/_/g, ' ').includes(finding.toLowerCase().replace(/_/g, ' '))
          )
        );

        if (matchesFinding || template.applicability_criteria.length === 0) {
          relevantTemplates.push(template);
        }
      }
    }

    return relevantTemplates;
  }

  /**
   * Create a solution from a template
   */
  private createSolutionFromTemplate(
    template: SolutionTemplate,
    diagnosis: RootCauseDiagnosis,
    context: SolutionContext
  ): SolutionProposal {
    const timeFrame = this.calculateTimeFrame(template, context);
    const actionSteps = this.generateActionSteps(template, diagnosis);
    const successMetrics = this.generateSuccessMetrics(template, diagnosis);

    return {
      category: template.category,
      title: template.name,
      description: template.description,
      tools: template.tools,
      action_steps: actionSteps,
      expected_outcome: this.generateExpectedOutcome(template, diagnosis),
      time_frame: timeFrame,
      success_metrics: successMetrics,
    };
  }

  /**
   * Calculate appropriate time frame
   */
  private calculateTimeFrame(template: SolutionTemplate, context: SolutionContext): string {
    const { min_days, max_days } = template.time_frame_range;

    if (context.constraints.time_limit_days) {
      const limit = context.constraints.time_limit_days;
      if (limit < min_days) {
        return `${limit} days (accelerated)`;
      }
      return `${Math.min(limit, max_days)} days`;
    }

    const urgencyMultiplier = {
      high: 0.5,
      medium: 0.75,
      low: 1,
    };

    const multiplier = urgencyMultiplier[context.preferences.urgency || 'medium'];
    const adjustedDays = Math.round(((min_days + max_days) / 2) * multiplier);

    return `${adjustedDays} days`;
  }

  /**
   * Generate action steps from template
   */
  private generateActionSteps(
    template: SolutionTemplate,
    diagnosis: RootCauseDiagnosis
  ): ActionStep[] {
    const steps: ActionStep[] = [];
    const toolCount = template.tools.length;

    for (let i = 0; i < toolCount; i++) {
      const tool = template.tools[i];
      steps.push({
        step_number: i + 1,
        action: this.toolToAction(tool),
        rationale: this.toolToRationale(tool, diagnosis),
        resources_needed: this.toolToResources(tool),
        verification_method: this.toolToVerification(tool),
      });
    }

    return steps;
  }

  /**
   * Convert tool name to action description
   */
  private toolToAction(tool: string): string {
    const toolActions: Record<string, string> = {
      thought_record:
        'Complete daily thought records identifying trigger situations, emotions, and thoughts',
      evidence_examination: 'List evidence for and against identified thoughts',
      alternative_thinking: 'Generate at least 3 alternative interpretations for each situation',
      behavioral_experiment: 'Design and conduct experiments to test beliefs',
      prediction_testing: 'Make specific predictions and compare with actual outcomes',
      evidence_gathering: 'Systematically collect data relevant to the belief',
      multiple_perspectives: 'Write the situation from 3 different viewpoints',
      devil_advocate: 'Argue against your initial interpretation',
      best_friend_test: 'Write what you would tell a best friend in this situation',
      exposure_hierarchy: 'Create a ranked list of avoided situations (0-100 scale)',
      fear_ladder: 'Plan gradual steps from least to most anxiety-provoking',
      gradual_steps: 'Practice each step until anxiety reduces by 50%',
      habit_stacking: 'Link new behavior to existing habit',
      implementation_intention: 'Create specific if-then plans',
      environmental_design: 'Modify environment to support desired behavior',
      activity_scheduling: 'Plan specific activities for each day',
      mood_tracking: 'Rate mood before and after activities',
      value_aligned_activities: 'List activities aligned with core values',
      active_listening: 'Practice reflecting what others say before responding',
      i_statements: 'Express feelings using "I feel... when... because..." format',
      assertive_communication: 'Practice stating needs clearly and respectfully',
      grounding_techniques: 'Use 5-4-3-2-1 sensory grounding when distressed',
      opposite_action: 'Do the opposite of what emotion urges',
      tipp_skills: 'Use Temperature, Intense exercise, Paced breathing, Paired muscle relaxation',
      problem_definition: 'Write clear problem statement',
      brainstorming: 'Generate at least 10 possible solutions without judgment',
      pros_cons_analysis: 'Evaluate top 3 solutions systematically',
      relationship_mapping: 'Map current support network',
      connection_planning: 'Schedule regular contact with supportive people',
      boundary_setting: 'Identify and communicate boundaries',
      environmental_audit: 'Assess current environment for triggers and supports',
      trigger_removal: 'Remove or modify identified triggers',
      cues_design: 'Add environmental cues for desired behaviors',
      boundary_identification: 'List situations where boundaries are needed',
      communication_planning: 'Script boundary communication',
      consequence_setting: 'Define consequences for boundary violations',
      journaling: 'Write freely about emotions for 15 minutes daily',
      emotional_check_ins: 'Set 3 daily reminders to name current emotion',
      expressive_writing: 'Write about difficult experiences for 20 minutes on 4 consecutive days',
      narrative_exposure: 'Write complete narrative of traumatic experience',
      memory_reconsolidation: 'Identify and update core memory meanings',
      safety_building: 'Create internal and external safety resources',
      memorial_creation: 'Create meaningful memorial or ritual',
      meaning_making: 'Explore what this loss means for your life',
      continuing_bonds: 'Identify ways to maintain connection while moving forward',
    };

    return toolActions[tool] || `Practice ${tool.replace(/_/g, ' ')}`;
  }

  /**
   * Generate rationale for a tool
   */
  private toolToRationale(tool: string, diagnosis: RootCauseDiagnosis): string {
    const finding = diagnosis.findings[0] || 'the identified issue';
    return `Addresses ${finding} by applying ${tool.replace(/_/g, ' ')} technique`;
  }

  /**
   * Identify resources needed for a tool
   */
  private toolToResources(tool: string): string[] {
    const resourceMap: Record<string, string[]> = {
      thought_record: ['Thought record worksheet', 'Pen', '10-15 minutes'],
      evidence_examination: ['Worksheet', 'Examples of the thought'],
      journaling: ['Journal or digital device', 'Private space', '15-20 minutes'],
      exposure_hierarchy: ['Anxiety scale guide', 'List of situations'],
      default: ['Time', 'Commitment'],
    };

    return resourceMap[tool] || resourceMap.default;
  }

  /**
   * Define verification method for a tool
   */
  private toolToVerification(tool: string): string {
    const verificationMap: Record<string, string> = {
      thought_record: 'Review completed records with therapist or trusted person',
      journaling: 'Review entries weekly for patterns',
      exposure_hierarchy: 'Self-rating of anxiety before and after each exposure',
      behavioral_experiment: 'Compare prediction to actual outcome',
      default: 'Self-assessment of progress weekly',
    };

    return verificationMap[tool] || verificationMap.default;
  }

  /**
   * Generate expected outcome
   */
  private generateExpectedOutcome(
    template: SolutionTemplate,
    diagnosis: RootCauseDiagnosis
  ): string {
    const outcomes: Record<SolutionCategory, string> = {
      cognitive_restructuring: 'More balanced and realistic thinking patterns',
      behavioral_action: 'Reduced avoidance and increased engagement in valued activities',
      skill_development: 'Improved competence in identified skill areas',
      environment_adjustment: 'More supportive environment for change',
      emotional_processing: 'Better emotional awareness and regulation',
    };

    return outcomes[template.category] || 'Improvement in targeted area';
  }

  /**
   * Generate success metrics
   */
  private generateSuccessMetrics(
    template: SolutionTemplate,
    diagnosis: RootCauseDiagnosis
  ): string[] {
    const baseMetrics: Record<SolutionCategory, string[]> = {
      cognitive_restructuring: [
        'Reduced frequency of automatic negative thoughts',
        'Increased ability to generate alternatives',
        'Lower belief ratings in unhelpful thoughts',
      ],
      behavioral_action: [
        'Increased engagement in target behaviors',
        'Reduced avoidance behaviors',
        'Improved mood ratings',
      ],
      skill_development: [
        'Demonstrated competence in skill',
        'Spontaneous use of skill in relevant situations',
        'Feedback from others on improvement',
      ],
      environment_adjustment: [
        'Changes implemented in environment',
        'Reduced exposure to triggers',
        'Increased support utilization',
      ],
      emotional_processing: [
        'Increased emotional awareness',
        'Reduced emotional intensity when recalling experiences',
        'Improved ability to stay present with emotions',
      ],
    };

    return baseMetrics[template.category] || ['Self-reported improvement'];
  }

  /**
   * Score solutions based on context
   */
  private scoreSolutions(
    solutions: SolutionProposal[],
    context: SolutionContext
  ): SolutionProposal[] {
    return solutions.map((solution) => {
      let score = 50; // Base score

      // Preferred category bonus
      if (context.preferences.preferred_categories?.includes(solution.category)) {
        score += 20;
      }

      // Time frame alignment
      if (context.constraints.time_limit_days) {
        const solutionDays = parseInt(solution.time_frame || '30');
        if (solutionDays <= context.constraints.time_limit_days) {
          score += 15;
        }
      }

      // Urgency alignment
      if (context.preferences.urgency === 'high' && parseInt(solution.time_frame || '30') <= 30) {
        score += 10;
      }

      // Resource availability
      if (context.constraints.available_resources) {
        const hasResources = solution.action_steps.every((step) =>
          step.resources_needed?.every(
            (r) =>
              context.constraints.available_resources?.includes(r) ||
              ['Time', 'Commitment'].includes(r)
          )
        );
        if (hasResources) score += 10;
      }

      return { ...solution, score };
    });
  }

  /**
   * Rank solutions by score
   */
  private rankSolutions(solutions: SolutionProposal[]): SolutionProposal[] {
    return [...solutions].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }

  /**
   * Deduplicate similar solutions
   */
  private deduplicateSolutions(solutions: SolutionProposal[]): SolutionProposal[] {
    const seen = new Set<string>();
    return solutions.filter((solution) => {
      const key = `${solution.category}-${solution.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Generate rationale for solution selection
   */
  private generateRationale(solutions: SolutionProposal[], context: SolutionContext): string {
    const categories = [...new Set(solutions.map((s) => s.category))];

    return (
      `Selected ${solutions.length} solutions targeting ${categories.length} area(s): ` +
      `${categories.join(', ')}. Solutions were chosen based on diagnosis findings, ` +
      `time constraints, and preference alignment.`
    );
  }

  /**
   * Estimate total time frame
   */
  private estimateTotalTimeFrame(solutions: SolutionProposal[]): string {
    if (solutions.length === 0) return 'No solutions proposed';

    const days = solutions.map((s) => parseInt(s.time_frame || '30'));
    const minDays = Math.min(...days);
    const maxDays = Math.max(...days);

    if (solutions.length === 1) {
      return `${minDays} days`;
    }

    return `${minDays}-${maxDays} days depending on solution selection`;
  }

  /**
   * Identify success factors
   */
  private identifySuccessFactors(
    solutions: SolutionProposal[],
    context: SolutionContext
  ): string[] {
    const factors = [
      'Consistent practice of recommended techniques',
      'Regular self-monitoring and reflection',
    ];

    if (context.preferences.support_level === 'professional') {
      factors.push('Regular sessions with qualified professional');
    }

    if (solutions.some((s) => s.category === 'environment_adjustment')) {
      factors.push('Supportive environment for change');
    }

    return factors;
  }

  /**
   * Identify potential obstacles
   */
  private identifyObstacles(solutions: SolutionProposal[], context: SolutionContext): string[] {
    const obstacles: string[] = [];

    if (context.preferences.urgency === 'high') {
      obstacles.push('Time pressure may limit depth of work');
    }

    if (context.constraints.time_limit_days && context.constraints.time_limit_days < 30) {
      obstacles.push('Short time frame may require prioritization');
    }

    if (solutions.some((s) => s.category === 'behavioral_action')) {
      obstacles.push('Avoidance may interfere with exposure-based approaches');
    }

    if (solutions.some((s) => s.category === 'cognitive_restructuring')) {
      obstacles.push('Strongly held beliefs may resist change initially');
    }

    return obstacles;
  }

  /**
   * Generate quick solution suggestions
   */
  quickSuggest(problem: string): {
    immediate_actions: string[];
    short_term_strategies: string[];
    recommended_approach: SolutionCategory;
  } {
    const problemLower = problem.toLowerCase();
    const immediate_actions: string[] = [];
    const short_term_strategies: string[] = [];
    let recommended_approach: SolutionCategory = 'behavioral_action';

    // Quick keyword-based suggestions
    if (problemLower.includes('anxious') || problemLower.includes('anxiety')) {
      immediate_actions.push('Take 3 slow, deep breaths');
      immediate_actions.push('Ground using 5-4-3-2-1 technique');
      short_term_strategies.push('Create anxiety hierarchy');
      recommended_approach = 'behavioral_action';
    }

    if (problemLower.includes('think') || problemLower.includes('believe')) {
      immediate_actions.push('Write down the thought');
      immediate_actions.push('Ask: What evidence supports/contradicts this?');
      short_term_strategies.push('Start daily thought records');
      recommended_approach = 'cognitive_restructuring';
    }

    if (problemLower.includes('feel') || problemLower.includes('emotion')) {
      immediate_actions.push('Name the specific emotion');
      immediate_actions.push('Notice where you feel it in your body');
      short_term_strategies.push('Begin emotion journaling');
      recommended_approach = 'emotional_processing';
    }

    // Default suggestions if no keywords matched
    if (immediate_actions.length === 0) {
      immediate_actions.push('Take 5 minutes to write down the core issue');
      immediate_actions.push('Identify one small action you could take today');
      short_term_strategies.push('Break the problem into smaller components');
    }

    return {
      immediate_actions,
      short_term_strategies,
      recommended_approach,
    };
  }
}

export default SolutionGenerator;
