export enum ValidationLayer {
  L_A_INTENT = 'L-A-Intent-Validation',
  L_B_SECURITY = 'L-B-Security-Validation',
  L_C_COMPLIANCE = 'L-C-Compliance-Validation',
  L_D_RESOURCE = 'L-D-Resource-Validation',
  L_E_BEHAVIORAL = 'L-E-Behavioral-Validation',
  L_F_QUALITY = 'L-F-Quality-Validation',
}

export enum ValidationStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  WARNING = 'warning',
  TIMEOUT = 'timeout',
  ERROR = 'error',
}

export enum ValidationSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

export interface ValidationResult {
  layerId: string;
  gateId: string;
  gateName: string;
  status: ValidationStatus;
  severity: ValidationSeverity;
  message: string;
  durationMs: number;
}

export interface LayerValidationResult {
  layerId: string;
  layerName: string;
  status: ValidationStatus;
  gateResults: ValidationResult[];
  totalDurationMs: number;
}

export interface ExecutionContext {
  executionId: string;
  contract: any;
  userContext: Record<string, any>;
  systemContext: Record<string, any>;
  validationResults?: ValidationResult[];
  status?: string;
  error?: string;
}
