import { describe, test, expect } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initLogger } from '../src/logger.js';
import { checkRepositoryName } from '../src/naming.js';

describe('wiring & default branches', () => {
  test('createApp builds a default logger when none injected', async () => {
    const app = createApp();
    const res = await request(app).get('/healthz');
    expect(res.statusCode).toBe(200);
  });

  test('initLogger honors explicit level option', () => {
    const logger = initLogger({ level: 'silent' });
    expect(logger.level).toBe('silent');
  });

  test('initLogger falls back to default level', () => {
    const logger = initLogger();
    expect(typeof logger.level).toBe('string');
  });

  test('checkRepositoryName short-circuits on bad machine name', () => {
    const v = checkRepositoryName('UPPER');
    expect(v[0].rule).toBe('I.1.1');
  });

  test('closure route emits 422 audit with x-actor header', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/governance/closure')
      .set('x-actor', 'auditor')
      .send({ namespace: 'mycodexvantaos', rules: { repositories: ['bad_repo'] } });
    expect(res.statusCode).toBe(422);
    expect(res.body.audit.actor).toBe('auditor');
  });
});
