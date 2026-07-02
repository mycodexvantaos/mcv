import { MongoConnector } from '../index';

describe('connector-mongodb', () => {
  let instance: MongoConnector;

  beforeEach(() => {
    instance = new MongoConnector({
      connectionString: 'mongodb://localhost:27017',
      database: 'test',
    });
  });

  test('should initialize', () => {
    expect(instance).toBeDefined();
  });

  test('should have basic functionality', () => {
    expect(typeof instance).toBe('object');
  });
});
