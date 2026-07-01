import { ApiGenerator, ModelDefinition, ApiEndpoint } from "../src/index";

describe("ApiGenerator", () => {
  let generator: ApiGenerator;

  beforeEach(() => {
    generator = new ApiGenerator({
      apiType: "rest",
      basePath: "/api/v1",
      version: "1.0.0",
      authType: "bearer",
    });
  });

  describe("Constructor", () => {
    it("should initialize with default options", () => {
      const defaultGen = new ApiGenerator({ apiType: "rest" });
      expect(defaultGen).toBeInstanceOf(ApiGenerator);
    });

    it("should initialize with custom options", () => {
      const customGen = new ApiGenerator({
        apiType: "graphql",
        basePath: "/api/v2",
        version: "2.0.0",
        authType: "apiKey",
      });
      expect(customGen).toBeInstanceOf(ApiGenerator);
    });
  });

  describe("generateCrudEndpoints", () => {
    it("should generate 5 CRUD endpoints for a model", () => {
      const model: ModelDefinition = {
        name: "User",
        properties: {
          id: { type: "string", required: true },
          name: { type: "string", required: true },
          email: { type: "string", required: true },
        },
      };

      const endpoints = generator.generateCrudEndpoints(model);
      expect(endpoints).toHaveLength(5);
    });

    it("should generate GET list endpoint", () => {
      const model: ModelDefinition = {
        name: "User",
        properties: {
          id: { type: "string", required: true },
          name: { type: "string", required: true },
        },
      };

      const endpoints = generator.generateCrudEndpoints(model);
      const listEndpoint = endpoints.find((e) => e.method === "GET" && e.path === "/api/v1/users");

      expect(listEndpoint).toBeDefined();
      expect(listEndpoint?.description).toContain("List all");
      expect(listEndpoint?.parameters).toHaveLength(2);
    });

    it("should generate GET by ID endpoint", () => {
      const model: ModelDefinition = {
        name: "User",
        properties: {
          id: { type: "string", required: true },
          name: { type: "string", required: true },
        },
      };

      const endpoints = generator.generateCrudEndpoints(model);
      const getEndpoint = endpoints.find(
        (e) => e.method === "GET" && e.path === "/api/v1/users/:id"
      );

      expect(getEndpoint).toBeDefined();
      expect(getEndpoint?.parameters).toHaveLength(1);
      expect(getEndpoint?.parameters?.[0].name).toBe("id");
    });

    it("should generate POST create endpoint", () => {
      const model: ModelDefinition = {
        name: "User",
        properties: {
          id: { type: "string", required: true },
          name: { type: "string", required: true },
        },
      };

      const endpoints = generator.generateCrudEndpoints(model);
      const createEndpoint = endpoints.find((e) => e.method === "POST");

      expect(createEndpoint).toBeDefined();
      expect(createEndpoint?.requestBody).toBeDefined();
      expect(createEndpoint?.responses).toHaveLength(2);
    });

    it("should generate PUT update endpoint", () => {
      const model: ModelDefinition = {
        name: "User",
        properties: {
          id: { type: "string", required: true },
          name: { type: "string", required: true },
        },
      };

      const endpoints = generator.generateCrudEndpoints(model);
      const updateEndpoint = endpoints.find((e) => e.method === "PUT");

      expect(updateEndpoint).toBeDefined();
      expect(updateEndpoint?.requestBody).toBeDefined();
    });

    it("should generate DELETE endpoint", () => {
      const model: ModelDefinition = {
        name: "User",
        properties: {
          id: { type: "string", required: true },
          name: { type: "string", required: true },
        },
      };

      const endpoints = generator.generateCrudEndpoints(model);
      const deleteEndpoint = endpoints.find((e) => e.method === "DELETE");

      expect(deleteEndpoint).toBeDefined();
      expect(deleteEndpoint?.responses).toHaveLength(2);
    });
  });

  describe("generateOpenApiSpec", () => {
    it("should generate valid OpenAPI specification", () => {
      const models: ModelDefinition[] = [
        {
          name: "User",
          properties: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
          },
        },
      ];

      const spec = generator.generateOpenApiSpec("Test API", "Test Description", models);
      const parsedSpec = JSON.parse(spec);

      expect(parsedSpec.openapi).toBe("3.0.0");
      expect(parsedSpec.info.title).toBe("Test API");
      expect(parsedSpec.info.description).toBe("Test Description");
      expect(parsedSpec.info.version).toBe("1.0.0");
      expect(parsedSpec.paths).toBeDefined();
      expect(parsedSpec.components).toBeDefined();
    });

    it("should include paths for all models", () => {
      const models: ModelDefinition[] = [
        {
          name: "User",
          properties: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
          },
        },
        {
          name: "Post",
          properties: {
            id: { type: "string", required: true },
            title: { type: "string", required: true },
          },
        },
      ];

      const spec = generator.generateOpenApiSpec("Test API", "Test Description", models);
      const parsedSpec = JSON.parse(spec);

      expect(Object.keys(parsedSpec.paths)).toContain("/api/v1/users");
      expect(Object.keys(parsedSpec.paths)).toContain("/api/v1/posts");
    });

    it("should include schemas in components", () => {
      const models: ModelDefinition[] = [
        {
          name: "User",
          properties: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
          },
        },
      ];

      const spec = generator.generateOpenApiSpec("Test API", "Test Description", models);
      const parsedSpec = JSON.parse(spec);

      expect(parsedSpec.components.schemas).toBeDefined();
      expect(parsedSpec.components.schemas.User).toBeDefined();
      expect(parsedSpec.components.schemas.User.type).toBe("object");
    });

    it("should include custom endpoints if provided", () => {
      const models: ModelDefinition[] = [];
      const customEndpoints = [
        {
          method: "GET" as const,
          path: "/api/v1/health",
          description: "Health check endpoint",
          responses: [
            {
              statusCode: 200,
              description: "Service is healthy",
            },
          ],
        },
      ];

      const spec = generator.generateOpenApiSpec(
        "Test API",
        "Test Description",
        models,
        customEndpoints
      );
      const parsedSpec = JSON.parse(spec);

      expect(parsedSpec.paths["/api/v1/health"]).toBeDefined();
      expect(parsedSpec.paths["/api/v1/health"].get).toBeDefined();
    });
  });

  describe("generateGraphQLSchema", () => {
    it("should generate valid GraphQL schema", () => {
      const models: ModelDefinition[] = [
        {
          name: "User",
          properties: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
          },
        },
      ];

      const schema = generator.generateGraphQLSchema(models);

      expect(schema).toContain("type User");
      expect(schema).toContain("id: String!");
      expect(schema).toContain("name: String!");
      expect(schema).toContain("type Query");
      expect(schema).toContain("type Mutation");
    });

    it("should generate input types for mutations", () => {
      const models: ModelDefinition[] = [
        {
          name: "User",
          properties: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
          },
        },
      ];

      const schema = generator.generateGraphQLSchema(models);

      expect(schema).toContain("input UserInput");
    });

    it("should generate queries for all models", () => {
      const models: ModelDefinition[] = [
        {
          name: "User",
          properties: {
            id: { type: "string", required: true },
          },
        },
        {
          name: "Post",
          properties: {
            id: { type: "string", required: true },
          },
        },
      ];

      const schema = generator.generateGraphQLSchema(models);

      expect(schema).toContain("users(page: Int, limit: Int): [User!]!");
      expect(schema).toContain("user(id: ID!): User");
      expect(schema).toContain("posts(page: Int, limit: Int): [Post!]!");
      expect(schema).toContain("post(id: ID!): Post");
    });

    it("should generate mutations for all models", () => {
      const models: ModelDefinition[] = [
        {
          name: "User",
          properties: {
            id: { type: "string", required: true },
          },
        },
      ];

      const schema = generator.generateGraphQLSchema(models);

      expect(schema).toContain("createUser(input: UserInput!): User!");
      expect(schema).toContain("updateUser(id: ID!, input: UserInput!): User");
      expect(schema).toContain("deleteUser(id: ID!): Boolean");
    });

    it("should handle multiple models", () => {
      const models: ModelDefinition[] = [
        {
          name: "User",
          properties: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
          },
        },
        {
          name: "Post",
          properties: {
            id: { type: "string", required: true },
            title: { type: "string", required: true },
            content: { type: "string", required: false },
          },
        },
      ];

      const schema = generator.generateGraphQLSchema(models);

      expect(schema).toContain("type User");
      expect(schema).toContain("type Post");
      expect(schema).toContain("input UserInput");
      expect(schema).toContain("input PostInput");
    });
  });

  describe("Type conversion", () => {
    it("should convert string type to GraphQL String", () => {
      const models: ModelDefinition[] = [
        {
          name: "Test",
          properties: {
            name: { type: "string", required: true },
          },
        },
      ];

      const schema = generator.generateGraphQLSchema(models);
      expect(schema).toContain("name: String!");
    });

    it("should convert number type to GraphQL Float", () => {
      const models: ModelDefinition[] = [
        {
          name: "Test",
          properties: {
            value: { type: "number", required: true },
          },
        },
      ];

      const schema = generator.generateGraphQLSchema(models);
      expect(schema).toContain("value: Float!");
    });

    it("should convert integer type to GraphQL Int", () => {
      const models: ModelDefinition[] = [
        {
          name: "Test",
          properties: {
            count: { type: "integer", required: true },
          },
        },
      ];

      const schema = generator.generateGraphQLSchema(models);
      expect(schema).toContain("count: Int!");
    });

    it("should convert boolean type to GraphQL Boolean", () => {
      const models: ModelDefinition[] = [
        {
          name: "Test",
          properties: {
            active: { type: "boolean", required: true },
          },
        },
      ];

      const schema = generator.generateGraphQLSchema(models);
      expect(schema).toContain("active: Boolean!");
    });
  });
});
