/**
 * Redis Connector Tests
 */

import { RedisConnector, RedisConfig, RedisSetOptions } from "../index";

describe("RedisConnector", () => {
  let connector: RedisConnector;
  let config: RedisConfig;

  beforeEach(async () => {
    config = {
      host: "localhost",
      port: 6379,
      password: undefined,
      db: 0,
      timeout: 5000,
      retryDelayOnFailover: 50,
      maxRetriesPerRequest: 3,
    };

    connector = new RedisConnector(config);
    await connector.connect();
  });

  afterEach(async () => {
    await connector.disconnect();
  });

  describe("Connection", () => {
    test("should connect successfully", async () => {
      expect(connector.isConnected()).toBe(true);
    });

    test("should disconnect successfully", async () => {
      await connector.disconnect();
      expect(connector.isConnected()).toBe(false);
    });
  });

  describe("String Operations", () => {
    test("should set and get value", async () => {
      await connector.set("test", "value");
      const value = await connector.get("test");
      expect(value).toBe("value");
    });

    test("should set and get number", async () => {
      await connector.set("number", 42);
      const value = await connector.get("number");
      expect(value).toBe("42");
    });

    test("should return null for non-existent key", async () => {
      const value = await connector.get("nonexistent");
      expect(value).toBeNull();
    });

    test("should set value with expiration", async () => {
      await connector.set("expire", "value", { ex: 1 });
      const value1 = await connector.get("expire");
      expect(value1).toBe("value");

      await new Promise((resolve) => setTimeout(resolve, 1100));
      const value2 = await connector.get("expire");
      expect(value2).toBeNull();
    });

    test("should not set if key exists with nx option", async () => {
      await connector.set("test", "value1");
      const result = await connector.set("test", "value2", { nx: true });
      expect(result).toBe("nil");

      const value = await connector.get("test");
      expect(value).toBe("value1");
    });

    test("should not set if key does not exist with xx option", async () => {
      const result = await connector.set("test", "value", { xx: true });
      expect(result).toBe("nil");

      const value = await connector.get("test");
      expect(value).toBeNull();
    });
  });

  describe("Delete Operations", () => {
    test("should delete single key", async () => {
      await connector.set("test", "value");
      const count = await connector.del("test");
      expect(count).toBe(1);
      expect(await connector.get("test")).toBeNull();
    });

    test("should delete multiple keys", async () => {
      await connector.set("key1", "value1");
      await connector.set("key2", "value2");
      await connector.set("key3", "value3");

      const count = await connector.del("key1", "key2", "key3");
      expect(count).toBe(3);
    });

    test("should return 0 for deleting non-existent keys", async () => {
      const count = await connector.del("nonexistent");
      expect(count).toBe(0);
    });
  });

  describe("Exists Operations", () => {
    test("should check if key exists", async () => {
      await connector.set("test", "value");
      const exists = await connector.exists("test");
      expect(exists).toBe(1);
    });

    test("should check multiple keys", async () => {
      await connector.set("key1", "value1");
      await connector.set("key2", "value2");

      const count = await connector.exists("key1", "key2", "nonexistent");
      expect(count).toBe(2);
    });
  });

  describe("Expiration Operations", () => {
    test("should set expiration on existing key", async () => {
      await connector.set("test", "value");
      const result = await connector.expire("test", 1);
      expect(result).toBe(1);

      await new Promise((resolve) => setTimeout(resolve, 1100));
      expect(await connector.get("test")).toBeNull();
    });

    test("should return 0 for non-existent key", async () => {
      const result = await connector.expire("nonexistent", 10);
      expect(result).toBe(0);
    });

    test("should get TTL of key", async () => {
      await connector.set("test", "value", { ex: 10 });
      const ttl = await connector.ttl("test");
      expect(ttl).toBeGreaterThan(0);
    });

    test("should return -1 for key without expiration", async () => {
      await connector.set("test", "value");
      const ttl = await connector.ttl("test");
      expect(ttl).toBe(-1);
    });

    test("should return -2 for non-existent key", async () => {
      const ttl = await connector.ttl("nonexistent");
      expect(ttl).toBe(-2);
    });
  });

  describe("Increment/Decrement Operations", () => {
    test("should increment value", async () => {
      let value = await connector.incr("counter");
      expect(value).toBe(1);

      value = await connector.incr("counter");
      expect(value).toBe(2);
    });

    test("should decrement value", async () => {
      await connector.set("counter", 5);
      let value = await connector.decr("counter");
      expect(value).toBe(4);

      value = await connector.decr("counter");
      expect(value).toBe(3);
    });

    test("should increment from zero", async () => {
      const value = await connector.incr("newcounter");
      expect(value).toBe(1);
    });
  });

  describe("Sorted Set Operations", () => {
    test("should add to sorted set", async () => {
      const count = await connector.zadd("scores", 100, "player1");
      expect(count).toBe(1);
    });

    test("should update existing member in sorted set", async () => {
      await connector.zadd("scores", 100, "player1");
      const count = await connector.zadd("scores", 200, "player1");
      expect(count).toBe(0);
    });

    test("should get range from sorted set", async () => {
      await connector.zadd("scores", 100, "player1");
      await connector.zadd("scores", 200, "player2");
      await connector.zadd("scores", 150, "player3");

      const range = await connector.zrange("scores", 0, -1);
      expect(range).toEqual(["player1", "player3", "player2"]);
    });
  });

  describe("Pattern Matching", () => {
    test("should get keys matching pattern", async () => {
      await connector.set("user:1", "value1");
      await connector.set("user:2", "value2");
      await connector.set("session:1", "value3");

      const keys = await connector.keys("user:*");
      expect(keys).toHaveLength(2);
      expect(keys).toContain("user:1");
      expect(keys).toContain("user:2");
    });
  });

  describe("Multiple Operations", () => {
    test("should set multiple key-value pairs", async () => {
      const result = await connector.mset("key1", "value1", "key2", "value2", "key3", "value3");
      expect(result).toBe("OK");

      expect(await connector.get("key1")).toBe("value1");
      expect(await connector.get("key2")).toBe("value2");
      expect(await connector.get("key3")).toBe("value3");
    });

    test("should get multiple values", async () => {
      await connector.set("key1", "value1");
      await connector.set("key2", "value2");
      await connector.set("key3", "value3");

      const values = await connector.mget("key1", "key2", "key3", "nonexistent");
      expect(values).toEqual(["value1", "value2", "value3", null]);
    });
  });

  describe("String Manipulation", () => {
    test("should append to string", async () => {
      await connector.set("key", "Hello");
      const length = await connector.append("key", " World");
      expect(length).toBe(11);
      expect(await connector.get("key")).toBe("Hello World");
    });

    test("should get substring", async () => {
      await connector.set("key", "Hello World");
      const substr = await connector.getrange("key", 0, 4);
      expect(substr).toBe("Hello");
    });

    test("should get substring to end", async () => {
      await connector.set("key", "Hello World");
      const substr = await connector.getrange("key", 6, -1);
      expect(substr).toBe("World");
    });

    test("should set substring", async () => {
      await connector.set("key", "Hello World");
      const length = await connector.setrange("key", 6, "Universe");
      expect(length).toBe(14); // "Hello Universe" is 14 characters
      expect(await connector.get("key")).toBe("Hello Universe");
    });

    test("should get string length", async () => {
      await connector.set("key", "Hello");
      const length = await connector.strlen("key");
      expect(length).toBe(5);
    });
  });

  describe("Database Operations", () => {
    test("should get database size", async () => {
      await connector.set("key1", "value1");
      await connector.set("key2", "value2");

      const size = await connector.dbsize();
      expect(size).toBe(2);
    });

    test("should flush all keys", async () => {
      await connector.set("key1", "value1");
      await connector.set("key2", "value2");

      const result = await connector.flushall();
      expect(result).toBe("OK");
      expect(await connector.dbsize()).toBe(0);
    });

    test("should flush database", async () => {
      await connector.set("key1", "value1");
      await connector.set("key2", "value2");

      const result = await connector.flushdb();
      expect(result).toBe("OK");
      expect(await connector.dbsize()).toBe(0);
    });
  });

  describe("Server Operations", () => {
    test("should ping server", async () => {
      const pong = await connector.ping();
      expect(pong).toBe("PONG");
    });

    test("should get server info", async () => {
      const info = await connector.info();
      expect(info).toContain("redis_version");
      expect(info).toContain("Server");
    });

    test("should get info section", async () => {
      const info = await connector.info("Server");
      expect(info).toContain("redis_version");
    });

    test("should select database", async () => {
      const result = await connector.select(1);
      expect(result).toBe("OK");
    });
  });

  describe("Error Handling", () => {
    test("should throw error for odd number of arguments in mset", async () => {
      await expect(connector.mset("key1", "value1", "key2")).rejects.toThrow();
    });
  });
});
