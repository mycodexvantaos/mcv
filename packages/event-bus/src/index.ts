/**
 * MyCodeXvantaOS Event Bus
 * Provides asynchronous event communication between services
 */

export interface Event {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  source: string;
}

export type EventHandler = (event: Event) => Promise<void> | void;

export class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }

  unsubscribe(eventType: string, handler: EventHandler): boolean {
    return this.handlers.get(eventType)?.delete(handler) || false;
  }

  async publish(event: Event): Promise<void> {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      await Promise.all(Array.from(handlers).map((handler) => handler(event)));
    }
  }

  unsubscribeAll(eventType?: string): void {
    if (eventType) {
      this.handlers.delete(eventType);
    } else {
      this.handlers.clear();
    }
  }
}

export default EventBus;
