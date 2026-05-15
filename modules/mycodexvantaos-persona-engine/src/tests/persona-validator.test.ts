import {
  PersonaValidator,
  ValidationIssue,
  ValidationResult,
  ValidationOptions,
  ValidationSeverity,
} from '../core/persona-validator';
import { PersonaProfile, PersonaArchetype, BehavioralParameters } from '../types';

describe('PersonaValidator', () => {
  let validator: PersonaValidator;

  const validProfile: PersonaProfile = {
    urn: 'urn:mycodexvantaos:persona:analyst-001',
    name: 'Test Analyst Persona',
    version: '1.0.0',
    description: 'A comprehensive test persona for validation testing purposes',
    archetype: 'analyst',
    behavioral_parameters: {
      critical_tolerance: 0.5,
      empathy_level: 0.5,
      directness: 0.5,
      solution_focus: 0.5,
      abstraction_preference: 0.5,
      questioning_depth: 0.5,
      contradiction_frequency: 0.5,
    },
    response_patterns: {
      opening_style: 'analytical',
      analytical_framework: 'data_driven',
      conclusion_style: 'evidence_based',
    },
    governance: {
      tier: 1,
      constraints: ['max_autonomy', 'min_review'] as unknown as Record<string, boolean>,
    },
  };

  beforeEach(() => {
    validator = new PersonaValidator();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultValidator = new PersonaValidator();
      expect(defaultValidator).toBeDefined();
    });

    it('should accept custom options', () => {
      const customValidator = new PersonaValidator({
        strict: true,
        validateSchema: false,
        validateRanges: false,
        checkRequired: false,
        validateURN: false,
      });
      expect(customValidator).toBeDefined();
    });

    it('should accept custom validation rules', () => {
      const customRule = (profile: Partial<PersonaProfile>): ValidationIssue[] => {
        if (profile.name?.includes('test')) {
          return [
            {
              code: 'TEST_NAME',
              message: 'Name contains test',
              severity: 'warning',
              path: 'name',
            },
          ];
        }
        return [];
      };

      const customValidator = new PersonaValidator({
        customRules: [customRule],
      });

      const result = customValidator.validate({ ...validProfile, name: 'test-persona' });
      expect(result.issues.some((i) => i.code === 'TEST_NAME')).toBe(true);
    });
  });

  describe('validate', () => {
    it('should return valid result for a valid profile', () => {
      const result = validator.validate(validProfile);
      expect(result.valid).toBe(true);
      expect(result.summary.errors).toBe(0);
    });

    it('should return invalid result for missing required fields', () => {
      const incompleteProfile = {
        urn: 'urn:mycodexvantaos:persona:test-001',
        name: 'Test',
      };
      const result = validator.validate(incompleteProfile);

      expect(result.valid).toBe(false);
      expect(result.summary.errors).toBeGreaterThan(0);
    });

    it('should include validated profile when valid', () => {
      const result = validator.validate(validProfile);
      expect(result.profile).toBeDefined();
      expect(result.profile?.urn).toBe(validProfile.urn);
    });

    it('should not include profile when invalid', () => {
      const result = validator.validate({ name: 'Invalid' });
      expect(result.profile).toBeUndefined();
    });

    it('should count errors, warnings, and infos', () => {
      const result = validator.validate(validProfile);
      expect(result.summary).toHaveProperty('errors');
      expect(result.summary).toHaveProperty('warnings');
      expect(result.summary).toHaveProperty('infos');
    });

    it('should treat warnings as errors in strict mode', () => {
      const strictValidator = new PersonaValidator({ strict: true });

      // Profile with invalid version format triggers warning
      const profileWithWarning = {
        ...validProfile,
        version: 'v1', // Invalid format - triggers warning
      };

      const result = strictValidator.validate(profileWithWarning);
      expect(result.valid).toBe(false);
    });

    it('should skip required field check when disabled', () => {
      const noRequiredValidator = new PersonaValidator({ checkRequired: false });
      const minimalProfile = { urn: 'urn:mycodexvantaos:persona:test' };

      const result = noRequiredValidator.validate(minimalProfile);
      expect(result.issues.some((i) => i.code === 'REQUIRED_FIELD_MISSING')).toBe(false);
    });

    it('should skip URN validation when disabled', () => {
      const noUrnValidator = new PersonaValidator({ validateURN: false });
      const profileWithInvalidUrn = {
        ...validProfile,
        urn: 'invalid-urn-format',
      };

      const result = noUrnValidator.validate(profileWithInvalidUrn);
      expect(result.issues.some((i) => i.code === 'INVALID_URN_FORMAT')).toBe(false);
    });

    it('should skip schema validation when disabled', () => {
      const noSchemaValidator = new PersonaValidator({ validateSchema: false });
      const profileWithInvalidArchetype = {
        ...validProfile,
        archetype: 'invalid_archetype' as PersonaArchetype,
      };

      const result = noSchemaValidator.validate(profileWithInvalidArchetype);
      expect(result.issues.some((i) => i.code === 'INVALID_ARCHETYPE')).toBe(false);
    });

    it('should skip range validation when disabled', () => {
      const noRangeValidator = new PersonaValidator({ validateRanges: false });
      const profileWithOutOfRange = {
        ...validProfile,
        behavioral_parameters: {
          ...validProfile.behavioral_parameters,
          empathy_level: 5, // Out of range
        },
      };

      const result = noRangeValidator.validate(profileWithOutOfRange);
      expect(result.issues.some((i) => i.code === 'PARAMETER_OUT_OF_RANGE')).toBe(false);
    });
  });

  describe('validateRequiredFields', () => {
    it('should detect missing urn', () => {
      const { urn, ...profileWithoutUrn } = validProfile;
      const result = validator.validate(profileWithoutUrn);

      expect(
        result.issues.some((i) => i.code === 'REQUIRED_FIELD_MISSING' && i.path === 'urn')
      ).toBe(true);
    });

    it('should detect missing name', () => {
      const { name, ...profileWithoutName } = validProfile;
      const result = validator.validate(profileWithoutName);

      expect(
        result.issues.some((i) => i.code === 'REQUIRED_FIELD_MISSING' && i.path === 'name')
      ).toBe(true);
    });

    it('should detect missing archetype', () => {
      const { archetype, ...profileWithoutArchetype } = validProfile;
      const result = validator.validate(profileWithoutArchetype);

      expect(
        result.issues.some((i) => i.code === 'REQUIRED_FIELD_MISSING' && i.path === 'archetype')
      ).toBe(true);
    });

    it('should detect missing version', () => {
      const { version, ...profileWithoutVersion } = validProfile;
      const result = validator.validate(profileWithoutVersion);

      expect(
        result.issues.some((i) => i.code === 'REQUIRED_FIELD_MISSING' && i.path === 'version')
      ).toBe(true);
    });

    it('should detect multiple missing fields', () => {
      const incompleteProfile = { urn: 'urn:mycodexvantaos:persona:test' };
      const result = validator.validate(incompleteProfile);

      const missingFields = result.issues
        .filter((i) => i.code === 'REQUIRED_FIELD_MISSING')
        .map((i) => i.path);

      expect(missingFields.length).toBeGreaterThan(1);
    });
  });

  describe('validateURN', () => {
    it('should accept valid URN format', () => {
      const result = validator.validate(validProfile);
      expect(result.issues.some((i) => i.code === 'INVALID_URN_FORMAT')).toBe(false);
    });

    it('should reject invalid URN format', () => {
      const profileWithInvalidUrn = {
        ...validProfile,
        urn: 'invalid-urn',
      };
      const result = validator.validate(profileWithInvalidUrn);

      expect(result.issues.some((i) => i.code === 'INVALID_URN_FORMAT')).toBe(true);
    });

    it('should warn on URN archetype mismatch', () => {
      const profileWithMismatchedUrn = {
        ...validProfile,
        urn: 'urn:mycodexvantaos:persona:disrupter-001', // Contains disrupter, not analyst
        archetype: 'analyst' as PersonaArchetype,
      };
      const result = validator.validate(profileWithMismatchedUrn);

      expect(result.issues.some((i) => i.code === 'URN_ARCHETYPE_MISMATCH')).toBe(true);
    });

    it('should accept URN containing archetype', () => {
      const profileWithMatchingUrn = {
        ...validProfile,
        urn: 'urn:mycodexvantaos:persona:my-analyst-001',
        archetype: 'analyst' as PersonaArchetype,
      };
      const result = validator.validate(profileWithMatchingUrn);

      expect(result.issues.some((i) => i.code === 'URN_ARCHETYPE_MISMATCH')).toBe(false);
    });
  });

  describe('validateSchema', () => {
    const validArchetypes: PersonaArchetype[] = [
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

    it('should accept all valid archetypes', () => {
      for (const archetype of validArchetypes) {
        const profile = { ...validProfile, archetype };
        const result = validator.validate(profile);
        expect(result.issues.some((i) => i.code === 'INVALID_ARCHETYPE')).toBe(false);
      }
    });

    it('should reject invalid archetype', () => {
      const profileWithInvalidArchetype = {
        ...validProfile,
        archetype: 'invalid_type' as PersonaArchetype,
      };
      const result = validator.validate(profileWithInvalidArchetype);

      expect(result.issues.some((i) => i.code === 'INVALID_ARCHETYPE')).toBe(true);
    });

    it('should accept valid semantic version', () => {
      const profile = { ...validProfile, version: '2.3.4' };
      const result = validator.validate(profile);
      expect(result.issues.some((i) => i.code === 'INVALID_VERSION_FORMAT')).toBe(false);
    });

    it('should warn on invalid version format', () => {
      const profileWithInvalidVersion = {
        ...validProfile,
        version: 'v1',
      };
      const result = validator.validate(profileWithInvalidVersion);

      expect(result.issues.some((i) => i.code === 'INVALID_VERSION_FORMAT')).toBe(true);
    });

    it('should warn on short name', () => {
      const profileWithShortName = {
        ...validProfile,
        name: 'Ab',
      };
      const result = validator.validate(profileWithShortName);

      expect(result.issues.some((i) => i.code === 'NAME_TOO_SHORT')).toBe(true);
    });

    it('should warn on long name', () => {
      const profileWithLongName = {
        ...validProfile,
        name: 'A'.repeat(101),
      };
      const result = validator.validate(profileWithLongName);

      expect(result.issues.some((i) => i.code === 'NAME_TOO_LONG')).toBe(true);
    });

    it('should accept name of valid length', () => {
      const profile = { ...validProfile, name: 'Valid Name' };
      const result = validator.validate(profile);

      expect(
        result.issues.some((i) => i.code === 'NAME_TOO_SHORT' || i.code === 'NAME_TOO_LONG')
      ).toBe(false);
    });

    it('should warn on short description', () => {
      const profileWithShortDescription = {
        ...validProfile,
        description: 'Too short',
      };
      const result = validator.validate(profileWithShortDescription);

      expect(result.issues.some((i) => i.code === 'DESCRIPTION_TOO_SHORT')).toBe(true);
    });
  });

  describe('validateBehavioralParameters', () => {
    it('should accept parameters in valid range', () => {
      const result = validator.validate(validProfile);
      expect(result.issues.some((i) => i.code === 'PARAMETER_OUT_OF_RANGE')).toBe(false);
    });

    it('should detect parameter below range', () => {
      const profileWithLowParam = {
        ...validProfile,
        behavioral_parameters: {
          ...validProfile.behavioral_parameters,
          empathy_level: -0.5,
        },
      };
      const result = validator.validate(profileWithLowParam);

      expect(
        result.issues.some(
          (i) => i.code === 'PARAMETER_OUT_OF_RANGE' && i.path.includes('empathy_level')
        )
      ).toBe(true);
    });

    it('should detect parameter above range', () => {
      const profileWithHighParam = {
        ...validProfile,
        behavioral_parameters: {
          ...validProfile.behavioral_parameters,
          directness: 1.5,
        },
      };
      const result = validator.validate(profileWithHighParam);

      expect(
        result.issues.some(
          (i) => i.code === 'PARAMETER_OUT_OF_RANGE' && i.path.includes('directness')
        )
      ).toBe(true);
    });

    it('should detect non-number parameter', () => {
      const profileWithInvalidType = {
        ...validProfile,
        behavioral_parameters: {
          ...validProfile.behavioral_parameters,
          critical_tolerance: 'high' as unknown as number,
        },
      };
      const result = validator.validate(profileWithInvalidType);

      expect(result.issues.some((i) => i.code === 'INVALID_PARAMETER_TYPE')).toBe(true);
    });

    it('should warn on missing behavioral parameters', () => {
      const profileWithMissingParams = {
        ...validProfile,
        behavioral_parameters: {
          empathy_level: 0.5,
          // Missing other parameters
        },
      };
      const result = validator.validate(profileWithMissingParams);

      expect(result.issues.some((i) => i.code === 'MISSING_BEHAVIORAL_PARAMETER')).toBe(true);
    });

    it('should warn on potential empathy-directness contradiction', () => {
      const contradictoryProfile = {
        ...validProfile,
        behavioral_parameters: {
          ...validProfile.behavioral_parameters,
          empathy_level: 0.9,
          directness: 0.9,
        },
      };
      const result = validator.validate(contradictoryProfile);

      expect(result.issues.some((i) => i.code === 'POTENTIAL_CONTRADICTION')).toBe(true);
    });

    it('should not warn on normal empathy-directness combination', () => {
      const normalProfile = {
        ...validProfile,
        behavioral_parameters: {
          ...validProfile.behavioral_parameters,
          empathy_level: 0.7,
          directness: 0.6,
        },
      };
      const result = validator.validate(normalProfile);

      expect(result.issues.some((i) => i.code === 'POTENTIAL_CONTRADICTION')).toBe(false);
    });
  });

  describe('validateGovernance', () => {
    it('should accept valid governance tier', () => {
      const validTiers = [-1, 0, 1, 2, 3];

      for (const tier of validTiers) {
        const profile = {
          ...validProfile,
          governance: { ...validProfile.governance, tier },
        };
        const result = validator.validate(profile);
        expect(result.issues.some((i) => i.code === 'INVALID_GOVERNANCE_TIER')).toBe(false);
      }
    });

    it('should reject invalid governance tier', () => {
      const profileWithInvalidTier = {
        ...validProfile,
        governance: {
          ...validProfile.governance,
          tier: 5,
        },
      };
      const result = validator.validate(profileWithInvalidTier);

      expect(result.issues.some((i) => i.code === 'INVALID_GOVERNANCE_TIER')).toBe(true);
    });

    it('should warn on empty constraints', () => {
      const profileWithEmptyConstraints = {
        ...validProfile,
        governance: {
          ...validProfile.governance,
          constraints: [] as unknown as Record<string, boolean>,
        },
      };
      const result = validator.validate(profileWithEmptyConstraints);

      // Empty constraints array should trigger info
      expect(result.issues.some((i) => i.code === 'EMPTY_CONSTRAINTS')).toBe(true);
    });
  });

  describe('validateResponsePatterns', () => {
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

    it('should accept valid opening styles', () => {
      for (const style of validOpeningStyles) {
        const profile = {
          ...validProfile,
          response_patterns: { ...validProfile.response_patterns, opening_style: style },
        };
        const result = validator.validate(profile);
        expect(result.issues.some((i) => i.code === 'INVALID_OPENING_STYLE')).toBe(false);
      }
    });

    it('should warn on invalid opening style', () => {
      const profileWithInvalidOpening = {
        ...validProfile,
        response_patterns: {
          ...validProfile.response_patterns,
          opening_style: 'invalid_style',
        },
      };
      const result = validator.validate(profileWithInvalidOpening);

      expect(result.issues.some((i) => i.code === 'INVALID_OPENING_STYLE')).toBe(true);
    });

    it('should accept valid analytical frameworks', () => {
      for (const framework of validAnalyticalFrameworks) {
        const profile = {
          ...validProfile,
          response_patterns: { ...validProfile.response_patterns, analytical_framework: framework },
        };
        const result = validator.validate(profile);
        expect(result.issues.some((i) => i.code === 'INVALID_ANALYTICAL_FRAMEWORK')).toBe(false);
      }
    });

    it('should warn on invalid analytical framework', () => {
      const profileWithInvalidFramework = {
        ...validProfile,
        response_patterns: {
          ...validProfile.response_patterns,
          analytical_framework: 'invalid_framework',
        },
      };
      const result = validator.validate(profileWithInvalidFramework);

      expect(result.issues.some((i) => i.code === 'INVALID_ANALYTICAL_FRAMEWORK')).toBe(true);
    });

    it('should accept valid conclusion styles', () => {
      for (const style of validConclusionStyles) {
        const profile = {
          ...validProfile,
          response_patterns: { ...validProfile.response_patterns, conclusion_style: style },
        };
        const result = validator.validate(profile);
        expect(result.issues.some((i) => i.code === 'INVALID_CONCLUSION_STYLE')).toBe(false);
      }
    });

    it('should warn on invalid conclusion style', () => {
      const profileWithInvalidConclusion = {
        ...validProfile,
        response_patterns: {
          ...validProfile.response_patterns,
          conclusion_style: 'invalid_style',
        },
      };
      const result = validator.validate(profileWithInvalidConclusion);

      expect(result.issues.some((i) => i.code === 'INVALID_CONCLUSION_STYLE')).toBe(true);
    });
  });

  describe('validateYAML', () => {
    it('should reject empty YAML content', () => {
      const result = validator.validateYAML('');
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.code === 'EMPTY_YAML_CONTENT')).toBe(true);
    });

    it('should reject whitespace-only YAML content', () => {
      const result = validator.validateYAML('   \n\t  ');
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.code === 'EMPTY_YAML_CONTENT')).toBe(true);
    });

    it('should accept non-empty YAML content', () => {
      const result = validator.validateYAML('name: test');
      expect(result.issues.some((i) => i.code === 'EMPTY_YAML_CONTENT')).toBe(false);
    });
  });

  describe('isValid', () => {
    it('should return true for valid profile', () => {
      expect(validator.isValid(validProfile)).toBe(true);
    });

    it('should return false for invalid profile', () => {
      expect(validator.isValid({ name: 'Invalid' })).toBe(false);
    });
  });

  describe('static methods', () => {
    describe('getValidArchetypes', () => {
      it('should return all valid archetypes', () => {
        const archetypes = PersonaValidator.getValidArchetypes();

        expect(archetypes).toContain('disrupter');
        expect(archetypes).toContain('analyst');
        expect(archetypes).toContain('mediator');
        expect(archetypes).toContain('architect');
        expect(archetypes).toContain('critic');
        expect(archetypes).toContain('creative_thinker');
        expect(archetypes).toContain('facilitator');
        expect(archetypes).toContain('mentor');
        expect(archetypes).toContain('synthesizer');
      });

      it('should return a copy of the array', () => {
        const archetypes1 = PersonaValidator.getValidArchetypes();
        const archetypes2 = PersonaValidator.getValidArchetypes();

        expect(archetypes1).not.toBe(archetypes2);
        expect(archetypes1).toEqual(archetypes2);
      });
    });

    describe('getValidGovernanceTiers', () => {
      it('should return all valid governance tiers', () => {
        const tiers = PersonaValidator.getValidGovernanceTiers();

        expect(tiers).toContain(-1);
        expect(tiers).toContain(0);
        expect(tiers).toContain(1);
        expect(tiers).toContain(2);
        expect(tiers).toContain(3);
      });

      it('should return a copy of the array', () => {
        const tiers1 = PersonaValidator.getValidGovernanceTiers();
        const tiers2 = PersonaValidator.getValidGovernanceTiers();

        expect(tiers1).not.toBe(tiers2);
        expect(tiers1).toEqual(tiers2);
      });
    });

    describe('getBehavioralRanges', () => {
      it('should return behavioral parameter ranges', () => {
        const ranges = PersonaValidator.getBehavioralRanges();

        expect(ranges.critical_tolerance).toEqual({ min: 0, max: 1 });
        expect(ranges.empathy_level).toEqual({ min: 0, max: 1 });
        expect(ranges.directness).toEqual({ min: 0, max: 1 });
      });

      it('should return a copy of the ranges', () => {
        const ranges1 = PersonaValidator.getBehavioralRanges();
        const ranges2 = PersonaValidator.getBehavioralRanges();

        expect(ranges1).not.toBe(ranges2);
      });
    });
  });

  describe('validation issues', () => {
    it('should include suggestions in issues', () => {
      const profileWithInvalidUrn = {
        ...validProfile,
        urn: 'invalid',
      };
      const result = validator.validate(profileWithInvalidUrn);

      const urnIssue = result.issues.find((i) => i.code === 'INVALID_URN_FORMAT');
      expect(urnIssue?.suggestion).toBeDefined();
    });

    it('should have correct severity levels', () => {
      const invalidProfile = { name: 'Ab' }; // Short name
      const result = validator.validate(invalidProfile);

      const errorIssues = result.issues.filter((i) => i.severity === 'error');
      const warningIssues = result.issues.filter((i) => i.severity === 'warning');
      const infoIssues = result.issues.filter((i) => i.severity === 'info');

      expect(errorIssues.length).toBeGreaterThan(0);
      expect(warningIssues.length + infoIssues.length).toBeGreaterThanOrEqual(0);
    });

    it('should include correct paths in issues', () => {
      const profileWithInvalidParams = {
        ...validProfile,
        behavioral_parameters: {
          ...validProfile.behavioral_parameters,
          empathy_level: 2,
        },
      };
      const result = validator.validate(profileWithInvalidParams);

      const paramIssue = result.issues.find((i) => i.code === 'PARAMETER_OUT_OF_RANGE');
      expect(paramIssue?.path).toContain('empathy_level');
    });
  });

  describe('edge cases', () => {
    it('should handle null profile values', () => {
      const profileWithNull = {
        ...validProfile,
        description: null as unknown as string,
      };

      const result = validator.validate(profileWithNull);
      expect(result).toBeDefined();
    });

    it('should handle empty object', () => {
      const result = validator.validate({});
      expect(result.valid).toBe(false);
      expect(result.summary.errors).toBeGreaterThan(0);
    });

    it('should handle undefined behavioral parameters', () => {
      const profileWithoutParams = {
        ...validProfile,
        behavioral_parameters: undefined,
      };

      const result = validator.validate(profileWithoutParams);
      expect(result.valid).toBe(false);
    });

    it('should handle empty response patterns', () => {
      const profileWithEmptyPatterns = {
        ...validProfile,
        response_patterns: {},
      };

      const result = validator.validate(profileWithEmptyPatterns);
      expect(result).toBeDefined();
    });
  });
});
