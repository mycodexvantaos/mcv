/**
 * Persona Validator for MyCodeXvantaOS Persona Engine
 *
 * Validates persona profile configurations against MyCodeXvantaOS specifications
 * and schema definitions to ensure data integrity and compliance.
 *
 * @module mycodexvantaos-persona-engine/core/persona-validator
 */

import {
  PersonaProfile,
  PersonaArchetype,
  BehavioralParameters,
  ResponsePatterns,
  GovernanceConfig,
} from '../types';

/**
 * Validation severity levels
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Validation result for a single check
 */
export interface ValidationIssue {
  /** Issue code for programmatic handling */
  code: string;
  /** Human-readable message */
  message: string;
  /** Severity level */
  severity: ValidationSeverity;
  /** Field path that the issue relates to */
  path: string;
  /** Suggested fix if available */
  suggestion?: string;
}

/**
 * Complete validation result
 */
export interface ValidationResult {
  /** Whether validation passed (no errors) */
  valid: boolean;
  /** All validation issues found */
  issues: ValidationIssue[];
  /** Summary statistics */
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
  /** Validated profile (if partially valid) */
  profile?: PersonaProfile;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  /** Strict mode - treats warnings as errors */
  strict: boolean;
  /** Validate against schema */
  validateSchema: boolean;
  /** Validate behavioral parameters ranges */
  validateRanges: boolean;
  /** Check required fields */
  checkRequired: boolean;
  /** Validate URN format */
  validateURN: boolean;
  /** Custom validation rules to apply */
  customRules?: Array<(profile: Partial<PersonaProfile>) => ValidationIssue[]>;
}

/**
 * Valid behavioral parameter ranges
 */
const BEHAVIORAL_RANGES: Partial<Record<keyof BehavioralParameters, { min: number; max: number }>> =
  {
    critical_tolerance: { min: 0, max: 1 },
    empathy_level: { min: 0, max: 1 },
    directness: { min: 0, max: 1 },
    solution_focus: { min: 0, max: 1 },
    abstraction_preference: { min: 0, max: 1 },
    questioning_depth: { min: 0, max: 1 },
    contradiction_frequency: { min: 0, max: 1 },
  };

/**
 * Valid archetypes
 */
const VALID_ARCHETYPES: PersonaArchetype[] = [
  'disrupter',
  'analyst',
  'mediator',
  'architect',
  'critic',
  'creative_thinker',
  'facilitator',
  'mentor',
  'synthesizer',
];

/**
 * Valid governance tiers
 */
const VALID_GOVERNANCE_TIERS = [-1, 0, 1, 2, 3];

/**
 * PersonaValidator validates persona profiles against specifications
 *
 * @example
 * ```typescript
 * const validator = new PersonaValidator();
 * const result = validator.validate(profile);
 *
 * if (!result.valid) {
 *   console.error('Validation failed:', result.issues);
 * }
 * ```
 */
export class PersonaValidator {
  private options: ValidationOptions;

  constructor(options: Partial<ValidationOptions> = {}) {
    this.options = {
      strict: options.strict ?? false,
      validateSchema: options.validateSchema ?? true,
      validateRanges: options.validateRanges ?? true,
      checkRequired: options.checkRequired ?? true,
      validateURN: options.validateURN ?? true,
      customRules: options.customRules ?? [],
    };
  }

  /**
   * Validates a persona profile
   */
  validate(profile: Partial<PersonaProfile>): ValidationResult {
    const issues: ValidationIssue[] = [];

    // Run validation checks
    if (this.options.checkRequired) {
      issues.push(...this.validateRequiredFields(profile));
    }

    if (this.options.validateURN) {
      issues.push(...this.validateURN(profile));
    }

    if (this.options.validateSchema) {
      issues.push(...this.validateSchema(profile));
    }

    if (this.options.validateRanges && profile.behavioral_parameters) {
      issues.push(...this.validateBehavioralParameters(profile.behavioral_parameters));
    }

    if (profile.governance) {
      issues.push(...this.validateGovernance(profile.governance));
    }

    if (profile.response_patterns) {
      issues.push(...this.validateResponsePatterns(profile.response_patterns));
    }

    // Run custom rules
    if (this.options.customRules) {
      for (const rule of this.options.customRules) {
        issues.push(...rule(profile));
      }
    }

    // Calculate summary
    const summary = {
      errors: issues.filter((i) => i.severity === 'error').length,
      warnings: issues.filter((i) => i.severity === 'warning').length,
      infos: issues.filter((i) => i.severity === 'info').length,
    };

    // In strict mode, warnings become errors
    const hasErrors = this.options.strict
      ? summary.errors + summary.warnings > 0
      : summary.errors > 0;

    return {
      valid: !hasErrors,
      issues,
      summary,
      profile: hasErrors ? undefined : (profile as PersonaProfile),
    };
  }

  /**
   * Validates required fields
   */
  private validateRequiredFields(profile: Partial<PersonaProfile>): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const requiredFields: Array<keyof PersonaProfile> = [
      'urn',
      'name',
      'archetype',
      'version',
      'description',
      'behavioral_parameters',
      'response_patterns',
      'governance',
    ];

    for (const field of requiredFields) {
      if (profile[field] === undefined || profile[field] === null) {
        issues.push({
          code: 'REQUIRED_FIELD_MISSING',
          message: `Required field '${field}' is missing`,
          severity: 'error',
          path: field,
          suggestion: `Add the '${field}' field to your persona configuration`,
        });
      }
    }

    return issues;
  }

  /**
   * Validates URN format
   */
  private validateURN(profile: Partial<PersonaProfile>): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (profile.urn) {
      // Check URN format
      const urnPattern = /^urn:mycodexvantaos:persona:[a-z0-9-]+$/;
      if (!urnPattern.test(profile.urn)) {
        issues.push({
          code: 'INVALID_URN_FORMAT',
          message: `URN '${profile.urn}' does not match expected format`,
          severity: 'error',
          path: 'urn',
          suggestion: 'Use format: urn:mycodexvantaos:persona:{identifier}',
        });
      }

      // Check URN consistency with archetype
      if (profile.archetype && profile.urn) {
        const urnArchetype = profile.urn.split(':').pop()?.split('-')[0];
        if (urnArchetype && !profile.urn.includes(profile.archetype.replace('_', '-'))) {
          issues.push({
            code: 'URN_ARCHETYPE_MISMATCH',
            message: `URN does not contain the archetype '${profile.archetype}'`,
            severity: 'warning',
            path: 'urn',
            suggestion: `Consider including archetype in URN for consistency`,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Validates schema compliance
   */
  private validateSchema(profile: Partial<PersonaProfile>): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Validate archetype
    if (profile.archetype && !VALID_ARCHETYPES.includes(profile.archetype)) {
      issues.push({
        code: 'INVALID_ARCHETYPE',
        message: `Archetype '${profile.archetype}' is not a valid archetype`,
        severity: 'error',
        path: 'archetype',
        suggestion: `Valid archetypes: ${VALID_ARCHETYPES.join(', ')}`,
      });
    }

    // Validate version format
    if (profile.version) {
      const versionPattern = /^\d+\.\d+\.\d+$/;
      if (!versionPattern.test(profile.version)) {
        issues.push({
          code: 'INVALID_VERSION_FORMAT',
          message: `Version '${profile.version}' does not follow semantic versioning`,
          severity: 'warning',
          path: 'version',
          suggestion: 'Use semantic versioning format: X.Y.Z (e.g., 1.0.0)',
        });
      }
    }

    // Validate name
    if (profile.name) {
      if (profile.name.length < 3) {
        issues.push({
          code: 'NAME_TOO_SHORT',
          message: 'Persona name should be at least 3 characters',
          severity: 'warning',
          path: 'name',
        });
      }
      if (profile.name.length > 100) {
        issues.push({
          code: 'NAME_TOO_LONG',
          message: 'Persona name should not exceed 100 characters',
          severity: 'warning',
          path: 'name',
        });
      }
    }

    // Validate description
    if (profile.description) {
      if (profile.description.length < 20) {
        issues.push({
          code: 'DESCRIPTION_TOO_SHORT',
          message: 'Description should be at least 20 characters for clarity',
          severity: 'info',
          path: 'description',
          suggestion: 'Provide a more detailed description of the persona',
        });
      }
    }

    return issues;
  }

  /**
   * Validates behavioral parameters
   */
  private validateBehavioralParameters(params: Partial<BehavioralParameters>): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    for (const [key, range] of Object.entries(BEHAVIORAL_RANGES) as [
      keyof BehavioralParameters,
      { min: number; max: number },
    ][]) {
      const value = params[key];

      if (value !== undefined) {
        if (typeof value !== 'number') {
          issues.push({
            code: 'INVALID_PARAMETER_TYPE',
            message: `Behavioral parameter '${key}' must be a number`,
            severity: 'error',
            path: `behavioral_parameters.${key}`,
          });
        } else if (value < range.min || value > range.max) {
          issues.push({
            code: 'PARAMETER_OUT_OF_RANGE',
            message: `Behavioral parameter '${key}' value ${value} is out of range [${range.min}, ${range.max}]`,
            severity: 'error',
            path: `behavioral_parameters.${key}`,
            suggestion: `Set '${key}' to a value between ${range.min} and ${range.max}`,
          });
        }
      } else {
        issues.push({
          code: 'MISSING_BEHAVIORAL_PARAMETER',
          message: `Behavioral parameter '${key}' is not defined`,
          severity: 'warning',
          path: `behavioral_parameters.${key}`,
          suggestion: `Define '${key}' with a value between ${range.min} and ${range.max}`,
        });
      }
    }

    // Validate logical constraints
    if (params.empathy_level !== undefined && params.directness !== undefined) {
      // High empathy + high directness can be contradictory
      if (params.empathy_level > 0.8 && params.directness > 0.8) {
        issues.push({
          code: 'POTENTIAL_CONTRADICTION',
          message: 'High empathy combined with high directness may create contradictory behavior',
          severity: 'info',
          path: 'behavioral_parameters',
        });
      }
    }

    return issues;
  }

  /**
   * Validates governance configuration
   */
  private validateGovernance(governance: Partial<GovernanceConfig>): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Validate tier
    if (governance.tier !== undefined) {
      if (!VALID_GOVERNANCE_TIERS.includes(governance.tier)) {
        issues.push({
          code: 'INVALID_GOVERNANCE_TIER',
          message: `Governance tier ${governance.tier} is not valid`,
          severity: 'error',
          path: 'governance.tier',
          suggestion: `Valid tiers: ${VALID_GOVERNANCE_TIERS.join(', ')}`,
        });
      }
    }

    // Validate constraints
    if (governance.constraints) {
      if (!Array.isArray(governance.constraints)) {
        issues.push({
          code: 'INVALID_CONSTRAINTS_TYPE',
          message: 'Governance constraints must be an array',
          severity: 'error',
          path: 'governance.constraints',
        });
      } else if (governance.constraints.length === 0) {
        issues.push({
          code: 'EMPTY_CONSTRAINTS',
          message: 'Consider adding at least one governance constraint',
          severity: 'info',
          path: 'governance.constraints',
        });
      }
    }

    return issues;
  }

  /**
   * Validates response patterns
   */
  private validateResponsePatterns(patterns: Partial<ResponsePatterns>): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const validOpeningStyles = [
      'challenging',
      'analytical',
      'welcoming',
      'inclusive',
      'connecting',
      'direct',
      'empathetic',
    ];
    const validAnalyticalFrameworks = [
      'first_principles',
      'data_driven',
      'holistic',
      'systematic',
      'integrative',
      'dialectical',
    ];
    const validConclusionStyles = [
      'action_oriented',
      'evidence_based',
      'empowering',
      'synthesizing',
      'unifying',
      'reflective',
    ];

    if (patterns.opening_style && !validOpeningStyles.includes(patterns.opening_style)) {
      issues.push({
        code: 'INVALID_OPENING_STYLE',
        message: `Opening style '${patterns.opening_style}' is not recognized`,
        severity: 'warning',
        path: 'response_patterns.opening_style',
        suggestion: `Consider one of: ${validOpeningStyles.join(', ')}`,
      });
    }

    if (
      patterns.analytical_framework &&
      !validAnalyticalFrameworks.includes(patterns.analytical_framework)
    ) {
      issues.push({
        code: 'INVALID_ANALYTICAL_FRAMEWORK',
        message: `Analytical framework '${patterns.analytical_framework}' is not recognized`,
        severity: 'warning',
        path: 'response_patterns.analytical_framework',
        suggestion: `Consider one of: ${validAnalyticalFrameworks.join(', ')}`,
      });
    }

    if (patterns.conclusion_style && !validConclusionStyles.includes(patterns.conclusion_style)) {
      issues.push({
        code: 'INVALID_CONCLUSION_STYLE',
        message: `Conclusion style '${patterns.conclusion_style}' is not recognized`,
        severity: 'warning',
        path: 'response_patterns.conclusion_style',
        suggestion: `Consider one of: ${validConclusionStyles.join(', ')}`,
      });
    }

    return issues;
  }

  /**
   * Validates a YAML configuration string
   */
  validateYAML(yamlContent: string): ValidationResult {
    // This would typically use a YAML parser
    // For now, we'll return a placeholder
    const issues: ValidationIssue[] = [];

    if (!yamlContent || yamlContent.trim().length === 0) {
      issues.push({
        code: 'EMPTY_YAML_CONTENT',
        message: 'YAML content is empty',
        severity: 'error',
        path: '',
      });
    }

    return {
      valid: issues.filter((i) => i.severity === 'error').length === 0,
      issues,
      summary: {
        errors: issues.filter((i) => i.severity === 'error').length,
        warnings: issues.filter((i) => i.severity === 'warning').length,
        infos: issues.filter((i) => i.severity === 'info').length,
      },
    };
  }

  /**
   * Quick validation check (returns boolean only)
   */
  isValid(profile: Partial<PersonaProfile>): boolean {
    const result = this.validate(profile);
    return result.valid;
  }

  /**
   * Gets valid archetypes
   */
  static getValidArchetypes(): PersonaArchetype[] {
    return [...VALID_ARCHETYPES];
  }

  /**
   * Gets valid governance tiers
   */
  static getValidGovernanceTiers(): number[] {
    return [...VALID_GOVERNANCE_TIERS];
  }

  /**
   * Gets behavioral parameter ranges
   */
  static getBehavioralRanges(): Partial<
    Record<keyof BehavioralParameters, { min: number; max: number }>
  > {
    return { ...BEHAVIORAL_RANGES };
  }
}

export default PersonaValidator;
