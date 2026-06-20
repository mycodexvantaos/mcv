import { describe, test, expect } from '@jest/globals';
import { ClosureEngine, closureEngine } from '../src/closure-engine.js';

describe('ClosureEngine.evaluate', () => {
  const engine = new ClosureEngine();

  test('passes a fully valid closure context (normal)', () => {
    const res = engine.evaluate({
      namespace: 'mycodexvantaos',
      rules: {
        codes: ['mycodexvantaos-50100'],
        repositories: ['mycodexvantaos-auth-service'],
        dependencies: [['softwareos-qa-service', 'mycodexvantaos-auth-service']],
      },
    });
    expect(res.ok).toBe(true);
    expect(res.value.era.era).toBe('era-two');
    expect(res.value.checked).toBe(4);
  });

  test('aggregates multiple violations in one pass', () => {
    const res = engine.evaluate({
      namespace: 'Bad_NS',
      rules: {
        codes: ['mycodexvantaos-1'],
        repositories: ['mycodexvantaos-auth-service-prod'],
        dependencies: [['mycodexvantaos-auth-service', 'softwareos-qa-service']],
      },
    });
    expect(res.ok).toBe(false);
    expect(res.violations.length).toBeGreaterThanOrEqual(4);
  });

  test('boundary: namespace only, no rules', () => {
    const res = engine.evaluate({ namespace: 'softwareos' });
    expect(res.ok).toBe(true);
    expect(res.value.era).toBeNull();
    expect(res.value.checked).toBe(1);
  });

  test('exception: non-object context', () => {
    // @ts-expect-error intentional bad input
    expect(engine.evaluate(null).ok).toBe(false);
    // @ts-expect-error intentional bad input
    expect(engine.evaluate(42).ok).toBe(false);
  });

  test('exception: malformed dependency pair', () => {
    const res = engine.evaluate({
      namespace: 'mycodexvantaos',
      // @ts-expect-error intentional bad shape
      rules: { dependencies: ['not-a-pair'] },
    });
    expect(res.ok).toBe(false);
  });

  test('singleton export is a ClosureEngine', () => {
    expect(closureEngine).toBeInstanceOf(ClosureEngine);
  });

  test('determinism: same input -> same verdict (long-running stability)', () => {
    const ctx = { namespace: 'mycodexvantaos', rules: { codes: ['mycodexvantaos-00000'] } };
    const a = JSON.stringify(engine.evaluate(ctx));
    for (let i = 0; i < 1000; i += 1) {
      expect(JSON.stringify(engine.evaluate(ctx))).toBe(a);
    }
  });

  test('concurrency: parallel evaluations are independent', async () => {
    const jobs = Array.from({ length: 64 }, (_v, i) =>
      Promise.resolve().then(() => engine.evaluate({
        namespace: i % 2 === 0 ? 'mycodexvantaos' : 'Bad_NS',
      })));
    const results = await Promise.all(jobs);
    results.forEach((r, i) => expect(r.ok).toBe(i % 2 === 0));
  });
});
