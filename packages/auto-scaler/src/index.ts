/**
 * MyCodexVantaOS Auto Scaler
 * Provides automatic scaling based on metrics and policies
 */

export interface ScalingPolicy {
  name: string;
  target: string;
  minInstances: number;
  maxInstances: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
}

export class AutoScaler {
  private policies: Map<string, ScalingPolicy> = new Map();
  private currentScale: Map<string, number> = new Map();

  registerPolicy(policy: ScalingPolicy): void {
    this.policies.set(policy.name, policy);
    this.currentScale.set(policy.name, policy.minInstances);
  }

  async evaluate(policyName: string, metrics: number): Promise<void> {
    const policy = this.policies.get(policyName);
    if (!policy) return;

    const currentInstances = this.currentScale.get(policyName) || policy.minInstances;

    if (metrics > policy.scaleUpThreshold && currentInstances < policy.maxInstances) {
      this.currentScale.set(policyName, currentInstances + 1);
      console.log(`Scaling up ${policy.name} to ${currentInstances + 1}`);
    } else if (metrics < policy.scaleDownThreshold && currentInstances > policy.minInstances) {
      this.currentScale.set(policyName, currentInstances - 1);
      console.log(`Scaling down ${policy.name} to ${currentInstances - 1}`);
    }
  }

  getScale(policyName: string): number {
    return this.currentScale.get(policyName) || 1;
  }
}

export default AutoScaler;
