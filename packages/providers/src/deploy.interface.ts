export interface DeployCapability {
  readonly capability: 'deploy';
  readonly source: 'native' | 'external' | 'hybrid';
  initialize?(): Promise<void>;
  healthCheck(): Promise<boolean>;
  deploy(artifact: any): Promise<any>;
  rollback(versionId: string): Promise<boolean>;
  shutdown?(): Promise<void>;
}
