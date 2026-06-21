import { DatabaseCapability } from './database.interface';
import * as path from 'path';

// Minimalistic file-based JSON database for "Native" mode
export class NativeDatabaseProvider implements DatabaseCapability {
  capability = 'database' as const;
  source = 'native' as const;
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(process.cwd(), '.native-db.json');
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async query(sql: string, params?: any[]): Promise<any> {
    console.log(`[Native DB] Mock Query: ${sql}`, params);
    return [];
  }

  async transaction(callback: (tr: any) => Promise<any>): Promise<any> {
    console.log('[Native DB] Starting transaction...');
    return callback({});
  }
}
