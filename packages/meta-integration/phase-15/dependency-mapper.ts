export class DependencyMapper {
  private dependencies: Map<string, string[]> = new Map();
  
  mapDependency(systemId: string, dependsOn: string[]): void {
    this.dependencies.set(systemId, dependsOn);
  }
  
  getDependencies(systemId: string): string[] {
    return this.dependencies.get(systemId) || [];
  }
  
  getAllDependencies(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    this.dependencies.forEach((deps, id) => {
      result[id] = deps;
    });
    return result;
  }
}
