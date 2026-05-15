import {
  ValidationLayer,
  ValidationStatus,
  ValidationSeverity,
  ValidationResult,
  LayerValidationResult,
  ExecutionContext,
} from '../src/types';

describe('Types Module', () => {
  describe('ValidationLayer Enum', () => {
    it('should have all expected layers', () => {
      expect(ValidationLayer.L_A_INTENT).toBe('L-A-Intent-Validation');
      expect(ValidationLayer.L_B_SECURITY).toBe('L-B-Security-Validation');
      expect(ValidationLayer.L_C_COMPLIANCE).toBe('L-C-Compliance-Validation');
      expect(ValidationLayer.L_D_RESOURCE).toBe('L-D-Resource-Validation');
      expect(ValidationLayer.L_E_BEHAVIORAL).toBe('L-E-Behavioral-Validation');
      expect(ValidationLayer.L_F_QUALITY).toBe('L-F-Quality-Validation');
    });

    it('should have 6 validation layers', () => {
      const layers = Object.values(ValidationLayer);
      expect(layers).toHaveLength(6);
    });
  });

  describe('ValidationStatus Enum', () => {
    it('should have all expected statuses', () => {
      expect(ValidationStatus.PASSED).toBe('passed');
      expect(ValidationStatus.FAILED).toBe('failed');
      expect(ValidationStatus.WARNING).toBe('warning');
      expect(ValidationStatus.TIMEOUT).toBe('timeout');
      expect(ValidationStatus.ERROR).toBe('error');
    });

    it('should have 5 validation statuses', () => {
      const statuses = Object.values(ValidationStatus);
      expect(statuses).toHaveLength(5);
    });
  });

  describe('ValidationSeverity Enum', () => {
    it('should have all expected severity levels', () => {
      expect(ValidationSeverity.CRITICAL).toBe('critical');
      expect(ValidationSeverity.HIGH).toBe('high');
      expect(ValidationSeverity.MEDIUM).toBe('medium');
      expect(ValidationSeverity.LOW).toBe('low');
      expect(ValidationSeverity.INFO).toBe('info');
    });

    it('should have 5 severity levels', () => {
      const severities = Object.values(ValidationSeverity);
      expect(severities).toHaveLength(5);
    });
  });

  describe('ValidationResult Interface', () => {
    it('should create valid ValidationResult object', () => {
      const result: ValidationResult = {
        layerId: 'L-A',
        gateId: 'intent-clarity',
        gateName: 'intent clarity',
        status: ValidationStatus.PASSED,
        severity: ValidationSeverity.HIGH,
        message: 'Intent clarity verification passed',
        durationMs: 5,
      };

      expect(result.layerId).toBe('L-A');
      expect(result.gateId).toBe('intent-clarity');
      expect(result.status).toBe(ValidationStatus.PASSED);
    });
  });

  describe('LayerValidationResult Interface', () => {
    it('should create valid LayerValidationResult object', () => {
      const result: LayerValidationResult = {
        layerId: 'L-A',
        layerName: ValidationLayer.L_A_INTENT,
        status: ValidationStatus.PASSED,
        gateResults: [
          {
            layerId: 'L-A',
            gateId: 'intent-clarity',
            gateName: 'intent clarity',
            status: ValidationStatus.PASSED,
            severity: ValidationSeverity.HIGH,
            message: 'Passed',
            durationMs: 5,
          },
        ],
        totalDurationMs: 15,
      };

      expect(result.layerId).toBe('L-A');
      expect(result.gateResults).toHaveLength(1);
      expect(result.totalDurationMs).toBe(15);
    });
  });

  describe('ExecutionContext Interface', () => {
    it('should create valid ExecutionContext object', () => {
      const context: ExecutionContext = {
        executionId: 'test-001',
        contract: { targetState: 'running' },
        userContext: { userId: 'user-123', intent: 'Deploy' },
        systemContext: { availableCpu: 100 },
      };

      expect(context.executionId).toBe('test-001');
      expect(context.contract.targetState).toBe('running');
      expect(context.userContext.userId).toBe('user-123');
    });

    it('should support optional fields', () => {
      const context: ExecutionContext = {
        executionId: 'test-002',
        contract: {},
        userContext: {},
        systemContext: {},
        validationResults: [],
        status: 'pending',
        error: undefined,
      };

      expect(context.validationResults).toEqual([]);
      expect(context.status).toBe('pending');
    });
  });
});
