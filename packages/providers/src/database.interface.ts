export interface DatabaseCapability {
  readonly capability: 'database';
  readonly source: 'native' | 'external' | 'hybrid';
  initialize?(): Promise<void>;
  healthCheck(): Promise<boolean>;
  query(sql: string, params?: any[]): Promise<any>;
  transaction(callback: (tr: any) => Promise<any>): Promise<any>;
  shutdown?(): Promise<void>;
}
