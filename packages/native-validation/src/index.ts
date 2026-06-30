/**
 * MyCodeXvantaOS Native Validation Engine
 * Provides a comprehensive validation system with schema-based validation
 */

export type ValidatorFn = (value: any) => boolean | string | Promise<boolean | string>;

export interface ValidationRule {
  validator: ValidatorFn;
  message?: string;
}

export interface ValidationField {
  required?: boolean;
  type?: "string" | "number" | "boolean" | "date" | "object" | "array" | "email" | "url" | "custom";
  rules?: ValidationRule[];
  schema?: ValidationSchema;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  customValidator?: ValidatorFn;
}

export interface ValidationSchema {
  fields: Record<string, ValidationField>;
  strict?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  data?: any;
}

export class NativeValidator {
  private schema: ValidationSchema;
  private customValidators: Map<string, ValidatorFn> = new Map();

  constructor(schema: ValidationSchema) {
    this.schema = schema;
  }

  /**
   * Register a custom validator
   */
  registerValidator(name: string, validator: ValidatorFn): void {
    this.customValidators.set(name, validator);
  }

  /**
   * Validate data against schema
   */
  async validate(data: any): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const result: any = {};

    for (const [fieldName, fieldConfig] of Object.entries(this.schema.fields)) {
      const value = data[fieldName];
      const fieldErrors: ValidationError[] = [];

      // Check required
      if (fieldConfig.required && (value === undefined || value === null)) {
        errors.push({
          field: fieldName,
          message: `Field '${fieldName}' is required`,
          value,
        });
        continue;
      }

      // Skip validation if not required and value is undefined/null
      if (!fieldConfig.required && (value === undefined || value === null)) {
        continue;
      }

      // Validate type
      const typeError = this.validateType(fieldName, value, fieldConfig);
      if (typeError) {
        errors.push(typeError);
        continue;
      }

      // Validate min/max for numbers
      if (fieldConfig.type === "number") {
        if (fieldConfig.min !== undefined && value < fieldConfig.min) {
          fieldErrors.push({
            field: fieldName,
            message: `Field '${fieldName}' must be at least ${fieldConfig.min}`,
            value,
          });
        }
        if (fieldConfig.max !== undefined && value > fieldConfig.max) {
          fieldErrors.push({
            field: fieldName,
            message: `Field '${fieldName}' must be at most ${fieldConfig.max}`,
            value,
          });
        }
      }

      // Validate string length min/max
      if (fieldConfig.type === "string" && typeof value === "string") {
        if (fieldConfig.min !== undefined && value.length < fieldConfig.min) {
          fieldErrors.push({
            field: fieldName,
            message: `Field '${fieldName}' must be at least ${fieldConfig.min} characters`,
            value,
          });
        }
        if (fieldConfig.max !== undefined && value.length > fieldConfig.max) {
          fieldErrors.push({
            field: fieldName,
            message: `Field '${fieldName}' must be at most ${fieldConfig.max} characters`,
            value,
          });
        }
      }

      // Validate array length
      if (fieldConfig.type === "array" && Array.isArray(value)) {
        if (fieldConfig.min !== undefined && value.length < fieldConfig.min) {
          fieldErrors.push({
            field: fieldName,
            message: `Field '${fieldName}' must have at least ${fieldConfig.min} items`,
            value,
          });
        }
        if (fieldConfig.max !== undefined && value.length > fieldConfig.max) {
          fieldErrors.push({
            field: fieldName,
            message: `Field '${fieldName}' must have at most ${fieldConfig.max} items`,
            value,
          });
        }
      }

      // Validate pattern
      if (fieldConfig.pattern && fieldConfig.pattern.test) {
        if (!fieldConfig.pattern.test(value)) {
          fieldErrors.push({
            field: fieldName,
            message: `Field '${fieldName}' does not match required pattern`,
            value,
          });
        }
      }

      // Validate enum
      if (fieldConfig.enum && !fieldConfig.enum.includes(value)) {
        fieldErrors.push({
          field: fieldName,
          message: `Field '${fieldName}' must be one of: ${fieldConfig.enum.join(", ")}`,
          value,
        });
      }

      // Validate custom rules
      if (fieldConfig.rules) {
        for (const rule of fieldConfig.rules) {
          const ruleResult = await rule.validator(value);
          if (ruleResult === false || typeof ruleResult === "string") {
            fieldErrors.push({
              field: fieldName,
              message: rule.message || ruleResult.toString(),
              value,
            });
          }
        }
      }

      // Validate custom validator
      if (fieldConfig.customValidator) {
        const customResult = await fieldConfig.customValidator(value);
        if (customResult === false || typeof customResult === "string") {
          fieldErrors.push({
            field: fieldName,
            message:
              customResult === false ? `Field '${fieldName}' validation failed` : customResult,
            value,
          });
        }
      }

      // Validate nested schema
      if (fieldConfig.schema && value) {
        const nestedValidator = new NativeValidator(fieldConfig.schema);
        const nestedResult = await nestedValidator.validate(value);
        if (!nestedResult.valid) {
          nestedResult.errors.forEach((nestedError) => {
            errors.push({
              field: `${fieldName}.${nestedError.field}`,
              message: nestedError.message,
              value: nestedError.value,
            });
          });
        } else {
          result[fieldName] = nestedResult.data;
        }
      }

      if (fieldErrors.length === 0) {
        result[fieldName] = value;
      } else {
        errors.push(...fieldErrors);
      }
    }

    // Check for extra fields in strict mode
    if (this.schema.strict) {
      const allowedFields = Object.keys(this.schema.fields);
      for (const fieldName of Object.keys(data)) {
        if (!allowedFields.includes(fieldName)) {
          errors.push({
            field: fieldName,
            message: `Field '${fieldName}' is not allowed`,
            value: data[fieldName],
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      data: errors.length === 0 ? result : undefined,
    };
  }

  private validateType(
    fieldName: string,
    value: any,
    config: ValidationField
  ): ValidationError | undefined {
    if (!config.type) return undefined;

    let isValid = false;

    switch (config.type) {
      case "string":
        isValid = typeof value === "string";
        break;
      case "number":
        isValid = typeof value === "number" && !isNaN(value);
        break;
      case "boolean":
        isValid = typeof value === "boolean";
        break;
      case "date":
        isValid = value instanceof Date || !isNaN(Date.parse(value));
        break;
      case "object":
        isValid = typeof value === "object" && !Array.isArray(value) && value !== null;
        break;
      case "array":
        isValid = Array.isArray(value);
        break;
      case "email":
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        break;
      case "url":
        isValid = /^https?:\/\/.+\..+/.test(value);
        break;
    }

    if (!isValid) {
      return {
        field: fieldName,
        message: `Field '${fieldName}' must be of type ${config.type}`,
        value,
      };
    }

    return undefined;
  }

  /**
   * Validate a single field
   */
  async validateField(fieldName: string, value: any): Promise<ValidationResult> {
    const fieldConfig = this.schema.fields[fieldName];
    if (!fieldConfig) {
      return {
        valid: false,
        errors: [
          {
            field: fieldName,
            message: `Field '${fieldName}' is not defined in schema`,
            value,
          },
        ],
      };
    }

    const tempSchema: ValidationSchema = {
      fields: {
        [fieldName]: fieldConfig,
      },
    };

    const tempValidator = new NativeValidator(tempSchema);
    return tempValidator.validate({ [fieldName]: value });
  }

  /**
   * Get schema fields
   */
  getSchema(): ValidationSchema {
    return this.schema;
  }

  /**
   * Update schema
   */
  updateSchema(schema: Partial<ValidationSchema>): void {
    this.schema = {
      ...this.schema,
      ...schema,
      fields: {
        ...this.schema.fields,
        ...schema.fields,
      },
    };
  }
}

// Built-in validators
export const Validators = {
  required: (value: any): boolean => value !== undefined && value !== null && value !== "",

  minLength:
    (min: number) =>
    (value: string): boolean | string => {
      return value.length >= min || `Must be at least ${min} characters`;
    },

  maxLength:
    (max: number) =>
    (value: string): boolean | string => {
      return value.length <= max || `Must be at most ${max} characters`;
    },

  min:
    (min: number) =>
    (value: number): boolean | string => {
      return value >= min || `Must be at least ${min}`;
    },

  max:
    (max: number) =>
    (value: number): boolean | string => {
      return value <= max || `Must be at most ${max}`;
    },

  pattern:
    (pattern: RegExp, message?: string) =>
    (value: string): boolean | string => {
      return pattern.test(value) || message || `Must match pattern ${pattern}`;
    },

  email: (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),

  url: (value: string): boolean => /^https?:\/\/.+\..+/.test(value),

  custom: (validator: ValidatorFn) => validator,

  oneOf:
    (...allowed: any[]) =>
    (value: any): boolean | string => {
      return allowed.includes(value) || `Must be one of: ${allowed.join(", ")}`;
    },

  // Async validators
  asyncEmail:
    (checkDomain?: boolean) =>
    async (value: string): Promise<boolean | string> => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return "Invalid email format";

      if (checkDomain) {
        const domain = value.split("@")[1];
        // Simulate async domain check
        await new Promise((resolve) => setTimeout(resolve, 10));
        return true;
      }

      return true;
    },
};

export default NativeValidator;
