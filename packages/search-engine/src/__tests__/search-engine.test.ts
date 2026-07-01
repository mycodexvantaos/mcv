import { SearchEngine } from '../index';

describe('search-engine', () => {
  let instance: SearchEngine;

  beforeEach(() => {
    instance = new SearchEngine();
  });

  test('should initialize', () => {
    expect(instance).toBeDefined();
  });

  test('should have basic functionality', () => {
    expect(typeof instance).toBe('object');
  });
});
