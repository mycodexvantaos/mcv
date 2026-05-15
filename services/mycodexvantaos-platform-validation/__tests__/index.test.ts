import { ContractEngine, MultiLayerValidator } from '../src/index';
import { ValidationLayer, ValidationStatus, ValidationSeverity } from '../src/index';

describe('Index Exports', () => {
  describe('ContractEngine Export', () => {
    it('should export ContractEngine class', () => {
      expect(ContractEngine).toBeDefined();
      expect(typeof ContractEngine).toBe('function');
    });

    it('should create ContractEngine instance', () => {
      const engine = new ContractEngine();
      expect(engine).toBeInstanceOf(ContractEngine);
    });
  });

  describe('MultiLayerValidator Export', () => {
    it('should export MultiLayerValidator class', () => {
      expect(MultiLayerValidator).toBeDefined();
      expect(typeof MultiLayerValidator).toBe('function');
    });

    it('should create MultiLayerValidator instance', () => {
      const validator = new MultiLayerValidator();
      expect(validator).toBeInstanceOf(MultiLayerValidator);
    });
  });

  describe('Types Export', () => {
    it('should export ValidationLayer enum', () => {
      expect(ValidationLayer).toBeDefined();
      expect(ValidationLayer.L_A_INTENT).toBe('L-A-Intent-Validation');
    });

    it('should export ValidationStatus enum', () => {
      expect(ValidationStatus).toBeDefined();
      expect(ValidationStatus.PASSED).toBe('passed');
      expect(ValidationStatus.FAILED).toBe('failed');
    });

    it('should export ValidationSeverity enum', () => {
      expect(ValidationSeverity).toBeDefined();
      expect(ValidationSeverity.HIGH).toBe('high');
      expect(ValidationSeverity.CRITICAL).toBe('critical');
    });
  });

  describe('Integration', () => {
    it('should work with exported classes together', async () => {
      const validator = new MultiLayerValidator();
      const result = await validator.validate({
        executionId: 'test',
        contract: {},
        userContext: { userId: 'user-123', intent: 'Deploy application' },
        systemContext: {},
      });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('results');
    });

    it('should execute contract with exported engine', async () => {
      const engine = new ContractEngine();
      const result = await engine.executeContract('test-contract', {
        userId: 'user-123',
        intent: 'Deploy application to production',
      });

      expect(result.status).toBe('completed');
    });
  });
});
