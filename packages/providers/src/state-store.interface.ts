export interface StateStoreCapability {
  readonly capability: 'state-store';
  readonly source: 'native' | 'external' | 'hybrid';
  initialize?(): Promise<void>;
  healthCheck(): Promise<boolean>;
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  shutdown?(): Promise<void>;
}
