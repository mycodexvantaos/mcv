/**
 * MyCodeXvantaOS — Platform Error Hierarchy
 * Structured error types for cross-service error propagation.
 */

export class PlatformError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "PlatformError";
  }
}

export class NotFoundError extends PlatformError {
  constructor(resourceKind: string, resourceId: string) {
    super("NOT_FOUND", `${resourceKind} '${resourceId}' not found`, 404, {
      resourceKind,
      resourceId,
    });
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends PlatformError {
  constructor(action: string, resourceKind: string) {
    super("UNAUTHORIZED", `Not authorized to '${action}' on '${resourceKind}'`, 401, {
      action,
      resourceKind,
    });
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends PlatformError {
  constructor(action: string, resourceKind: string, reason?: string) {
    super(
      "FORBIDDEN",
      `Forbidden: '${action}' on '${resourceKind}'${reason ? ` — ${reason}` : ""}`,
      403,
      { action, resourceKind, reason }
    );
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends PlatformError {
  constructor(field: string, reason: string) {
    super("VALIDATION_ERROR", `Validation failed for '${field}': ${reason}`, 400, {
      field,
      reason,
    });
    this.name = "ValidationError";
  }
}

export class QuotaExceededError extends PlatformError {
  constructor(metric: string, limit: number, current: number) {
    super("QUOTA_EXCEEDED", `Quota exceeded for '${metric}': ${current}/${limit}`, 429, {
      metric,
      limit,
      current,
    });
    this.name = "QuotaExceededError";
  }
}

export class ConflictError extends PlatformError {
  constructor(resourceKind: string, resourceId: string) {
    super("CONFLICT", `${resourceKind} '${resourceId}' already exists`, 409, {
      resourceKind,
      resourceId,
    });
    this.name = "ConflictError";
  }
}
