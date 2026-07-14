/**
 * Integration Tests for MyCodexVantaOS Packages
 */

import { Builder } from '@mycodexvantaos/builder';
import { Runtime } from '@mycodexvantaos/runtime';
import { Deployment } from '@mycodexvantaos/deployment';

describe('Package Integration', () => {
  describe('Builder → Runtime Flow', () => {
    it('should build and execute applications', async () => {
      const builder = new Builder();
      const runtime = new Runtime();

      // Initialize both services
      await builder.initialize();
      await runtime.initialize();

      try {
        // Build an application
        const app = await builder.execute({
          name: 'test-app',
          type: 'simple',
        });

        expect(app).toBeDefined();

        // Execute in runtime
        const execution = await runtime.execute({
          application: app,
        });

        expect(execution).toBeDefined();
      } finally {
        await builder.cleanup();
        await runtime.cleanup();
      }
    });
  });

  describe('Runtime → Deployment Flow', () => {
    it('should deploy executed applications', async () => {
      const runtime = new Runtime();
      const deployment = new Deployment();

      await runtime.initialize();
      await deployment.initialize();

      try {
        // Execute application
        const app = await runtime.execute({
          name: 'test-app',
        });

        // Deploy application
        const deployed = await deployment.execute({
          application: app,
          target: 'local',
        });

        expect(deployed).toBeDefined();
      } finally {
        await runtime.cleanup();
        await deployment.cleanup();
      }
    });
  });
});
