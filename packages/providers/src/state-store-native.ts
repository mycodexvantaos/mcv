import { StateStoreCapability } from './state-store.interface';
import * as fs from 'fs';
import * as path from 'path';

export class NativeStateStoreProvider implements StateStoreCapability {
  capability = 'state-store' as const;
  source = 'native' as const;
  private storePath: string;
  private store: Map<string, any>;

  constructor() {
    this.storePath = path.join(process.cwd(), '.native-state.json');
    this.store = new Map();
  }

  async initialize(): Promise<void> {
    if (fs.existsSync(this.storePath)) {
      try {
        const data = fs.readFileSync(this.storePath, 'utf8');
        const parsed = JSON.parse(data);
        for (const [key, value] of Object.entries(parsed)) {
          this.store.set(key, value);
        }
      } catch (err) {
        console.warn('[Native StateStore] Failed to load prior state.', err);
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    return true; // Native is always available
  }

  async get(key: string): Promise<any> {
    return this.store.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    this.store.set(key, value);
    this.persist();
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
    this.persist();
  }

  private persist() {
    try {
      const obj = Object.fromEntries(this.store);
      fs.writeFileSync(this.storePath, JSON.stringify(obj, null, 2), 'utf8');
    } catch (err) {
      console.error('[Native StateStore] Failed to persist state.', err);
    }
  }

  async shutdown(): Promise<void> {
    this.persist();
  }
}
