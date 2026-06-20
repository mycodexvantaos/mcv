import { describe, test, expect } from '@jest/globals';
import {
  checkMachineName, checkGovernanceCode, checkRepositoryName,
  checkPlaneDependency, decomposeCode, CODE_REGEX, REPO_REGEX,
} from '../src/naming.js';

describe('checkMachineName (Sec.I.1.1)', () => {
  test('accepts canonical kebab-case', () => {
    expect(checkMachineName('mycodexvantaos-auth-service')).toHaveLength(0);
  });
  test.each([
    ['underscore', 'mycodexvantaos_00000'],
    ['dot', 'mycodexvantaos.quantum'],
    ['space', 'mycodexvantaos 00000'],
    ['uppercase', 'MyService'],
    ['empty', ''],
    ['leading hyphen', '-bad'],
  ])('rejects %s', (_label, value) => {
    expect(checkMachineName(value).length).toBeGreaterThan(0);
  });
  test('rejects non-string (exception dimension)', () => {
    // @ts-expect-error intentional bad input
    expect(checkMachineName(null).length).toBeGreaterThan(0);
  });
});

describe('checkGovernanceCode (Sec.I.3.2)', () => {
  test('accepts canonical 5-digit code', () => {
    expect(checkGovernanceCode('mycodexvantaos-50100')).toHaveLength(0);
  });
  test.each([
    'mycodexvantaos-5010',     // too short
    'mycodexvantaos-501000',   // too long
    'softwareos-50100',        // wrong namespace
    'mycodexvantaos-5010a',    // non-digit
  ])('rejects %s', (value) => {
    expect(checkGovernanceCode(value).length).toBeGreaterThan(0);
  });
  test('CODE_REGEX boundary at exactly 5 digits', () => {
    expect(CODE_REGEX.test('mycodexvantaos-00000')).toBe(true);
    expect(CODE_REGEX.test('mycodexvantaos-99999')).toBe(true);
  });
});

describe('decomposeCode (Sec.I.3.1)', () => {
  test('decomposes security era code', () => {
    expect(decomposeCode('50100')).toMatchObject({
      layerGroup: 50, domain: 1, subtype: 0, sequence: 0, era: 'era-two',
    });
  });
  test.each([
    ['00000', 'meta-governance'],
    ['10000', 'era-one'],
    ['90000', 'cross-era-governance'],
  ])('maps %s to %s', (code, era) => {
    expect(decomposeCode(code).era).toBe(era);
  });
});

describe('checkRepositoryName (Sec.I.6.2/Sec.I.6.3/Sec.I.7)', () => {
  test('accepts vocabulary-valid repo', () => {
    expect(checkRepositoryName('mycodexvantaos-auth-service')).toHaveLength(0);
    expect(REPO_REGEX.test('softwareos-qa-service')).toBe(true);
  });
  test('rejects unknown domain', () => {
    const v = checkRepositoryName('mycodexvantaos-unknown-service');
    expect(v.some((x) => x.rule === 'I.7.2')).toBe(true);
  });
  test('rejects unknown function', () => {
    const v = checkRepositoryName('mycodexvantaos-auth-thing');
    expect(v.some((x) => x.rule === 'I.7.3')).toBe(true);
  });
  test('rejects forbidden environment token', () => {
    const v = checkRepositoryName('mycodexvantaos-auth-service-prod');
    expect(v.some((x) => x.rule === 'I.6.3')).toBe(true);
  });
  test('rejects bad shape before vocabulary', () => {
    expect(checkRepositoryName('Bad_Name').length).toBeGreaterThan(0);
  });
  test('rejects two-token name failing repo regex', () => {
    expect(checkRepositoryName('mycodexvantaos-auth').length).toBeGreaterThan(0);
  });
  test('rejects unknown namespace token', () => {
    const v = checkRepositoryName('otheros-auth-service');
    expect(v.length).toBeGreaterThan(0);
  });
});

describe('checkPlaneDependency (Sec.I.2.4)', () => {
  test('allows product -> control', () => {
    expect(checkPlaneDependency('softwareos-qa-service', 'mycodexvantaos-auth-service'))
      .toHaveLength(0);
  });
  test('forbids control -> product', () => {
    const v = checkPlaneDependency('mycodexvantaos-auth-service', 'softwareos-qa-service');
    expect(v).toHaveLength(1);
    expect(v[0].rule).toBe('I.2.4');
  });
  test('allows control -> control', () => {
    expect(checkPlaneDependency('mycodexvantaos-auth-service', 'mycodexvantaos-policy-engine'))
      .toHaveLength(0);
  });
});
