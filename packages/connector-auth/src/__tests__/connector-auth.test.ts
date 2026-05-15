/**
 * Auth Connector Tests
 */

import { AuthConnector, AuthConfig, User, AuthTokens, TokenPayload, AuthResult } from '../index';

describe('AuthConnector', () => {
  let connector: AuthConnector;
  let config: AuthConfig;

  beforeEach(async () => {
    config = {
      secret: 'test-secret-key',
      tokenExpiry: 3600,
      refreshTokenExpiry: 604800,
      issuer: 'test-issuer',
      audience: 'test-audience',
    };

    connector = new AuthConnector(config);
    await connector.connect();
  });

  afterEach(async () => {
    await connector.disconnect();
  });

  describe('Connection', () => {
    test('should connect successfully', async () => {
      expect(connector.isConnected()).toBe(true);
    });

    test('should disconnect successfully', async () => {
      await connector.disconnect();
      expect(connector.isConnected()).toBe(false);
    });
  });

  describe('User Registration', () => {
    test('should register new user', async () => {
      const result = await connector.register({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        roles: ['user'],
        permissions: ['read'],
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.username).toBe('testuser');
      expect(result.user?.email).toBe('test@example.com');
      expect(result.tokens).toBeDefined();
      expect(result.tokens?.accessToken).toBeDefined();
      expect(result.tokens?.refreshToken).toBeDefined();
    });

    test('should not register user with duplicate email', async () => {
      await connector.register({
        username: 'user1',
        email: 'test@example.com',
        password: 'password123',
      });

      const result = await connector.register({
        username: 'user2',
        email: 'test@example.com',
        password: 'password456',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('already registered');
    });

    test('should not register user with duplicate username', async () => {
      await connector.register({
        username: 'testuser',
        email: 'user1@example.com',
        password: 'password123',
      });

      const result = await connector.register({
        username: 'testuser',
        email: 'user2@example.com',
        password: 'password456',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('already taken');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      await connector.register({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        roles: ['user'],
        permissions: ['read', 'write'],
      });
    });

    test('should login with correct credentials', async () => {
      const result = await connector.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
    });

    test('should not login with incorrect email', async () => {
      const result = await connector.login({
        email: 'wrong@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    test('should not login with incorrect password', async () => {
      const result = await connector.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
  });

  describe('Token Refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      await connector.register({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const result = await connector.login({
        email: 'test@example.com',
        password: 'password123',
      });
      refreshToken = result.tokens!.refreshToken;
    });

    test('should refresh access token', async () => {
      const result = await connector.refresh(refreshToken);

      expect(result.success).toBe(true);
      expect(result.tokens).toBeDefined();
      expect(result.tokens?.accessToken).toBeDefined();
      expect(result.tokens?.refreshToken).toBeDefined();
    });

    test('should not refresh with invalid token', async () => {
      const result = await connector.refresh('invalid-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid refresh token');
    });
  });

  describe('User Logout', () => {
    let refreshToken: string;

    beforeEach(async () => {
      await connector.register({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const result = await connector.login({
        email: 'test@example.com',
        password: 'password123',
      });
      refreshToken = result.tokens!.refreshToken;
    });

    test('should logout successfully', async () => {
      const result = await connector.logout(refreshToken);

      expect(result.success).toBe(true);
    });

    test('should not refresh after logout', async () => {
      await connector.logout(refreshToken);

      const result = await connector.refresh(refreshToken);
      expect(result.success).toBe(false);
    });
  });

  describe('Token Verification', () => {
    let accessToken: string;

    beforeEach(async () => {
      await connector.register({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        roles: ['user'],
        permissions: ['read'],
      });

      const result = await connector.login({
        email: 'test@example.com',
        password: 'password123',
      });
      accessToken = result.tokens!.accessToken;
    });

    test('should verify valid token', async () => {
      const payload = await connector.verifyToken(accessToken);

      expect(payload).toBeDefined();
      expect(payload?.username).toBe('testuser');
      expect(payload?.email).toBe('test@example.com');
      expect(payload?.roles).toContain('user');
      expect(payload?.permissions).toContain('read');
    });

    test('should not verify invalid token', async () => {
      const payload = await connector.verifyToken('invalid-token');
      expect(payload).toBeNull();
    });
  });

  describe('User Management', () => {
    let userId: string;

    beforeEach(async () => {
      const result = await connector.register({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        roles: ['user'],
      });
      userId = result.user!.id;
    });

    test('should get user by ID', async () => {
      const user = await connector.getUser(userId);

      expect(user).toBeDefined();
      expect(user?.id).toBe(userId);
      expect(user?.username).toBe('testuser');
      expect(user).not.toHaveProperty('password');
    });

    test('should return null for non-existent user', async () => {
      const user = await connector.getUser('non-existent-id');
      expect(user).toBeNull();
    });

    test('should update user', async () => {
      const updated = await connector.updateUser(userId, {
        username: 'updateduser',
        email: 'updated@example.com',
      });

      expect(updated).toBeDefined();
      expect(updated?.username).toBe('updateduser');
      expect(updated?.email).toBe('updated@example.com');
    });

    test('should delete user', async () => {
      const deleted = await connector.deleteUser(userId);
      expect(deleted).toBe(true);

      const user = await connector.getUser(userId);
      expect(user).toBeNull();
    });

    test('should list all users', async () => {
      await connector.register({
        username: 'user2',
        email: 'user2@example.com',
        password: 'password123',
      });

      const users = await connector.listUsers();
      expect(users.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Password Management', () => {
    let userId: string;

    beforeEach(async () => {
      const result = await connector.register({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });
      userId = result.user!.id;
    });

    test('should change password with correct current password', async () => {
      const result = await connector.changePassword(userId, 'password123', 'newpassword456');

      expect(result.success).toBe(true);

      // Login with new password should work
      const loginResult = await connector.login({
        email: 'test@example.com',
        password: 'newpassword456',
      });
      expect(loginResult.success).toBe(true);
    });

    test('should not change password with incorrect current password', async () => {
      const result = await connector.changePassword(userId, 'wrongpassword', 'newpassword456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Current password is incorrect');
    });
  });

  describe('Authorization', () => {
    let userId: string;

    beforeEach(async () => {
      const result = await connector.register({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        roles: ['user', 'editor'],
        permissions: ['read', 'write', 'delete'],
      });
      userId = result.user!.id;
    });

    test('should check user has permission', async () => {
      const hasPermission = await connector.hasPermission(userId, 'read');
      expect(hasPermission).toBe(true);
    });

    test('should check user does not have permission', async () => {
      const hasPermission = await connector.hasPermission(userId, 'admin');
      expect(hasPermission).toBe(false);
    });

    test('should check user has role', async () => {
      const hasRole = await connector.hasRole(userId, 'editor');
      expect(hasRole).toBe(true);
    });

    test('should check user does not have role', async () => {
      const hasRole = await connector.hasRole(userId, 'admin');
      expect(hasRole).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should return error when not connected', async () => {
      const disconnectedConnector = new AuthConnector(config);

      const result = await disconnectedConnector.register({
        username: 'test',
        email: 'test@example.com',
        password: 'password',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not connected');
    });
  });
});
