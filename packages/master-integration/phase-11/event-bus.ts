export class EventBus {
  private subscribers: Map<string, Function[]> = new Map();

  subscribe(event: string, handler: Function): void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event)!.push(handler);
  }

  async publish(event: string, data: any): Promise<void> {
    const handlers = this.subscribers.get(event) || [];
    for (const handler of handlers) {
      await handler(data);
    }
  }
}
