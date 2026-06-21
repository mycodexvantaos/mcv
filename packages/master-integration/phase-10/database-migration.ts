export class DatabaseMigrationFramework {
  private migrations: Map<string, any> = new Map();

  createMigration(name: string, up: () => Promise<void>, down: () => Promise<void>): void {
    this.migrations.set(name, { up, down, executed: false });
  }

  async runMigration(name: string): Promise<void> {
    const migration = this.migrations.get(name);
    if (migration) {
      await migration.up();
      migration.executed = true;
    }
  }

  async rollbackMigration(name: string): Promise<void> {
    const migration = this.migrations.get(name);
    if (migration) {
      await migration.down();
      migration.executed = false;
    }
  }
}
