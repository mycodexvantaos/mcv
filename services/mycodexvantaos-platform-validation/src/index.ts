import { ContractEngine } from './engine';

async function main() {
  const engine = new ContractEngine();
  const userContext = {
    userId: 'user123',
    intent: 'deploy application to production',
    preferences: {}
  };
  
  const result = await engine.executeContract('AC-001', userContext);
  console.log('Final Execution Result:', result);
}

if (require.main === module) {
  main().catch(console.error);
}

export * from './engine';
export * from './validator';
export * from './types';
