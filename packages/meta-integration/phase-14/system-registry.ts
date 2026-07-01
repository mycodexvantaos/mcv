export class SystemRegistry {
  private systems: Map<string, any> = new Map();

  registerSystem(id: string, system: any): void {
    this.systems.set(id, {
      id,
      ...system,
      registeredAt: new Date(),
      status: 'active',
    });
  }

  getSystem(id: string): any {
    return this.systems.get(id);
  }

  getAllSystems(): any[] {
    return Array.from(this.systems.values());
  }

  discoverSystems(): any[] {
    return this.getAllSystems();
  }
}
