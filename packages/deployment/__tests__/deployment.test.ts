/**
 * Comprehensive tests for Deployment package
 */

import { Deployment, DeploymentConfig, DeploymentRequest, DeploymentResult } from '../src/index';

describe('Deployment', () => {
  let deployment: Deployment;

  beforeEach(() => {
    deployment = new Deployment();
  });

  afterEach(async () => {
    await deployment.cleanup();
  });

  describe('initialize', () => {
    it('should initialize deployment service', async () => {
      await expect(deployment.initialize()).resolves.not.toThrow();
    });
  });

  describe('execute', () => {
    it('should deploy to local environment', async () => {
      const request: DeploymentRequest = {
        application: { name: 'test-app' },
        config: { target: 'local' },
      };

      const result = await deployment.execute<DeploymentResult>(request);

      expect(result).toBeDefined();
      expect(result.jobId).toMatch(/^urn:mycodexvantaos:deployment:/);
      expect(result.status).toBe('deployed');
      expect(result.url).toBe('http://localhost:3000');
    });

    it('should deploy to kubernetes', async () => {
      const request: DeploymentRequest = {
        application: { name: 'k8s-app' },
        config: {
          target: 'kubernetes',
          namespace: 'production',
          replicas: 3,
        },
      };

      const result = await deployment.execute<DeploymentResult>(request);

      expect(result.status).toBe('deployed');
      expect(result.url).toBe('http://k8s-app.mycodexvantaos.local');
    });

    it('should deploy to docker', async () => {
      const request: DeploymentRequest = {
        application: { name: 'docker-app' },
        config: { target: 'docker' },
      };

      const result = await deployment.execute<DeploymentResult>(request);

      expect(result.status).toBe('deployed');
      expect(result.url).toBe('http://localhost:3000');
    });

    it('should deploy to cloud', async () => {
      const request: DeploymentRequest = {
        application: { name: 'cloud-app' },
        config: { target: 'cloud' },
      };

      const result = await deployment.execute<DeploymentResult>(request);

      expect(result.status).toBe('deployed');
      expect(result.url).toBe('https://cloud-app.mycodexvantaos.cloud');
    });

    it('should throw error when application is missing', async () => {
      const request = {
        config: { target: 'local' },
      } as DeploymentRequest;

      await expect(deployment.execute(request)).rejects.toThrow('Invalid deployment request');
    });

    it('should throw error when config is missing', async () => {
      const request = {
        application: { name: 'test-app' },
      } as DeploymentRequest;

      await expect(deployment.execute(request)).rejects.toThrow('Invalid deployment request');
    });

    it('should record deployment in history', async () => {
      await deployment.execute({
        application: { name: 'history-app' },
        config: { target: 'local' },
      });

      const history = deployment.getHistory();
      expect(history.length).toBe(1);
    });

    it('should track deployment time', async () => {
      const result = await deployment.execute({
        application: { name: 'timed-app' },
        config: { target: 'local' },
      });

      expect(result.deploymentTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getStatus', () => {
    it('should return deployment status by jobId', async () => {
      const result = await deployment.execute({
        application: { name: 'status-app' },
        config: { target: 'local' },
      });

      const status = deployment.getStatus(result.jobId);
      expect(status).toBeDefined();
      expect(status.target).toBe('local');
    });

    it('should return undefined for non-existent jobId', () => {
      const status = deployment.getStatus('non-existent-id');
      expect(status).toBeUndefined();
    });
  });

  describe('getHistory', () => {
    it('should return empty history initially', () => {
      const history = deployment.getHistory();
      expect(history).toEqual([]);
    });

    it('should return all deployments', async () => {
      await deployment.execute({
        application: { name: 'app1' },
        config: { target: 'local' },
      });
      await deployment.execute({
        application: { name: 'app2' },
        config: { target: 'docker' },
      });

      const history = deployment.getHistory();
      expect(history.length).toBe(2);
    });
  });

  describe('cleanup', () => {
    it('should clear active deployments map', async () => {
      // Use a fresh deployment instance for this test
      const freshDeployment = new Deployment();
      await freshDeployment.initialize();

      const result = await freshDeployment.execute({
        application: { name: 'cleanup-app' },
        config: { target: 'local' },
      });

      // Verify deployment was added
      expect(freshDeployment.getStatus(result.jobId)).toBeDefined();

      await freshDeployment.cleanup();

      // Cleanup clears the deployments map
      expect(freshDeployment.getStatus(result.jobId)).toBeUndefined();
    });
  });

  describe('different configurations', () => {
    it('should handle kubernetes with resources', async () => {
      const result = await deployment.execute({
        application: { name: 'resource-app' },
        config: {
          target: 'kubernetes',
          resources: { cpu: '500m', memory: '512Mi' },
        },
      });

      expect(result.status).toBe('deployed');
    });

    it('should handle docker with resources', async () => {
      const result = await deployment.execute({
        application: { name: 'docker-resource-app' },
        config: {
          target: 'docker',
          resources: { cpu: '500m' },
        },
      });

      expect(result.status).toBe('deployed');
      expect(result.url).toBe('http://localhost:8080');
    });

    it('should handle cloud deployment with environment', async () => {
      const result = await deployment.execute({
        application: { name: 'env-app' },
        config: {
          target: 'cloud',
          environment: { NODE_ENV: 'production' },
        },
      });

      expect(result.status).toBe('deployed');
    });
  });
});
