## Example Modular Instructions: Database Migration Guide

This document provides specific instructions for agents performing database migration tasks within the MyCodeXvantaOS project.

### 1. Migration Workflow

When performing database migrations, agents MUST follow this workflow:

1. **Backup**: Always ensure a full database backup is performed before initiating any migration. Refer to `docs/database-backup-procedure.md` for detailed steps.
2. **Schema Changes**: All schema changes must be defined using Drizzle ORM migrations. Generate new migration files using `npm run migration:generate <migration-name>`.
3. **Review**: Migration files MUST be reviewed by a human before execution in any production-like environment.
4. **Execution**: Execute migrations using `npm run migration:run`. Always specify the target environment (e.g., `npm run migration:run --env=staging`).
5. **Validation**: After migration, run integration tests (`npm run test:integration`) and verify data integrity. Refer to `docs/data-integrity-checks.md`.
6. **Rollback Plan**: Always have a rollback plan in place. If a migration fails or causes issues, revert to the previous state using `npm run migration:rollback`.

### 2. Tool Permissions for Migrations

Agents performing migrations require the following specific tool permissions:

- `shell(npm run migration:*)`: Essential for generating, running, and rolling back migrations.
- `shell(npm run test:integration)`: Required for validating the database state after migration.
- `write`: For creating new migration files.
- `read`: For reading existing migration scripts and documentation.

### 3. Best Practices

- **Idempotency**: Ensure all migration scripts are idempotent.
- **Small Batches**: Prefer smaller, incremental migrations over large, monolithic ones.
- **Documentation**: Document each migration with its purpose, changes, and potential impact.
- **Testing**: Thoroughly test migrations in a staging environment before applying to production.
