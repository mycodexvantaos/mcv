export interface QueueCapability {
  readonly capability: 'queue';
  readonly source: 'native' | 'external' | 'hybrid';
  initialize?(): Promise<void>;
  healthCheck(): Promise<boolean>;
  enqueue(topic: string, payload: any): Promise<string>;
  dequeue(topic: string): Promise<{ id: string; payload: any } | null>;
  ack(topic: string, id: string): Promise<void>;
  shutdown?(): Promise<void>;
}
