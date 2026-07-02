import { ApiGateway } from '../index';

describe('api-gateway', () => {
  let instance: ApiGateway;

  beforeEach(() => {
    instance = new ApiGateway({ port: 3000, routes: [] });
  });

  test('should initialize', () => {
    expect(instance).toBeDefined();
  });

  test('should have basic functionality', () => {
    expect(typeof instance).toBe('object');
  });
});
