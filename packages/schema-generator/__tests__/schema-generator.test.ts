import { SchemaGenerator, SchemaDefinition, SchemaField } from '../src/index';

describe('SchemaGenerator', () => {
  let generator: SchemaGenerator;

  beforeEach(() => {
    generator = new SchemaGenerator({
      database: 'postgresql',
      namingConvention: 'snake_case',
      enableTimestamps: true,
      enableSoftDelete: false,
    });
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      const defaultGen = new SchemaGenerator();
      expect(defaultGen).toBeInstanceOf(SchemaGenerator);
    });

    it('should initialize with custom options', () => {
      const customGen = new SchemaGenerator({
        database: 'mysql',
        namingConvention: 'camelCase',
        enableTimestamps: false,
        enableSoftDelete: true,
      });
      expect(customGen).toBeInstanceOf(SchemaGenerator);
    });
  });

  describe('generateTableSchema', () => {
    it('should generate CREATE TABLE SQL', () => {
      const schema: SchemaDefinition = {
        name: 'User',
        fields: [
          {
            name: 'id',
            type: 'integer',
            required: true,
            primaryKey: true,
          },
          {
            name: 'name',
            type: 'string',
            required: true,
          },
        ],
      };

      const sql = generator.generateTableSchema(schema);
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS user');
      expect(sql).toContain('id INTEGER NOT NULL');
      expect(sql).toContain('name VARCHAR(255) NOT NULL');
      expect(sql).toContain('PRIMARY KEY (id)');
    });

    it('should include timestamps when enabled', () => {
      const schema: SchemaDefinition = {
        name: 'User',
        fields: [
          {
            name: 'id',
            type: 'integer',
            required: true,
            primaryKey: true,
          },
        ],
      };

      const sql = generator.generateTableSchema(schema);
      expect(sql).toContain('created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      expect(sql).toContain('updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    });

    it('should not include timestamps when disabled', () => {
      const noTimestampGen = new SchemaGenerator({ enableTimestamps: false });
      const schema: SchemaDefinition = {
        name: 'User',
        fields: [
          {
            name: 'id',
            type: 'integer',
            required: true,
            primaryKey: true,
          },
        ],
      };

      const sql = noTimestampGen.generateTableSchema(schema);
      expect(sql).not.toContain('created_at');
      expect(sql).not.toContain('updated_at');
    });

    it('should include unique constraint', () => {
      const schema: SchemaDefinition = {
        name: 'User',
        fields: [
          {
            name: 'id',
            type: 'integer',
            required: true,
            primaryKey: true,
          },
          {
            name: 'email',
            type: 'string',
            required: true,
            unique: true,
          },
        ],
      };

      const sql = generator.generateTableSchema(schema);
      expect(sql).toContain('email VARCHAR(255) NOT NULL UNIQUE');
    });

    it('should include default value', () => {
      const schema: SchemaDefinition = {
        name: 'User',
        fields: [
          {
            name: 'id',
            type: 'integer',
            required: true,
            primaryKey: true,
          },
          {
            name: 'active',
            type: 'boolean',
            required: false,
            default: true,
          },
        ],
      };

      const sql = generator.generateTableSchema(schema);
      expect(sql).toContain('active BOOLEAN NULL DEFAULT true');
    });

    it('should include foreign key constraint', () => {
      const schema: SchemaDefinition = {
        name: 'Post',
        fields: [
          {
            name: 'id',
            type: 'integer',
            required: true,
            primaryKey: true,
          },
          {
            name: 'userId',
            type: 'integer',
            required: true,
            foreignKey: {
              table: 'User',
              field: 'id',
              onDelete: 'CASCADE',
            },
          },
        ],
      };

      const sql = generator.generateTableSchema(schema);
      expect(sql).toContain('userid INTEGER NOT NULL');
      expect(sql).toContain('REFERENCES user(id)');
      expect(sql).toContain('ON DELETE CASCADE');
    });

    it('should generate indexes', () => {
      const schema: SchemaDefinition = {
        name: 'User',
        fields: [
          {
            name: 'id',
            type: 'integer',
            required: true,
            primaryKey: true,
          },
        ],
        indexes: [
          {
            name: 'idx_user_name_email',
            fields: ['name', 'email'],
            unique: true,
          },
        ],
      };

      const sql = generator.generateTableSchema(schema);
      expect(sql).toContain('CREATE UNIQUE INDEX IF NOT EXISTS');
      expect(sql).toContain('ON user (name, email)');
    });
  });

  describe('generateMigration', () => {
    it('should generate up and down migrations', () => {
      const schemas: SchemaDefinition[] = [
        {
          name: 'User',
          fields: [
            {
              name: 'id',
              type: 'integer',
              required: true,
              primaryKey: true,
            },
            {
              name: 'name',
              type: 'string',
              required: true,
            },
          ],
        },
      ];

      const migration = generator.generateMigration(schemas, '001', 'Create users table');

      expect(migration.version).toBe('001');
      expect(migration.description).toBe('Create users table');
      expect(migration.up).toHaveLength(1);
      expect(migration.down).toHaveLength(1);
      expect(migration.up[0]).toContain('CREATE TABLE');
      expect(migration.down[0]).toContain('DROP TABLE');
    });

    it('should handle multiple schemas', () => {
      const schemas: SchemaDefinition[] = [
        {
          name: 'User',
          fields: [{ name: 'id', type: 'integer', required: true, primaryKey: true }],
        },
        {
          name: 'Post',
          fields: [{ name: 'id', type: 'integer', required: true, primaryKey: true }],
        },
      ];

      const migration = generator.generateMigration(schemas, '002', 'Create tables');

      expect(migration.up).toHaveLength(2);
      expect(migration.down).toHaveLength(2);
    });
  });

  describe('generateTypeScriptInterfaces', () => {
    it('should generate TypeScript interfaces', () => {
      const schemas: SchemaDefinition[] = [
        {
          name: 'User',
          fields: [
            {
              name: 'id',
              type: 'integer',
              required: true,
            },
            {
              name: 'name',
              type: 'string',
              required: true,
            },
            {
              name: 'age',
              type: 'integer',
              required: false,
            },
          ],
        },
      ];

      const ts = generator.generateTypeScriptInterfaces(schemas);

      expect(ts).toContain('export interface User');
      expect(ts).toContain('id: number;');
      expect(ts).toContain('name: string;');
      expect(ts).toContain('age?: number;');
    });

    it('should include timestamps in interfaces', () => {
      const schemas: SchemaDefinition[] = [
        {
          name: 'User',
          fields: [{ name: 'id', type: 'integer', required: true }],
        },
      ];

      const ts = generator.generateTypeScriptInterfaces(schemas);
      expect(ts).toContain('readonly createdAt?: Date;');
      expect(ts).toContain('readonly updatedAt?: Date;');
    });

    it('should include soft delete in interfaces when enabled', () => {
      const softDeleteGen = new SchemaGenerator({ enableSoftDelete: true });
      const schemas: SchemaDefinition[] = [
        {
          name: 'User',
          fields: [{ name: 'id', type: 'integer', required: true }],
        },
      ];

      const ts = softDeleteGen.generateTypeScriptInterfaces(schemas);
      expect(ts).toContain('readonly deletedAt?: Date | null;');
    });
  });

  describe('generateJsonSchema', () => {
    it('should generate valid JSON Schema', () => {
      const schema: SchemaDefinition = {
        name: 'User',
        fields: [
          {
            name: 'id',
            type: 'integer',
            required: true,
          },
          {
            name: 'name',
            type: 'string',
            required: true,
          },
        ],
      };

      const jsonSchema = generator.generateJsonSchema(schema);
      const parsed = JSON.parse(jsonSchema);

      expect(parsed.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(parsed.title).toBe('User');
      expect(parsed.type).toBe('object');
      expect(parsed.properties).toBeDefined();
      expect(parsed.required).toContain('id');
      expect(parsed.required).toContain('name');
    });

    it('should mark required fields correctly', () => {
      const schema: SchemaDefinition = {
        name: 'User',
        fields: [
          {
            name: 'id',
            type: 'integer',
            required: true,
          },
          {
            name: 'name',
            type: 'string',
            required: false,
          },
        ],
      };

      const jsonSchema = generator.generateJsonSchema(schema);
      const parsed = JSON.parse(jsonSchema);

      expect(parsed.required).toContain('id');
      expect(parsed.required).not.toContain('name');
    });
  });

  describe('generatePrismaSchema', () => {
    it('should generate Prisma schema', () => {
      const schemas: SchemaDefinition[] = [
        {
          name: 'User',
          fields: [
            {
              name: 'id',
              type: 'integer',
              required: true,
              primaryKey: true,
            },
            {
              name: 'name',
              type: 'string',
              required: true,
            },
          ],
        },
      ];

      const prisma = generator.generatePrismaSchema(schemas);

      expect(prisma).toContain('generator client');
      expect(prisma).toContain('datasource db');
      expect(prisma).toContain('model User');
      expect(prisma).toContain('id Int @id');
      expect(prisma).toContain('name String');
    });

    it('should include timestamps in Prisma schema', () => {
      const schemas: SchemaDefinition[] = [
        {
          name: 'User',
          fields: [{ name: 'id', type: 'integer', required: true, primaryKey: true }],
        },
      ];

      const prisma = generator.generatePrismaSchema(schemas);
      expect(prisma).toContain('createdAt DateTime @default(now())');
      expect(prisma).toContain('updatedAt DateTime @updatedAt');
    });
  });

  describe('Type conversion', () => {
    it('should convert string type correctly', () => {
      const schema: SchemaDefinition = {
        name: 'Test',
        fields: [{ name: 'name', type: 'string', required: true }],
      };

      const sql = generator.generateTableSchema(schema);
      expect(sql).toContain('VARCHAR(255)');
    });

    it('should convert number type correctly', () => {
      const schema: SchemaDefinition = {
        name: 'Test',
        fields: [{ name: 'value', type: 'number', required: true }],
      };

      const sql = generator.generateTableSchema(schema);
      expect(sql).toContain('DECIMAL(10,2)');
    });

    it('should convert boolean type correctly', () => {
      const schema: SchemaDefinition = {
        name: 'Test',
        fields: [{ name: 'active', type: 'boolean', required: true }],
      };

      const sql = generator.generateTableSchema(schema);
      expect(sql).toContain('BOOLEAN');
    });

    it('should convert date type correctly', () => {
      const schema: SchemaDefinition = {
        name: 'Test',
        fields: [{ name: 'createdAt', type: 'date', required: true }],
      };

      const sql = generator.generateTableSchema(schema);
      expect(sql).toContain('TIMESTAMP');
    });
  });
});
