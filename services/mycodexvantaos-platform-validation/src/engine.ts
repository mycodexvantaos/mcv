import { MultiLayerValidator } from './validator';
import { ExecutionContext } from './types';
import { randomUUID } from 'crypto';

export class ContractEngine {
  private validator: MultiLayerValidator;

  constructor() {
    this.validator = new MultiLayerValidator();
    console.log('[IBCS Core] ContractEngine initialized');
  }

  public async executeContract(
    contractId: string,
    userContext: any,
    systemContext?: any
  ): Promise<ExecutionContext> {
    const executionId = randomUUID();
    const context: ExecutionContext = {
      executionId,
      contract: { id: contractId, name: `Contract-${contractId}` },
      userContext,
      systemContext: systemContext || {},
      status: 'pending',
    };

    console.log(`[IBCS Core] Starting contract execution ID: ${executionId}`);

    try {
      context.status = 'validating';
      const { success, results } = await this.validator.validate(context);
      context.validationResults = [];
      results.forEach((r) => context.validationResults!.push(...r.gateResults));

      if (!success) {
        context.status = 'failed';
        context.error = 'Validation failed';
        return context;
      }

      context.status = 'executing';
      await this._executeContractActions(context);

      context.status = 'completed';
    } catch (e: any) {
      context.status = 'error';
      context.error = e.message;
    }

    console.log(`[IBCS Core] Contract execution finished. Status: ${context.status}`);
    return context;
  }

  private async _executeContractActions(context: ExecutionContext): Promise<void> {
    console.log(`[IBCS Core] Executing actions for contract ${context.contract.id}...`);
    // Simulate async execution
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
