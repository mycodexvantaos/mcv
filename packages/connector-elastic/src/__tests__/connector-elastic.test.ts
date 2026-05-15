import { ElasticConnector } from '../index';

describe('connector-elastic', () => {
  let instance: ElasticConnector;

  beforeEach(() => {
    instance = new ElasticConnector({
      nodes: ['http://localhost:9200'],
    });
  });

  test('should initialize', () => {
    expect(instance).toBeDefined();
  });

  test('should have basic functionality', () => {
    expect(typeof instance).toBe('object');
  });
});
