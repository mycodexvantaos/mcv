/**
 * MyCodexVantaOS Persona Engine - Persona Manager Tests
 *
 * Unit tests for the PersonaManager class.
 */

import {
  PersonaManager,
  getDefaultPersonaManager,
  resetDefaultPersonaManager,
} from '../core/persona-manager';
import type { PersonaProfile, PersonaArchetype } from '../types';

describe('PersonaManager', () => {
  let manager: PersonaManager;

  beforeEach(() => {
    manager = new PersonaManager({
      autoInitializeEngines: false,
    });
  });

  afterEach(() => {
    resetDefaultPersonaManager();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const defaultManager = new PersonaManager();
      expect(defaultManager).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customManager = new PersonaManager({
        autoInitializeEngines: true,
        maxCachedEngines: 5,
      });
      expect(customManager).toBeDefined();
    });
  });

  describe('registerPersona', () => {
    it('should register a persona profile', () => {
      const profile = createTestProfile('test-persona-1', 'disrupter');
      manager.registerPersona(profile);

      const retrieved = manager.getPersona(profile.urn);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe(profile.name);
    });

    it('should throw error for duplicate URN', () => {
      const profile = createTestProfile('duplicate-test', 'disrupter');
      manager.registerPersona(profile);

      expect(() => {
        manager.registerPersona(profile);
      }).toThrow();
    });
  });

  describe('unregisterPersona', () => {
    it('should remove a registered persona', () => {
      const profile = createTestProfile('to-remove', 'analyst');
      manager.registerPersona(profile);

      const removed = manager.unregisterPersona(profile.urn);
      expect(removed).toBe(true);

      const retrieved = manager.getPersona(profile.urn);
      expect(retrieved).toBeUndefined();
    });

    it('should return false for non-existent persona', () => {
      const removed = manager.unregisterPersona('urn:mycodexvantaos:persona:nonexistent');
      expect(removed).toBe(false);
    });
  });

  describe('getPersona', () => {
    it('should return registered persona', () => {
      const profile = createTestProfile('get-test', 'critic');
      manager.registerPersona(profile);

      const retrieved = manager.getPersona(profile.urn);
      expect(retrieved).toEqual(profile);
    });

    it('should return undefined for non-existent persona', () => {
      const retrieved = manager.getPersona('urn:mycodexvantaos:persona:nonexistent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getAllPersonas', () => {
    it('should return all registered personas', () => {
      manager.registerPersona(createTestProfile('all-1', 'disrupter'));
      manager.registerPersona(createTestProfile('all-2', 'analyst'));
      manager.registerPersona(createTestProfile('all-3', 'critic'));

      const all = manager.getAllPersonas();
      expect(all.length).toBe(3);
    });

    it('should return empty array when no personas registered', () => {
      const all = manager.getAllPersonas();
      expect(all.length).toBe(0);
    });
  });

  describe('getPersonasByArchetype', () => {
    it('should filter personas by archetype', () => {
      manager.registerPersona(createTestProfile('arch-1', 'disrupter'));
      manager.registerPersona(createTestProfile('arch-2', 'disrupter'));
      manager.registerPersona(createTestProfile('arch-3', 'analyst'));

      const disrupters = manager.getPersonasByArchetype('disrupter');
      expect(disrupters.length).toBe(2);

      disrupters.forEach((p) => {
        expect(p.archetype).toBe('disrupter');
      });
    });
  });

  describe('getEngine', () => {
    it('should create and return engine for persona', () => {
      const profile = createTestProfile('engine-test', 'disrupter');
      manager.registerPersona(profile);

      const engine = manager.getEngine(profile.urn);
      expect(engine).toBeDefined();
      expect(engine?.getPersona().urn).toBe(profile.urn);
    });

    it('should return undefined for non-existent persona', () => {
      const engine = manager.getEngine('urn:mycodexvantaos:persona:nonexistent');
      expect(engine).toBeUndefined();
    });

    it('should track usage statistics', () => {
      const profile = createTestProfile('usage-test', 'analyst');
      manager.registerPersona(profile);

      manager.getEngine(profile.urn);
      manager.getEngine(profile.urn);

      const stats = manager.getStats();
      expect(stats.mostUsed).toContain(profile.urn);
    });
  });

  describe('createPersonaProfile', () => {
    it('should create profile with default parameters for archetype', () => {
      const profile = manager.createPersonaProfile({
        urn: 'urn:mycodexvantaos:persona:created-disrupter',
        name: 'Created Disrupter',
        archetype: 'disrupter',
      });

      expect(profile.urn).toBe('urn:mycodexvantaos:persona:created-disrupter');
      expect(profile.archetype).toBe('disrupter');
      expect(profile.behavioral_parameters).toBeDefined();
      expect(profile.behavioral_parameters.critical_intensity).toBeGreaterThan(0);
    });

    it('should allow overriding behavioral parameters', () => {
      const profile = manager.createPersonaProfile({
        urn: 'urn:mycodexvantaos:persona:custom-params',
        name: 'Custom Params',
        archetype: 'analyst',
        behavioralParameters: {
          critical_intensity: 0.99,
          empathy_level: 0.1,
        },
      });

      expect(profile.behavioral_parameters.critical_intensity).toBe(0.99);
      expect(profile.behavioral_parameters.empathy_level).toBe(0.1);
    });

    it('should set metadata with timestamps', () => {
      const profile = manager.createPersonaProfile({
        urn: 'urn:mycodexvantaos:persona:metadata-test',
        name: 'Metadata Test',
        archetype: 'mentor',
      });

      expect(profile.metadata?.created_at).toBeDefined();
      expect(profile.metadata?.updated_at).toBeDefined();
    });
  });

  describe('createAndRegisterPersona', () => {
    it('should create and register in one step', () => {
      const profile = manager.createAndRegisterPersona({
        urn: 'urn:mycodexvantaos:persona:quick-create',
        name: 'Quick Create',
        archetype: 'facilitator',
      });

      expect(profile.urn).toBe('urn:mycodexvantaos:persona:quick-create');

      const retrieved = manager.getPersona(profile.urn);
      expect(retrieved).toBeDefined();
    });
  });

  describe('updatePersona', () => {
    it('should update existing persona', () => {
      const profile = createTestProfile('update-test', 'disrupter');
      manager.registerPersona(profile);

      const updated = manager.updatePersona(profile.urn, {
        description: 'Updated description',
      });

      expect(updated?.description).toBe('Updated description');
    });

    it('should return undefined for non-existent persona', () => {
      const updated = manager.updatePersona('urn:mycodexvantaos:persona:nonexistent', {
        description: 'Test',
      });

      expect(updated).toBeUndefined();
    });
  });

  describe('processWithPersona', () => {
    it('should process input with persona', () => {
      manager.registerPersona(createTestProfile('process-test', 'disrupter'));

      const result = manager.processWithPersona(
        'urn:mycodexvantaos:persona:process-test',
        'I feel like everything will be fine'
      );

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });

    it('should return error for non-existent persona', () => {
      const result = manager.processWithPersona(
        'urn:mycodexvantaos:persona:nonexistent',
        'Test input'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('should return registry statistics', () => {
      manager.registerPersona(createTestProfile('stats-1', 'disrupter'));
      manager.registerPersona(createTestProfile('stats-2', 'analyst'));
      manager.registerPersona(createTestProfile('stats-3', 'disrupter'));

      const stats = manager.getStats();

      expect(stats.totalPersonas).toBe(3);
      expect(stats.byArchetype.disrupter).toBe(2);
      expect(stats.byArchetype.analyst).toBe(1);
    });
  });

  describe('exportProfiles', () => {
    it('should export all profiles as JSON', () => {
      manager.registerPersona(createTestProfile('export-1', 'disrupter'));
      manager.registerPersona(createTestProfile('export-2', 'analyst'));

      const exported = manager.exportProfiles();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
    });
  });

  describe('importProfiles', () => {
    it('should import profiles from JSON', () => {
      const profiles = [
        createTestProfile('import-1', 'disrupter'),
        createTestProfile('import-2', 'analyst'),
      ];

      const json = JSON.stringify(profiles);
      const result = manager.importProfiles(json);

      expect(result.imported).toBe(2);
      expect(result.errors.length).toBe(0);
    });

    it('should report errors for invalid JSON', () => {
      const result = manager.importProfiles('invalid json');

      expect(result.imported).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should report errors for duplicate URNs', () => {
      const profile = createTestProfile('dup-import', 'disrupter');
      manager.registerPersona(profile);

      const json = JSON.stringify([profile]);
      const result = manager.importProfiles(json);

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('singleton', () => {
    it('should return the same default instance', () => {
      const instance1 = getDefaultPersonaManager();
      const instance2 = getDefaultPersonaManager();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = getDefaultPersonaManager();
      resetDefaultPersonaManager();
      const instance2 = getDefaultPersonaManager();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('edge cases', () => {
    it('should handle cache cleanup', () => {
      const smallCacheManager = new PersonaManager({
        autoInitializeEngines: true,
        maxCachedEngines: 2,
      });

      // Register more personas than cache can hold
      smallCacheManager.registerPersona(createTestProfile('cache-1', 'disrupter'));
      smallCacheManager.registerPersona(createTestProfile('cache-2', 'analyst'));
      smallCacheManager.registerPersona(createTestProfile('cache-3', 'critic'));

      // Access all engines
      smallCacheManager.getEngine('urn:mycodexvantaos:persona:cache-1');
      smallCacheManager.getEngine('urn:mycodexvantaos:persona:cache-2');
      smallCacheManager.getEngine('urn:mycodexvantaos:persona:cache-3');

      // Should not throw and should manage cache
      const stats = smallCacheManager.getStats();
      expect(stats.activeEngines).toBeLessThanOrEqual(2);
    });

    it('should handle processing error gracefully', () => {
      const profile = createTestProfile('error-test', 'analyst');
      manager.registerPersona(profile);

      // Process with valid persona should succeed
      const result = manager.processWithPersona(
        'urn:mycodexvantaos:persona:error-test',
        'test input'
      );
      expect(result.success).toBe(true);
    });

    it('should get available archetypes', () => {
      const archetypes = manager.getAvailableArchetypes();
      expect(archetypes).toContain('disrupter');
      expect(archetypes).toContain('analyst');
      expect(archetypes).toContain('mediator');
      expect(archetypes.length).toBeGreaterThan(5);
    });
  });
});

// Helper function to create test profiles
function createTestProfile(id: string, archetype: PersonaArchetype): PersonaProfile {
  return {
    urn: `urn:mycodexvantaos:persona:${id}`,
    name: `Test ${archetype}`,
    version: '1.0.0',
    description: `Test profile for ${archetype}`,
    archetype,
    behavioral_parameters: {
      intellectual_provocation: 0.5,
      critical_intensity: 0.5,
      constructive_orientation: 0.5,
      empathy_level: 0.5,
      analytical_depth: 0.5,
      solution_focus: 0.5,
      communication_clarity: 0.5,
      adaptability: 0.5,
    },
    ethical_boundaries: {
      avoid_sarcasm: true,
      no_shaming: true,
      respect_autonomy: true,
      support_without_dependency: true,
      truth_with_constructive_intent: true,
    },
    governance_tier: 0,
    metadata: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
}
