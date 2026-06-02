import { QueueCapability } from './queue.interface';
import { randomUUID } from 'crypto';

interface QueueItem {
  id: string;
  payload: any;
  status: 'pending' | 'processing';
}

export class NativeQueueProvider implements QueueCapability {
  capability = 'queue' as const;
  source = 'native' as const;
  private queues: Map<string, QueueItem[]>;

  constructor() {
    this.queues = new Map();
  }

  async healthCheck(): Promise<boolean> {
    return true; 
  }

  async enqueue(topic: string, payload: any): Promise<string> {
    if (!this.queues.has(topic)) {
      this.queues.set(topic, []);
    }
    const id = randomUUID();
    this.queues.get(topic)!.push({ id, payload, status: 'pending' });
    return id;
  }

  async dequeue(topic: string): Promise<{ id: string; payload: any } | null> {
    const q = this.queues.get(topic);
    if (!q) return null;

    const item = q.find(x => x.status === 'pending');
    if (!item) return null;

    item.status = 'processing';
    return { id: item.id, payload: item.payload };
  }

  async ack(topic: string, id: string): Promise<void> {
    const q = this.queues.get(topic);
    if (!q) return;
    this.queues.set(topic, q.filter(x => x.id !== id));
  }
}
