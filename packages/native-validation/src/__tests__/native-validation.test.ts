/**
 * Native Validation Tests
 */

import {
  NativeValidator,
  Validators,
  ValidationSchema,
  ValidationField,
  ValidationResult,
  ValidationError,
  ValidatorFn,
} from "../index";

describe("NativeValidator", () => {
  let validator: NativeValidator;
  let schema: ValidationSchema;

  beforeEach(() => {
    schema = {
      fields: {
        name: {
          type: "string",
          required: true,
          min: 2,
          max: 50,
        },
        email: {
          type: "email",
          required: true,
        },
        age: {
          type: "number",
          required: false,
          min: 0,
          max: 150,
        },
        active: {
          type: "boolean",
          required: false,
        },
        tags: {
          type: "array",
          required: false,
          min: 1,
        },
        profile: {
          type: "object",
          required: false,
          schema: {
            fields: {
              bio: {
                type: "string",
                required: false,
              },
            },
          },
        },
      },
      strict: false,
    };
    validator = new NativeValidator(schema);
  });

  describe("Basic Validation", () => {
    test("should validate correct data", async () => {
      const data = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
        active: true,
        tags: ["developer", "engineer"],
      };

      const result: ValidationResult = await validator.validate(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toBeDefined();
    });

    test("should fail validation for missing required field", async () => {
      const data = {
        email: "john@example.com",
      };

      const result: ValidationResult = await validator.validate(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe("name");
    });

    test("should fail validation for invalid type", async () => {
      const data = {
        name: "John Doe",
        email: "not-an-email",
        age: "thirty",
      };

      const result: ValidationResult = await validator.validate(data);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Type Validation", () => {
    test("should validate string type", async () => {
      const result = await validator.validate({ name: "John", email: "john@example.com" });
      expect(result.valid).toBe(true);
    });

    test("should validate number type", async () => {
      const result = await validator.validate({
        name: "John",
        email: "john@example.com",
        age: 30,
      });
      expect(result.valid).toBe(true);
    });

    test("should validate boolean type", async () => {
      const result = await validator.validate({
        name: "John",
        email: "john@example.com",
        active: true,
      });
      expect(result.valid).toBe(true);
    });

    test("should validate array type", async () => {
      const result = await validator.validate({
        name: "John",
        email: "john@example.com",
        tags: ["tag1", "tag2"],
      });
      expect(result.valid).toBe(true);
    });

    test("should validate object type", async () => {
      const result = await validator.validate({
        name: "John",
        email: "john@example.com",
        profile: { bio: "A developer" },
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("Min/Max Validation", () => {
    test("should enforce string length min", async () => {
      const result = await validator.validate({
        name: "J",
        email: "john@example.com",
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain("at least 2");
    });

    test("should enforce string length max", async () => {
      const result = await validator.validate({
        name: "A".repeat(51),
        email: "john@example.com",
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain("at most 50");
    });

    test("should enforce number min", async () => {
      const result = await validator.validate({
        name: "John",
        email: "john@example.com",
        age: -1,
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain("at least 0");
    });

    test("should enforce number max", async () => {
      const result = await validator.validate({
        name: "John",
        email: "john@example.com",
        age: 200,
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain("at most 150");
    });
  });

  describe("Custom Validators", () => {
    test("should support custom validators", async () => {
      const customSchema: ValidationSchema = {
        fields: {
          username: {
            type: "string",
            required: true,
            customValidator: (value: any) => {
              return (
                /^[a-zA-Z0-9_]+$/.test(value) ||
                "Username can only contain letters, numbers, and underscores"
              );
            },
          },
        },
      };

      const customValidator = new NativeValidator(customSchema);

      const validResult = await customValidator.validate({ username: "john_doe123" });
      expect(validResult.valid).toBe(true);

      const invalidResult = await customValidator.validate({ username: "john-doe" });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors[0].message).toContain("letters, numbers, and underscores");
    });

    test("should support async validators", async () => {
      const asyncValidatorFn: ValidatorFn = async (value: string) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return value.length > 5 || "Must be longer than 5 characters";
      };

      const customSchema: ValidationSchema = {
        fields: {
          password: {
            type: "string",
            required: true,
            customValidator: asyncValidatorFn,
          },
        },
      };

      const customValidator = new NativeValidator(customSchema);

      const validResult = await customValidator.validate({ password: "password123" });
      expect(validResult.valid).toBe(true);

      const invalidResult = await customValidator.validate({ password: "123" });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors[0].message).toBe("Must be longer than 5 characters");
    });
  });

  describe("Pattern Validation", () => {
    test("should validate regex patterns", async () => {
      const patternSchema: ValidationSchema = {
        fields: {
          phone: {
            type: "string",
            required: true,
            pattern: /^\+?\d{10,15}$/,
          },
        },
      };

      const patternValidator = new NativeValidator(patternSchema);

      const validResult = await patternValidator.validate({ phone: "+1234567890" });
      expect(validResult.valid).toBe(true);

      const invalidResult = await patternValidator.validate({ phone: "abc" });
      expect(invalidResult.valid).toBe(false);
    });
  });

  describe("Enum Validation", () => {
    test("should validate enum values", async () => {
      const enumSchema: ValidationSchema = {
        fields: {
          status: {
            type: "string",
            required: true,
            enum: ["active", "inactive", "pending"],
          },
        },
      };

      const enumValidator = new NativeValidator(enumSchema);

      const validResult = await enumValidator.validate({ status: "active" });
      expect(validResult.valid).toBe(true);

      const invalidResult = await enumValidator.validate({ status: "deleted" });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors[0].message).toContain("active, inactive, pending");
    });
  });

  describe("Validation Rules", () => {
    test("should apply validation rules", async () => {
      const rulesSchema: ValidationSchema = {
        fields: {
          password: {
            type: "string",
            required: true,
            rules: [
              {
                validator: (value: string) => value.length >= 8,
                message: "Password must be at least 8 characters",
              },
              {
                validator: (value: string) => /[A-Z]/.test(value),
                message: "Password must contain uppercase letter",
              },
              {
                validator: (value: string) => /[0-9]/.test(value),
                message: "Password must contain number",
              },
            ],
          },
        },
      };

      const rulesValidator = new NativeValidator(rulesSchema);

      const validResult = await rulesValidator.validate({ password: "Password123" });
      expect(validResult.valid).toBe(true);

      const invalidResult = await rulesValidator.validate({ password: "password" });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Nested Schema Validation", () => {
    test("should validate nested objects", async () => {
      const result = await validator.validate({
        name: "John",
        email: "john@example.com",
        profile: { bio: "A developer" },
      });
      expect(result.valid).toBe(true);
    });

    test("should handle nested validation errors", async () => {
      const nestedSchema: ValidationSchema = {
        fields: {
          user: {
            type: "object",
            required: true,
            schema: {
              fields: {
                email: {
                  type: "email",
                  required: true,
                },
              },
            },
          },
        },
      };

      const nestedValidator = new NativeValidator(nestedSchema);
      const result = await nestedValidator.validate({
        user: { email: "invalid-email" },
      });

      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toContain("email");
    });
  });

  describe("Strict Mode", () => {
    test("should reject extra fields in strict mode", async () => {
      const strictSchema: ValidationSchema = {
        fields: {
          name: {
            type: "string",
            required: true,
          },
        },
        strict: true,
      };

      const strictValidator = new NativeValidator(strictSchema);
      const result = await strictValidator.validate({
        name: "John",
        extraField: "not allowed",
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === "extraField")).toBe(true);
    });

    test("should allow extra fields in non-strict mode", async () => {
      const result = await validator.validate({
        name: "John",
        email: "john@example.com",
        extraField: "allowed",
      });

      expect(result.valid).toBe(true);
    });
  });

  describe("Field-Level Validation", () => {
    test("should validate single field", async () => {
      const result = await validator.validateField("name", "John Doe");
      expect(result.valid).toBe(true);
    });

    test("should return error for invalid field", async () => {
      const result = await validator.validateField("name", "");
      expect(result.valid).toBe(false);
    });

    test("should handle non-existent field", async () => {
      const result = await validator.validateField("nonExistent", "value");
      expect(result.valid).toBe(false);
    });
  });

  describe("Schema Management", () => {
    test("should get schema", () => {
      const retrievedSchema = validator.getSchema();
      expect(retrievedSchema).toEqual(schema);
    });

    test("should update schema", async () => {
      const result1 = await validator.validate({
        name: "John",
        email: "john@example.com",
        username: "johndoe",
      });
      expect(result1.valid).toBe(true); // Extra field allowed in non-strict mode

      validator.updateSchema({ strict: true });

      const result2 = await validator.validate({
        name: "John",
        email: "john@example.com",
        username: "johndoe",
      });
      expect(result2.valid).toBe(false); // Extra field rejected in strict mode
    });
  });

  describe("Built-in Validators", () => {
    test("Validators.required should work", () => {
      expect(Validators.required("value")).toBe(true);
      expect(Validators.required("")).toBe(false);
      expect(Validators.required(null)).toBe(false);
      expect(Validators.required(undefined)).toBe(false);
    });

    test("Validators.minLength should work", () => {
      const validator = Validators.minLength(5);
      expect(validator("hello")).toBe(true);
      expect(validator("hi")).toBe("Must be at least 5 characters");
    });

    test("Validators.maxLength should work", () => {
      const validator = Validators.maxLength(10);
      expect(validator("hello")).toBe(true);
      expect(validator("this is too long")).toBe("Must be at most 10 characters");
    });

    test("Validators.min should work", () => {
      const validator = Validators.min(5);
      expect(validator(10)).toBe(true);
      expect(validator(3)).toBe("Must be at least 5");
    });

    test("Validators.max should work", () => {
      const validator = Validators.max(10);
      expect(validator(5)).toBe(true);
      expect(validator(15)).toBe("Must be at most 10");
    });

    test("Validators.pattern should work", () => {
      const validator = Validators.pattern(/^[a-z]+$/);
      expect(validator("hello")).toBe(true);
      expect(validator("Hello123")).toBe("Must match pattern /^[a-z]+$/");
    });

    test("Validators.email should work", () => {
      expect(Validators.email("test@example.com")).toBe(true);
      expect(Validators.email("invalid")).toBe(false);
    });

    test("Validators.url should work", () => {
      expect(Validators.url("https://example.com")).toBe(true);
      expect(Validators.url("not-a-url")).toBe(false);
    });

    test("Validators.oneOf should work", () => {
      const validator = Validators.oneOf("a", "b", "c");
      expect(validator("a")).toBe(true);
      expect(validator("d")).toBe("Must be one of: a, b, c");
    });

    test("Validators.asyncEmail should work", async () => {
      const validator = Validators.asyncEmail();
      expect(await validator("test@example.com")).toBe(true);
      expect(await validator("invalid")).toBe("Invalid email format");
    });
  });
});
