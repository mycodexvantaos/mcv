import { ContractEngine } from '../src/engine';
import { ValidationStatus } from '../src/types';

describe('ContractEngine', () => {
  let engine: ContractEngine;

  beforeEach(() => {
    engine = new ContractEngine();
  });

  describe('Constructor', () => {
    it('should initialize successfully', () => {
      expect(engine).toBeDefined();
    });
  });

  describe('executeContract', () => {
    it('should execute contract with valid context', async () => {
      const result = await engine.executeContract(
        'contract-001',
        { userId: 'user-123', intent: 'Deploy application to production' },
        { availableCpu: 100 }
      );

      expect(result).toBeDefined();
      expect(result.executionId).toBeDefined();
      expect(result.contract.id).toBe('contract-001');
    });

    it('should generate unique execution IDs', async () => {
      const result1 = await engine.executeContract('contract-001', {
        userId: 'user-123',
        intent: 'Deploy application',
      });
      const result2 = await engine.executeContract('contract-002', {
        userId: 'user-123',
        intent: 'Deploy application',
      });

      expect(result1.executionId).not.toBe(result2.executionId);
    });

    it('should set status to completed on successful validation', async () => {
      const result = await engine.executeContract('contract-001', {
        userId: 'user-123',
        intent: 'Deploy application to production environment',
      });

      expect(result.status).toBe('completed');
    });

    it('should set status to failed when validation fails', async () => {
      const result = await engine.executeContract(
        'contract-001',
        { intent: '' } // Empty intent should fail validation
      );

      expect(result.status).toBe('failed');
      expect(result.error).toBe('Validation failed');
    });

    it('should include validation results', async () => {
      const result = await engine.executeContract('contract-001', {
        userId: 'user-123',
        intent: 'Deploy application to production',
      });

      expect(result.validationResults).toBeDefined();
      expect(Array.isArray(result.validationResults)).toBe(true);
    });

    it('should handle system context correctly', async () => {
      const result = await engine.executeContract(
        'contract-001',
        { userId: 'user-123', intent: 'Deploy application' },
        { quotaLimit: 100, quotaUsed: 50 }
      );

      expect(result.systemContext).toEqual({ quotaLimit: 100, quotaUsed: 50 });
    });

    it('should use empty system context when not provided', async () => {
      const result = await engine.executeContract('contract-001', {
        userId: 'user-123',
        intent: 'Deploy application',
      });

      expect(result.systemContext).toEqual({});
    });

    it('should create contract with correct ID', async () => {
      const result = await engine.executeContract('my-contract-id', {
        userId: 'user-123',
        intent: 'Deploy application',
      });

      expect(result.contract.id).toBe('my-contract-id');
      expect(result.contract.name).toBe('Contract-my-contract-id');
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      // Pass context that will fail validation
      const result = await engine.executeContract(
        'contract-001',
        {} // Missing required fields
      );

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
    });

    it('should not throw on validation failure', async () => {
      await expect(engine.executeContract('contract-001', { intent: '' })).resolves.toBeDefined();
    });
  });

  describe('Status Transitions', () => {
    it('should transition through correct statuses on success', async () => {
      // We can't observe intermediate statuses directly, but we can verify final status
      const result = await engine.executeContract('contract-001', {
        userId: 'user-123',
        intent: 'Deploy application to production',
      });

      expect(result.status).toBe('completed');
    });

    it('should end with failed status on validation failure', async () => {
      const result = await engine.executeContract(
        'contract-001',
        { intent: '' } // Will fail at L-A intent clarity
      );

      expect(result.status).toBe('failed');
    });
  });

  describe('Integration with MultiLayerValidator', () => {
    it('should run all validation layers for valid context', async () => {
      const result = await engine.executeContract(
        'contract-001',
        {
          userId: 'user-123',
          intent: 'Deploy application to production environment',
          piiClearance: true,
        },
        {
          quotaLimit: 100,
          quotaUsed: 50,
          requestFrequency: 10,
          generatedDataSize: 1024,
          historicalP95Ms: 100,
        }
      );

      expect(result.validationResults?.length).toBeGreaterThan(0);
      // Should have results from all 6 layers (18 gates total)
      expect(result.validationResults?.length).toBe(18);
    });

    it('should collect gate results from all layers', async () => {
      const result = await engine.executeContract('contract-001', {
        userId: 'user-123',
        intent: 'Deploy application',
      });

      const gateIds = result.validationResults?.map((r) => r.gateId);
      expect(gateIds).toContain('intent-clarity');
      expect(gateIds).toContain('goal-alignment');
      expect(gateIds).toContain('user-authorization');
    });
  });
});
