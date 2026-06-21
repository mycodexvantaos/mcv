export class ValidationFramework {
  private validations: Map<string, any> = new Map();

  registerValidation(id: string, validation: any): void {
    this.validations.set(id, validation);
  }

  validate(id: string, data: any): boolean {
    const validation = this.validations.get(id);
    if (validation) {
      return validation.check?.(data) || true;
    }
    return true;
  }

  validateAll(data: any): Record<string, boolean> {
    const results: Record<string, boolean> = {};
    this.validations.forEach((validation, id) => {
      results[id] = this.validate(id, data);
    });
    return results;
  }
}
