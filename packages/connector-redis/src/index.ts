/**
 * MyCodexVantaOS Redis Connector
 * Provides integration with Redis for caching and data storage
 */

export interface RedisConfig {
  host: string;
  port?: number;
  password?: string;
  db?: number;
  timeout?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
}

export interface RedisSetOptions {
  ex?: number; // seconds
  px?: number; // milliseconds
  nx?: boolean; // only set if not exists
  xx?: boolean; // only set if exists
}

export interface RedisGetOptions {
  withScores?: boolean;
}

export class RedisConnector {
  private config: Required<RedisConfig>;
  private store: Map<string, { value: string; expiry?: number }> = new Map();
  private connected: boolean = false;

  constructor(config: RedisConfig) {
    this.config = {
      host: config.host,
      port: config.port || 6379,
      password: config.password || '',
      db: config.db || 0,
      timeout: config.timeout || 5000,
      retryDelayOnFailover: config.retryDelayOnFailover || 50,
      maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
    };
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    // Simulate connection
    await new Promise((resolve) => setTimeout(resolve, 10));
    this.connected = true;
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    this.connected = false;
    this.store.clear();
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Clean up expired items
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (data.expiry && data.expiry < now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Set key-value pair
   */
  async set(key: string, value: string | number, options?: RedisSetOptions): Promise<string> {
    this.cleanup();

    const strValue = String(value);
    const expiry = options?.ex
      ? Date.now() + options.ex * 1000
      : options?.px
        ? Date.now() + options.px
        : undefined;

    // Check nx/xx conditions
    const exists = this.store.has(key);
    if (options?.nx && exists) {
      return 'nil';
    }
    if (options?.xx && !exists) {
      return 'nil';
    }

    this.store.set(key, { value: strValue, expiry });
    return 'OK';
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    this.cleanup();

    const data = this.store.get(key);
    if (!data) {
      return null;
    }

    return data.value;
  }

  /**
   * Delete key
   */
  async del(...keys: string[]): Promise<number> {
    this.cleanup();

    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Check if key exists
   */
  async exists(...keys: string[]): Promise<number> {
    this.cleanup();

    let count = 0;
    for (const key of keys) {
      if (this.store.has(key)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Set expiration time
   */
  async expire(key: string, seconds: number): Promise<number> {
    const data = this.store.get(key);
    if (!data) {
      return 0;
    }

    data.expiry = Date.now() + seconds * 1000;
    return 1;
  }

  /**
   * Get remaining time to live
   */
  async ttl(key: string): Promise<number> {
    const data = this.store.get(key);
    if (!data) {
      return -2;
    }

    if (!data.expiry) {
      return -1;
    }

    const remaining = Math.ceil((data.expiry - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  /**
   * Increment value
   */
  async incr(key: string): Promise<number> {
    const data = this.store.get(key);
    const currentValue = data ? parseInt(data.value, 10) || 0 : 0;
    const newValue = currentValue + 1;
    this.store.set(key, { value: String(newValue), expiry: data?.expiry });
    return newValue;
  }

  /**
   * Decrement value
   */
  async decr(key: string): Promise<number> {
    const data = this.store.get(key);
    const currentValue = data ? parseInt(data.value, 10) || 0 : 0;
    const newValue = currentValue - 1;
    this.store.set(key, { value: String(newValue), expiry: data?.expiry });
    return newValue;
  }

  /**
   * Add to sorted set
   */
  async zadd(key: string, score: number, member: string): Promise<number> {
    this.cleanup();

    const zsetValue = this.store.get(key);
    let set: Map<string, number> = new Map();

    if (zsetValue) {
      try {
        set = new Map(JSON.parse(zsetValue.value));
      } catch {
        set = new Map();
      }
    }

    const isNew = !set.has(member);
    set.set(member, score);

    const serialized = JSON.stringify([...set.entries()]);
    this.store.set(key, { value: serialized, expiry: zsetValue?.expiry });

    return isNew ? 1 : 0;
  }

  /**
   * Get range from sorted set
   */
  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    this.cleanup();

    const data = this.store.get(key);
    if (!data) {
      return [];
    }

    try {
      const entries = JSON.parse(data.value) as [string, number][];
      const sorted = entries.sort((a, b) => a[1] - b[1]);
      const end = stop === -1 ? sorted.length : stop + 1;
      return sorted.slice(start, end).map(([member]) => member);
    } catch {
      return [];
    }
  }

  /**
   * Get all keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    this.cleanup();

    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const allKeys = Array.from(this.store.keys());
    return allKeys.filter((key) => regex.test(key));
  }

  /**
   * Set multiple key-value pairs
   */
  async mset(...keyValuePairs: string[]): Promise<string> {
    if (keyValuePairs.length % 2 !== 0) {
      throw new Error('MSET requires an even number of arguments');
    }

    for (let i = 0; i < keyValuePairs.length; i += 2) {
      const key = keyValuePairs[i];
      const value = keyValuePairs[i + 1];
      await this.set(key, value);
    }

    return 'OK';
  }

  /**
   * Get multiple values
   */
  async mget(...keys: string[]): Promise<(string | null)[]> {
    return Promise.all(keys.map((key) => this.get(key)));
  }

  /**
   * Append to string
   */
  async append(key: string, value: string): Promise<number> {
    const current = (await this.get(key)) || '';
    const newStr = current + value;
    await this.set(key, newStr);
    return newStr.length;
  }

  /**
   * Get substring of string
   */
  async getrange(key: string, start: number, end: number): Promise<string> {
    const value = (await this.get(key)) || '';
    const actualEnd = end === -1 ? undefined : end + 1;
    return value.substring(start, actualEnd);
  }

  /**
   * Set substring of string
   */
  async setrange(key: string, offset: number, value: string): Promise<number> {
    const current = (await this.get(key)) || '';
    const padded = current.padStart(offset + value.length - current.length, '\0');
    const newStr = padded.substring(0, offset) + value + padded.substring(offset + value.length);
    await this.set(key, newStr);
    return newStr.length;
  }

  /**
   * Get string length
   */
  async strlen(key: string): Promise<number> {
    const value = await this.get(key);
    return value ? value.length : 0;
  }

  /**
   * Flush all keys
   */
  async flushall(): Promise<string> {
    this.store.clear();
    return 'OK';
  }

  /**
   * Flush database
   */
  async flushdb(): Promise<string> {
    this.store.clear();
    return 'OK';
  }

  /**
   * Get database size
   */
  async dbsize(): Promise<number> {
    this.cleanup();
    return this.store.size;
  }

  /**
   * Ping server
   */
  async ping(): Promise<string> {
    return 'PONG';
  }

  /**
   * Get info about server
   */
  async info(section?: string): Promise<string> {
    const allInfo = `# Server
redis_version=6.0.0
os=Linux
# Clients
connected_clients=1
# Memory
used_memory=${this.store.size * 1024}
# Persistence
loading=0
# Stats
total_connections_received=1
# Replication
role=master
# CPU
used_cpu_sys=0.5
used_cpu_user=0.3`;

    if (section) {
      // Find the section and return lines until next section
      const lines = allInfo.split('\n');
      const result: string[] = [];
      let inSection = false;

      for (const line of lines) {
        if (line.startsWith('# ')) {
          inSection = line.toLowerCase().includes(section.toLowerCase());
        }
        if (inSection) {
          result.push(line);
        }
      }
      return result.join('\n');
    }

    return allInfo;
  }

  /**
   * Select database
   */
  async select(index: number): Promise<string> {
    return 'OK';
  }
}

export default RedisConnector;
