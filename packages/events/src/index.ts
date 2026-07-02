/**
 * MyCodeXvantaOS Events
 * Event processing service with pub/sub and streaming
 */

import { EventEmitter } from 'events';

export interface EventPayload {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  source: string;
}

export interface Subscription {
  id: string;
  eventPattern: string;
  callback: (event: EventPayload) => void;
}

export class EventService extends EventEmitter {
  private subscriptions: Map<string, Subscription>;
  private eventHistory: EventPayload[];

  constructor() {
    super();
    this.subscriptions = new Map();
    this.eventHistory = [];
  }

  async initialize(): Promise<void> {
    console.log('Event service initialized');
    this.setMaxListeners(1000);
  }

  async execute<T = EventPayload>(operation: any): Promise<T> {
    const { action, data } = operation;

    switch (action) {
      case 'publish':
        return (await this.publish(data)) as T;
      case 'subscribe':
        return (await this.subscribe(data)) as T;
      case 'unsubscribe':
        return (await this.unsubscribe(data)) as T;
      case 'getHistory':
        return (await this.getHistory(data)) as T;
      default:
        throw new Error(`Unknown event action: ${action}`);
    }
  }

  async publish(event: any): Promise<EventPayload> {
    const eventPayload: EventPayload = {
      id: `urn:mycodexvantaos:event:${Date.now()}`,
      type: event.type,
      data: event.data,
      timestamp: Date.now(),
      source: event.source || 'unknown',
    };

    // Add to history
    this.eventHistory.push(eventPayload);

    // Limit history size
    if (this.eventHistory.length > 10000) {
      this.eventHistory.shift();
    }

    // Emit to subscribers
    this.emit(eventPayload.type, eventPayload);
    this.emit('*', eventPayload);

    console.log(`Event published: ${eventPayload.type}`);
    return eventPayload;
  }

  async subscribe(subscription: any): Promise<Subscription> {
    const sub: Subscription = {
      id: `urn:mycodexvantaos:subscription:${Date.now()}`,
      eventPattern: subscription.eventPattern,
      callback: subscription.callback,
    };

    this.subscriptions.set(sub.id, sub);

    // Subscribe to events
    this.on(sub.eventPattern, sub.callback);

    console.log(`Subscription created: ${sub.eventPattern}`);
    return sub;
  }

  async unsubscribe(subscriptionId: string): Promise<boolean> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      this.removeListener(subscription.eventPattern, subscription.callback);
      this.subscriptions.delete(subscriptionId);
      return true;
    }
    return false;
  }

  async getHistory(filter?: any): Promise<EventPayload[]> {
    let events = this.eventHistory;

    if (filter?.type) {
      events = events.filter((e) => e.type === filter.type);
    }

    if (filter?.limit) {
      events = events.slice(-filter.limit);
    }

    return events;
  }

  async cleanup(): Promise<void> {
    this.subscriptions.clear();
    this.eventHistory = [];
    this.removeAllListeners();
    console.log('Event service cleaned up');
  }
}

export const events = new EventService();
