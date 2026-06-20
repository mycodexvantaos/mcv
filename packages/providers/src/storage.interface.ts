export interface StorageCapability {
  readonly capability: 'storage';
  readonly source: 'native' | 'external' | 'hybrid';
  initialize?(): Promise<void>;
  healthCheck(): Promise<boolean>;
  write(key: string, data: Buffer): Promise<void>;
  read(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
  shutdown?(): Promise<void>;
}
