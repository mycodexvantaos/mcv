/**
 * API Generator Module
 *
 * This module provides capabilities for generating REST APIs, GraphQL schemas,
 * and OpenAPI specifications from data models and business logic.
 */

export interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description?: string;
  parameters?: ApiParameter[];
  requestBody?: ApiSchema;
  responses: ApiResponse[];
  tags?: string[];
}

export interface ApiParameter {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  type: string;
  required: boolean;
  description?: string;
}

export interface ApiResponse {
  statusCode: number;
  description?: string;
  schema?: ApiSchema;
}

export interface ApiSchema {
  type: "object" | "array" | "string" | "number" | "boolean" | "integer";
  properties?: Record<string, ApiSchema>;
  items?: ApiSchema;
  required?: string[];
  description?: string;
  example?: any;
}

export interface ApiGeneratorOptions {
  apiType?: "rest" | "graphql" | "openapi";
  basePath?: string;
  version?: string;
  authType?: "none" | "bearer" | "basic" | "apiKey";
}

export interface ModelDefinition {
  name: string;
  properties: Record<string, { type: string; required: boolean; description?: string }>;
}

export class ApiGenerator {
  private options: ApiGeneratorOptions;

  constructor(options: ApiGeneratorOptions = {}) {
    this.options = {
      apiType: "rest",
      basePath: "/api/v1",
      version: "1.0.0",
      authType: "bearer",
      ...options,
    };
  }

  /**
   * Generate CRUD endpoints for a model
   */
  generateCrudEndpoints(model: ModelDefinition): ApiEndpoint[] {
    const endpoints: ApiEndpoint[] = [];
    const modelName = model.name.toLowerCase();
    const basePath = `${this.options.basePath}/${modelName}s`;

    // List endpoint
    endpoints.push({
      method: "GET",
      path: basePath,
      description: `List all ${model.name} resources`,
      parameters: [
        {
          name: "page",
          in: "query",
          type: "integer",
          required: false,
          description: "Page number for pagination",
        },
        {
          name: "limit",
          in: "query",
          type: "integer",
          required: false,
          description: "Number of items per page",
        },
      ],
      responses: [
        {
          statusCode: 200,
          description: `Successfully retrieved list of ${model.name} resources`,
          schema: {
            type: "array",
            items: this.modelToSchema(model),
          },
        },
      ],
      tags: [modelName],
    });

    // Get by ID endpoint
    endpoints.push({
      method: "GET",
      path: `${basePath}/:id`,
      description: `Get a specific ${model.name} by ID`,
      parameters: [
        {
          name: "id",
          in: "path",
          type: "string",
          required: true,
          description: `${model.name} ID`,
        },
      ],
      responses: [
        {
          statusCode: 200,
          description: `Successfully retrieved ${model.name}`,
          schema: this.modelToSchema(model),
        },
        {
          statusCode: 404,
          description: `${model.name} not found`,
        },
      ],
      tags: [modelName],
    });

    // Create endpoint
    endpoints.push({
      method: "POST",
      path: basePath,
      description: `Create a new ${model.name}`,
      requestBody: this.modelToSchema(model),
      responses: [
        {
          statusCode: 201,
          description: `Successfully created ${model.name}`,
          schema: this.modelToSchema(model),
        },
        {
          statusCode: 400,
          description: "Invalid request body",
        },
      ],
      tags: [modelName],
    });

    // Update endpoint
    endpoints.push({
      method: "PUT",
      path: `${basePath}/:id`,
      description: `Update a specific ${model.name}`,
      parameters: [
        {
          name: "id",
          in: "path",
          type: "string",
          required: true,
          description: `${model.name} ID`,
        },
      ],
      requestBody: this.modelToSchema(model),
      responses: [
        {
          statusCode: 200,
          description: `Successfully updated ${model.name}`,
          schema: this.modelToSchema(model),
        },
        {
          statusCode: 404,
          description: `${model.name} not found`,
        },
      ],
      tags: [modelName],
    });

    // Delete endpoint
    endpoints.push({
      method: "DELETE",
      path: `${basePath}/:id`,
      description: `Delete a specific ${model.name}`,
      parameters: [
        {
          name: "id",
          in: "path",
          type: "string",
          required: true,
          description: `${model.name} ID`,
        },
      ],
      responses: [
        {
          statusCode: 204,
          description: `Successfully deleted ${model.name}`,
        },
        {
          statusCode: 404,
          description: `${model.name} not found`,
        },
      ],
      tags: [modelName],
    });

    return endpoints;
  }

  /**
   * Generate OpenAPI specification
   */
  generateOpenApiSpec(
    title: string,
    description: string,
    models: ModelDefinition[],
    customEndpoints?: ApiEndpoint[]
  ): string {
    const paths: Record<string, any> = {};
    const components: Record<string, any> = { schemas: {} };

    // Generate CRUD endpoints for all models
    for (const model of models) {
      const endpoints = this.generateCrudEndpoints(model);
      for (const endpoint of endpoints) {
        const pathItem: any = {};
        pathItem[endpoint.method.toLowerCase()] = {
          summary: endpoint.description,
          tags: endpoint.tags,
          parameters: endpoint.parameters?.map((param) => ({
            name: param.name,
            in: param.in,
            required: param.required,
            schema: { type: param.type },
            description: param.description,
          })),
          responses: {},
        };

        if (endpoint.requestBody) {
          pathItem[endpoint.method.toLowerCase()].requestBody = {
            content: {
              "application/json": {
                schema: endpoint.requestBody,
              },
            },
          };
        }

        for (const response of endpoint.responses) {
          pathItem[endpoint.method.toLowerCase()].responses[response.statusCode] = {
            description: response.description,
          };

          if (response.schema) {
            pathItem[endpoint.method.toLowerCase()].responses[response.statusCode].content = {
              "application/json": {
                schema: response.schema,
              },
            };
          }
        }

        paths[endpoint.path] = { ...paths[endpoint.path], ...pathItem };
      }

      // Add model schema to components
      components.schemas[model.name] = this.modelToSchema(model);
    }

    // Add custom endpoints if provided
    if (customEndpoints) {
      for (const endpoint of customEndpoints) {
        const pathItem: any = {};
        pathItem[endpoint.method.toLowerCase()] = {
          summary: endpoint.description,
          tags: endpoint.tags,
          responses: {},
        };

        if (endpoint.parameters) {
          pathItem[endpoint.method.toLowerCase()].parameters = endpoint.parameters.map((param) => ({
            name: param.name,
            in: param.in,
            required: param.required,
            schema: { type: param.type },
            description: param.description,
          }));
        }

        if (endpoint.requestBody) {
          pathItem[endpoint.method.toLowerCase()].requestBody = {
            content: {
              "application/json": {
                schema: endpoint.requestBody,
              },
            },
          };
        }

        for (const response of endpoint.responses) {
          pathItem[endpoint.method.toLowerCase()].responses[response.statusCode] = {
            description: response.description,
          };

          if (response.schema) {
            pathItem[endpoint.method.toLowerCase()].responses[response.statusCode].content = {
              "application/json": {
                schema: response.schema,
              },
            };
          }
        }

        paths[endpoint.path] = { ...paths[endpoint.path], ...pathItem };
      }
    }

    const openApiSpec = {
      openapi: "3.0.0",
      info: {
        title,
        description,
        version: this.options.version,
      },
      servers: [
        {
          url: this.options.basePath,
          description: "API Server",
        },
      ],
      paths,
      components,
    };

    return JSON.stringify(openApiSpec, null, 2);
  }

  /**
   * Generate GraphQL schema
   */
  generateGraphQLSchema(models: ModelDefinition[]): string {
    let schema = `# GraphQL Schema generated by MyCodeXvantaOS\n\n`;

    // Generate types
    for (const model of models) {
      schema += `type ${model.name} {\n`;
      for (const [propName, propDef] of Object.entries(model.properties)) {
        const graphQLType = this.toGraphQLType(propDef.type);
        const optional = propDef.required ? "!" : "";
        schema += `  ${propName}: ${graphQLType}${optional}\n`;
      }
      schema += `}\n\n`;
    }

    // Generate queries
    schema += `type Query {\n`;
    for (const model of models) {
      const modelName = model.name;
      const modelNameLower = modelName.toLowerCase();
      schema += `  ${modelNameLower}s(page: Int, limit: Int): [${modelName}!]!\n`;
      schema += `  ${modelNameLower}(id: ID!): ${modelName}\n`;
    }
    schema += `}\n\n`;

    // Generate mutations
    schema += `type Mutation {\n`;
    for (const model of models) {
      const modelName = model.name;
      const modelNameLower = modelName.toLowerCase();
      schema += `  create${modelName}(input: ${modelName}Input!): ${modelName}!\n`;
      schema += `  update${modelName}(id: ID!, input: ${modelName}Input!): ${modelName}\n`;
      schema += `  delete${modelName}(id: ID!): Boolean\n`;
    }
    schema += `}\n\n`;

    // Generate input types
    for (const model of models) {
      schema += `input ${model.name}Input {\n`;
      for (const [propName, propDef] of Object.entries(model.properties)) {
        const graphQLType = this.toGraphQLType(propDef.type);
        const optional = propDef.required ? "!" : "";
        schema += `  ${propName}: ${graphQLType}${optional}\n`;
      }
      schema += `}\n\n`;
    }

    return schema;
  }

  /**
   * Convert model definition to API schema
   */
  private modelToSchema(model: ModelDefinition): ApiSchema {
    const properties: Record<string, ApiSchema> = {};
    const required: string[] = [];

    for (const [propName, propDef] of Object.entries(model.properties)) {
      properties[propName] = {
        type: propDef.type as any,
        description: propDef.description,
      };
      if (propDef.required) {
        required.push(propName);
      }
    }

    return {
      type: "object",
      properties,
      required,
    };
  }

  /**
   * Convert type string to GraphQL type
   */
  private toGraphQLType(type: string): string {
    const typeMap: Record<string, string> = {
      string: "String",
      number: "Float",
      integer: "Int",
      boolean: "Boolean",
      object: "JSON",
      array: "[String]",
    };
    return typeMap[type] || "String";
  }
}

export default ApiGenerator;
