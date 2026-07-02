import { ComplianceChecker } from '../index';

describe('compliance-checker', () => {
  let instance: ComplianceChecker;

  beforeEach(() => {
    instance = new ComplianceChecker();
  });

  test('should initialize', () => {
    expect(instance).toBeDefined();
  });

  test('should have basic functionality', () => {
    expect(typeof instance).toBe('object');
  });
});
