import { describe, it, expect } from 'vitest';
import { unifiedConfig } from '../config';

describe('Unified Integration Framework', () => {
  it('should load unified configuration', () => {
    expect(unifiedConfig.version).toBe('1.0.0');
    expect(unifiedConfig.systems).toBeDefined();
  });

  it('should have all systems enabled', () => {
    expect(unifiedConfig.systems.performanceTuning.enabled).toBe(true);
    expect(unifiedConfig.systems.dataAnalytics.enabled).toBe(true);
    expect(unifiedConfig.systems.continuousImprovement.enabled).toBe(true);
    expect(unifiedConfig.systems.integratedDashboard.enabled).toBe(true);
  });

  it('should have all clients enabled', () => {
    expect(unifiedConfig.clients.typescript.enabled).toBe(true);
    expect(unifiedConfig.clients.python.enabled).toBe(true);
    expect(unifiedConfig.clients.java.enabled).toBe(true);
  });

  it('should have infrastructure enabled', () => {
    expect(unifiedConfig.infrastructure.docker.enabled).toBe(true);
    expect(unifiedConfig.infrastructure.kubernetes.enabled).toBe(true);
    expect(unifiedConfig.infrastructure.monitoring.enabled).toBe(true);
  });

  it('should have web platform enabled', () => {
    expect(unifiedConfig.webPlatform.dashboard.enabled).toBe(true);
    expect(unifiedConfig.webPlatform.analytics.enabled).toBe(true);
    expect(unifiedConfig.webPlatform.optimization.enabled).toBe(true);
  });

  it('should have skills enabled', () => {
    expect(unifiedConfig.skills.applicationPipeline.enabled).toBe(true);
  });
});
