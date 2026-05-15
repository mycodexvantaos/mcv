import {
  SessionRuntime,
  MemorySessionStore,
  SessionStore,
  SessionData,
  SessionRuntimeOptions,
} from '../src/index';

describe('SessionRuntime', () => {
  let runtime: SessionRuntime;

  beforeEach(() => {
    runtime = new SessionRuntime({
      defaultTTL: 3600,
      cleanupInterval: 10000,
      autoStartCleanup: false,
    });
  });

  afterEach(async () => {
    await runtime.shutdown();
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      const defaultRuntime = new SessionRuntime();
      expect(defaultRuntime).toBeInstanceOf(SessionRuntime);
    });

    it('should initialize with custom options', () => {
      const store = new MemorySessionStore();
      const customRuntime = new SessionRuntime({
        defaultTTL: 7200,
        cleanupInterval: 5000,
        store,
      });
      expect(customRuntime).toBeInstanceOf(SessionRuntime);
    });
  });

  describe('create', () => {
    it('should create a new session', async () => {
      const session = await runtime.create('user123');

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.userId).toBe('user123');
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.expiresAt).toBeInstanceOf(Date);
    });

    it('should create session with custom data', async () => {
      const session = await runtime.create('user123', {
        data: { role: 'admin', permissions: ['read', 'write'] },
      });

      expect(session.data.role).toBe('admin');
      expect(session.data.permissions).toEqual(['read', 'write']);
    });

    it('should create session without user ID', async () => {
      const session = await runtime.create();

      expect(session.id).toBeDefined();
      expect(session.userId).toBeUndefined();
    });

    it('should create session with custom TTL', async () => {
      const shortTTL = 1; // 1 second
      const session = await runtime.create('user123', { ttl: shortTTL });

      expect(session.expiresAt).toBeDefined();

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const retrieved = await runtime.get(session.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('get', () => {
    it('should retrieve existing session', async () => {
      const created = await runtime.create('user123');
      const retrieved = await runtime.get(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.userId).toBe('user123');
    });

    it('should return null for non-existent session', async () => {
      const retrieved = await runtime.get('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should return null for expired session', async () => {
      const session = await runtime.create('user123', { ttl: -1 });

      const retrieved = await runtime.get(session.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('update', () => {
    it('should update session data', async () => {
      const session = await runtime.create('user123', { data: { role: 'user' } });

      const updated = await runtime.update(session.id, {
        data: { role: 'admin' },
      });

      expect(updated).toBeDefined();
      expect(updated?.data.role).toBe('admin');
      expect(updated?.updatedAt).not.toEqual(session.updatedAt);
    });

    it('should return null for non-existent session', async () => {
      const updated = await runtime.update('non-existent', { data: {} });
      expect(updated).toBeNull();
    });

    it('should preserve session ID and creation time', async () => {
      const session = await runtime.create('user123');

      const updated = await runtime.update(session.id, {
        data: { newField: 'value' },
      });

      expect(updated?.id).toBe(session.id);
      expect(updated?.createdAt).toEqual(session.createdAt);
      expect(updated?.updatedAt).not.toEqual(session.updatedAt);
    });

    it('should merge data', async () => {
      const session = await runtime.create('user123', { data: { role: 'user', name: 'John' } });

      const updated = await runtime.update(session.id, {
        data: { role: 'admin' },
      });

      expect(updated?.data.role).toBe('admin');
      expect(updated?.data.name).toBe('John');
    });
  });

  describe('delete', () => {
    it('should delete existing session', async () => {
      const session = await runtime.create('user123');

      const deleted = await runtime.delete(session.id);

      expect(deleted).toBe(true);

      const retrieved = await runtime.get(session.id);
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent session', async () => {
      const deleted = await runtime.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('deleteUserSessions', () => {
    it('should delete all sessions for a user', async () => {
      await runtime.create('user123');
      await runtime.create('user123');
      await runtime.create('user456');

      const deleted = await runtime.deleteUserSessions('user123');

      expect(deleted).toBe(2);

      const user123Sessions = await runtime.getUserSessions('user123');
      const user456Sessions = await runtime.getUserSessions('user456');

      expect(user123Sessions).toHaveLength(0);
      expect(user456Sessions).toHaveLength(1);
    });

    it('should return 0 for user with no sessions', async () => {
      const deleted = await runtime.deleteUserSessions('non-existent');
      expect(deleted).toBe(0);
    });
  });

  describe('getAll', () => {
    it('should return all sessions', async () => {
      await runtime.create('user1');
      await runtime.create('user2');
      await runtime.create('user3');

      const sessions = await runtime.getAll();
      expect(sessions).toHaveLength(3);
    });

    it('should return empty array when no sessions', async () => {
      const sessions = await runtime.getAll();
      expect(sessions).toHaveLength(0);
    });
  });

  describe('getActiveSessions', () => {
    it('should return only non-expired sessions', async () => {
      await runtime.create('user1', { ttl: 3600 });
      await runtime.create('user2', { ttl: -1 });

      const activeSessions = await runtime.getActiveSessions();
      expect(activeSessions).toHaveLength(1);
      expect(activeSessions[0].userId).toBe('user1');
    });
  });

  describe('getUserSessions', () => {
    it('should return sessions for specific user', async () => {
      await runtime.create('user1');
      await runtime.create('user2');
      await runtime.create('user1');

      const user1Sessions = await runtime.getUserSessions('user1');
      const user2Sessions = await runtime.getUserSessions('user2');

      expect(user1Sessions).toHaveLength(2);
      expect(user2Sessions).toHaveLength(1);
    });
  });

  describe('clear', () => {
    it('should clear all sessions', async () => {
      await runtime.create('user1');
      await runtime.create('user2');
      await runtime.create('user3');

      await runtime.clear();

      const sessions = await runtime.getAll();
      expect(sessions).toHaveLength(0);
    });
  });

  describe('extendSession', () => {
    it('should extend session TTL', async () => {
      const session = await runtime.create('user123', { ttl: 1 });
      const originalExpiresAt = session.expiresAt;

      await new Promise((resolve) => setTimeout(resolve, 500));

      const extended = await runtime.extendSession(session.id, 3600);

      expect(extended).toBeDefined();
      expect(extended?.expiresAt).not.toEqual(originalExpiresAt);
    });

    it('should return null for non-existent session', async () => {
      const extended = await runtime.extendSession('non-existent');
      expect(extended).toBeNull();
    });
  });

  describe('isValid', () => {
    it('should return true for valid session', async () => {
      const session = await runtime.create('user123');
      const isValid = await runtime.isValid(session.id);

      expect(isValid).toBe(true);
    });

    it('should return false for invalid session', async () => {
      const isValid = await runtime.isValid('non-existent');
      expect(isValid).toBe(false);
    });

    it('should return false for expired session', async () => {
      const session = await runtime.create('user123', { ttl: -1 }); // Negative TTL = already expired

      const isValid = await runtime.isValid(session.id);
      expect(isValid).toBe(false);
    });
  });

  describe('getData', () => {
    it('should get session data field', async () => {
      const session = await runtime.create('user123', {
        data: { role: 'admin', name: 'John' },
      });

      const role = await runtime.getData(session.id, 'role');
      expect(role).toBe('admin');
    });

    it('should return null for non-existent field', async () => {
      const session = await runtime.create('user123');
      const value = await runtime.getData(session.id, 'nonExistent');

      expect(value).toBeNull();
    });

    it('should return null for non-existent session', async () => {
      const value = await runtime.getData('non-existent', 'role');
      expect(value).toBeNull();
    });
  });

  describe('setData', () => {
    it('should set session data field', async () => {
      const session = await runtime.create('user123');

      const result = await runtime.setData(session.id, 'role', 'admin');

      expect(result).toBe(true);

      const role = await runtime.getData(session.id, 'role');
      expect(role).toBe('admin');
    });

    it('should return false for non-existent session', async () => {
      const result = await runtime.setData('non-existent', 'role', 'admin');
      expect(result).toBe(false);
    });
  });

  describe('removeData', () => {
    it('should remove session data field', async () => {
      const session = await runtime.create('user123', {
        data: { role: 'admin', name: 'John' },
      });

      const result = await runtime.removeData(session.id, 'role');

      expect(result).toBe(true);

      const role = await runtime.getData(session.id, 'role');
      expect(role).toBeNull();

      const name = await runtime.getData(session.id, 'name');
      expect(name).toBe('John');
    });

    it('should return false for non-existent session', async () => {
      const result = await runtime.removeData('non-existent', 'role');
      expect(result).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should remove expired sessions', async () => {
      await runtime.create('user1', { ttl: 3600 });
      await runtime.create('user2', { ttl: -1 }); // Already expired (negative TTL = past time)
      await runtime.create('user3', { ttl: -1 });

      const cleaned = await runtime.cleanup();

      expect(cleaned).toBe(2);

      const activeSessions = await runtime.getActiveSessions();
      expect(activeSessions).toHaveLength(1);
    });
  });

  describe('shutdown', () => {
    it('should stop cleanup timer', async () => {
      await runtime.shutdown();

      // Wait to see if cleanup runs (it shouldn't)
      await new Promise((resolve) => setTimeout(resolve, 200));

      // If cleanup timer is stopped, this should not throw
      await runtime.shutdown();
    });
  });
});
