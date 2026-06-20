/**
 * Request-shape validators built on Ajv. These guard the HTTP boundary only —
 * deep governance semantics live in the naming/closure engines. Schemas embed
 * the spec regexes so malformed payloads are rejected before reaching business
 * logic (charter: input validation, consistent API error format).
 *
 * Rationale: separating transport validation (Ajv) from governance evaluation
 * (closure engine) keeps each layer single-responsibility and testable in
 * isolation.
 */
import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });

const namespaceSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
    owner: { type: 'string', minLength: 1 },
    policies: { type: 'array', items: { type: 'string' } },
  },
  required: ['name', 'owner'],
};

const closureSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    namespace: { type: 'string', minLength: 1 },
    rules: {
      type: 'object',
      additionalProperties: false,
      properties: {
        codes: { type: 'array', items: { type: 'string' } },
        repositories: { type: 'array', items: { type: 'string' } },
        dependencies: {
          type: 'array',
          items: { type: 'array', minItems: 2, maxItems: 2, items: { type: 'string' } },
        },
      },
    },
  },
  required: ['namespace'],
};

/** @type {import('ajv').ValidateFunction} */
export const validateNamespace = ajv.compile(namespaceSchema);
/** @type {import('ajv').ValidateFunction} */
export const validateClosure = ajv.compile(closureSchema);
