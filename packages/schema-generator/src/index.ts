/**
 * Schema Generator Module
 *
 * This module provides capabilities for generating database schemas,
 * validation schemas, and migration files from model definitions.
 */

export interface SchemaField {
  name: string;
  type: "string" | "number" | "integer" | "boolean" | "date" | "text" | "json" | "array";
  required: boolean;
  primaryKey?: boolean;
  unique?: boolean;
  indexed?: boolean;
  default?: any;
  foreignKey?: {
    table: string;
    field: string;
    onDelete?: "CASCADE" | "SET NULL" | "RESTRICT";
  };
}

export interface SchemaDefinition {
  name: string;
  fields: SchemaField[];
  indexes?: {
    name: string;
    fields: string[];
    unique?: boolean;
  }[];
}

export interface MigrationDefinition {
  version: string;
  description: string;
  up: string[];
  down: string[];
}

export interface SchemaGeneratorOptions {
  database?: "postgresql" | "mysql" | "sqlite" | "mongodb";
  namingConvention?: "camelCase" | "snake_case" | "PascalCase";
  enableTimestamps?: boolean;
  enableSoftDelete?: boolean;
}

export class SchemaGenerator {
  private options: SchemaGeneratorOptions;

  constructor(options: SchemaGeneratorOptions = {}) {
    this.options = {
      database: "postgresql",
      namingConvention: "snake_case",
      enableTimestamps: true,
      enableSoftDelete: false,
      ...options,
    };
  }

  /**
   * Generate SQL schema for a table
   */
  generateTableSchema(schema: SchemaDefinition): string {
    let sql = `-- Table: ${schema.name}\n`;
    sql += `CREATE TABLE IF NOT EXISTS ${this.formatTableName(schema.name)} (\n`;

    const fieldDefinitions: string[] = [];
    const primaryKeyFields: string[] = [];

    for (const field of schema.fields) {
      fieldDefinitions.push(this.generateFieldDefinition(field));
      if (field.primaryKey) {
        primaryKeyFields.push(this.formatFieldName(field.name));
      }
    }

    // Add timestamps if enabled
    if (this.options.enableTimestamps) {
      fieldDefinitions.push("  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
      fieldDefinitions.push("  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    }

    // Add soft delete if enabled
    if (this.options.enableSoftDelete) {
      fieldDefinitions.push("  deleted_at TIMESTAMP NULL");
    }

    sql += fieldDefinitions.join(",\n");

    // Add primary key constraint
    if (primaryKeyFields.length > 0) {
      sql += `,\n  PRIMARY KEY (${primaryKeyFields.join(", ")})`;
    }

    sql += "\n);";

    // Add indexes
    if (schema.indexes) {
      for (const index of schema.indexes) {
        sql += "\n\n";
        sql += this.generateIndexDefinition(schema.name, index);
      }
    }

    return sql;
  }

  /**
   * Generate database migration file
   */
  generateMigration(
    schemas: SchemaDefinition[],
    version: string,
    description: string
  ): MigrationDefinition {
    const up: string[] = [];
    const down: string[] = [];

    // Generate up migrations
    for (const schema of schemas) {
      up.push(this.generateTableSchema(schema));
    }

    // Generate down migrations
    for (const schema of schemas) {
      down.push(`DROP TABLE IF EXISTS ${this.formatTableName(schema.name)} CASCADE;`);
    }

    return {
      version,
      description,
      up,
      down,
    };
  }

  /**
   * Generate TypeScript interfaces from schema
   */
  generateTypeScriptInterfaces(schemas: SchemaDefinition[]): string {
    let ts = `// Auto-generated TypeScript interfaces\n\n`;

    for (const schema of schemas) {
      ts += `export interface ${this.formatTypeName(schema.name)} {\n`;

      for (const field of schema.fields) {
        const tsType = this.toTypeScriptType(field.type);
        const optional = !field.required ? "?" : "";
        const comment = field.foreignKey
          ? `  // Foreign key to ${field.foreignKey.table}.${field.foreignKey.field}\n`
          : "";

        ts += `${comment}  ${field.name}${optional}: ${tsType};\n`;
      }

      if (this.options.enableTimestamps) {
        ts += `  readonly createdAt?: Date;\n`;
        ts += `  readonly updatedAt?: Date;\n`;
      }

      if (this.options.enableSoftDelete) {
        ts += `  readonly deletedAt?: Date | null;\n`;
      }

      ts += `}\n\n`;
    }

    return ts;
  }

  /**
   * Generate JSON Schema for validation
   */
  generateJsonSchema(schema: SchemaDefinition): string {
    const jsonSchema: any = {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: schema.name,
      type: "object",
      properties: {},
      required: [],
    };

    for (const field of schema.fields) {
      jsonSchema.properties[field.name] = this.toJsonSchemaProperty(field);
      if (field.required) {
        jsonSchema.required.push(field.name);
      }
    }

    if (this.options.enableTimestamps) {
      jsonSchema.properties.createdAt = {
        type: "string",
        format: "date-time",
      };
      jsonSchema.properties.updatedAt = {
        type: "string",
        format: "date-time",
      };
    }

    if (this.options.enableSoftDelete) {
      jsonSchema.properties.deletedAt = {
        type: ["string", "null"],
        format: "date-time",
      };
    }

    return JSON.stringify(jsonSchema, null, 2);
  }

  /**
   * Generate Prisma schema
   */
  generatePrismaSchema(schemas: SchemaDefinition[]): string {
    let prisma = `// This is your Prisma schema file\n\n`;
    prisma += `generator client {\n  provider = "prisma-client-js"\n}\n\n`;

    if (this.options.database === "postgresql") {
      prisma += `datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\n`;
    } else if (this.options.database === "mysql") {
      prisma += `datasource db {\n  provider = "mysql"\n  url      = env("DATABASE_URL")\n}\n\n`;
    } else if (this.options.database === "sqlite") {
      prisma += `datasource db {\n  provider = "sqlite"\n  url      = env("DATABASE_URL")\n}\n\n`;
    }

    for (const schema of schemas) {
      prisma += `model ${this.formatTypeName(schema.name)} {\n`;

      for (const field of schema.fields) {
        prisma += `  ${field.name}`;

        // Add type
        prisma += ` ${this.toPrismaType(field.type)}`;

        // Add modifiers
        if (field.primaryKey) {
          prisma += ` @id`;
        }
        if (field.unique) {
          prisma += ` @unique`;
        }
        if (field.default !== undefined) {
          prisma += ` @default(${JSON.stringify(field.default)})`;
        }
        if (field.foreignKey) {
          prisma += ` @relation(fields: [${field.name}], references: [${field.foreignKey.field}])`;
        }

        prisma += "\n";
      }

      if (this.options.enableTimestamps) {
        prisma += `  createdAt DateTime @default(now())\n`;
        prisma += `  updatedAt DateTime @updatedAt\n`;
      }

      if (this.options.enableSoftDelete) {
        prisma += `  deletedAt DateTime?\n`;
      }

      prisma += `}\n\n`;
    }

    return prisma;
  }

  /**
   * Generate field definition for SQL
   */
  private generateFieldDefinition(field: SchemaField): string {
    let definition = `  ${this.formatFieldName(field.name)} ${this.toSqlType(field.type)}`;

    if (!field.required) {
      definition += " NULL";
    } else {
      definition += " NOT NULL";
    }

    if (field.unique) {
      definition += " UNIQUE";
    }

    if (field.default !== undefined) {
      if (typeof field.default === "string") {
        definition += ` DEFAULT '${field.default}'`;
      } else {
        definition += ` DEFAULT ${field.default}`;
      }
    }

    if (field.foreignKey) {
      definition += ` REFERENCES ${this.formatTableName(field.foreignKey.table)}(${this.formatFieldName(field.foreignKey.field)})`;
      if (field.foreignKey.onDelete) {
        definition += ` ON DELETE ${field.foreignKey.onDelete}`;
      }
    }

    return definition;
  }

  /**
   * Generate index definition
   */
  private generateIndexDefinition(tableName: string, index: any): string {
    const uniquePart = index.unique ? "UNIQUE " : "";
    const indexName = `idx_${this.formatTableName(tableName)}_${index.fields.join("_")}`;
    return `CREATE ${uniquePart}INDEX IF NOT EXISTS ${indexName} ON ${this.formatTableName(tableName)} (${index.fields.join(", ")});`;
  }

  /**
   * Convert schema type to SQL type
   */
  private toSqlType(type: string): string {
    const typeMap: Record<string, string> = {
      string: "VARCHAR(255)",
      number: "DECIMAL(10,2)",
      integer: "INTEGER",
      boolean: "BOOLEAN",
      date: "TIMESTAMP",
      text: "TEXT",
      json: "JSONB",
      array: "TEXT[]",
    };

    if (this.options.database === "mysql") {
      typeMap["json"] = "JSON";
      typeMap["array"] = "TEXT";
    }

    if (this.options.database === "sqlite") {
      typeMap["json"] = "TEXT";
      typeMap["array"] = "TEXT";
    }

    return typeMap[type] || "VARCHAR(255)";
  }

  /**
   * Convert schema type to TypeScript type
   */
  private toTypeScriptType(type: string): string {
    const typeMap: Record<string, string> = {
      string: "string",
      number: "number",
      integer: "number",
      boolean: "boolean",
      date: "Date",
      text: "string",
      json: "any",
      array: "any[]",
    };
    return typeMap[type] || "any";
  }

  /**
   * Convert schema type to JSON Schema type
   */
  private toJsonSchemaProperty(field: SchemaField): any {
    const property: any = {
      description: field.name,
    };

    const typeMap: Record<string, string> = {
      string: "string",
      number: "number",
      integer: "integer",
      boolean: "boolean",
      date: "string",
      text: "string",
      json: "object",
      array: "array",
    };

    property.type = typeMap[field.type] || "string";

    if (field.type === "date") {
      property.format = "date-time";
    }

    if (field.default !== undefined) {
      property.default = field.default;
    }

    return property;
  }

  /**
   * Convert schema type to Prisma type
   */
  private toPrismaType(type: string): string {
    const typeMap: Record<string, string> = {
      string: "String",
      number: "Decimal",
      integer: "Int",
      boolean: "Boolean",
      date: "DateTime",
      text: "String",
      json: "Json",
      array: "String[]",
    };
    return typeMap[type] || "String";
  }

  /**
   * Format table name based on naming convention
   */
  private formatTableName(name: string): string {
    if (this.options.namingConvention === "snake_case") {
      return name
        .toLowerCase()
        .replace(/([A-Z])/g, "_$1")
        .replace(/^_/, "");
    } else if (this.options.namingConvention === "camelCase") {
      return name.charAt(0).toLowerCase() + name.slice(1);
    } else {
      return name;
    }
  }

  /**
   * Format field name based on naming convention
   */
  private formatFieldName(name: string): string {
    if (this.options.namingConvention === "snake_case") {
      return name
        .toLowerCase()
        .replace(/([A-Z])/g, "_$1")
        .replace(/^_/, "");
    } else if (this.options.namingConvention === "camelCase") {
      return name.charAt(0).toLowerCase() + name.slice(1);
    } else {
      return name;
    }
  }

  /**
   * Format type name for TypeScript/Prisma
   */
  private formatTypeName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
}

export default SchemaGenerator;
