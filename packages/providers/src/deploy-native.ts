import { DeployCapability } from './deploy.interface';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export class NativeDeployProvider implements DeployCapability {
  capability = 'deploy' as const;
  source = 'native' as const;

  async healthCheck() {
    try {
      await execAsync('docker-compose --version');
      return true;
    } catch {
      return false; // Requires docker-compose installed locally
    }
  }

  async deploy(artifact: any): Promise<any> {
    console.log('[Native Deploy] 🚀 Executing Internal Publish via docker-compose (Zero-external dependencies)...');
    
    // Create a generic docker-compose.yml if we are given artifact details
    const composeContent = `
version: '3.8'
services:
  ${artifact.name || 'locally-hosted-service'}:
    image: ${artifact.image || 'node:18-alpine'}
    command: ${artifact.command || '"node" "-e" "console.log(\'Starting...\'); setTimeout(() => {}, 100000)"'}
    ports:
      - "${artifact.port || 3000}:3000"
`;
    const deployDir = path.join(process.cwd(), '.deploy');
    if (!fs.existsSync(deployDir)) {
      fs.mkdirSync(deployDir, { recursive: true });
    }
    fs.writeFileSync(path.join(deployDir, 'docker-compose.yml'), composeContent.trim());

    try {
      await execAsync('docker-compose up -d', { cwd: deployDir });
      console.log(`[Native Deploy] Successfully launched artifact locally: ${artifact.name || 'service'}`);
      return { 
        status: 'success', 
        provider: 'native',
        url: `http://localhost:${artifact.port || 3000}`,
        versionId: `v-${Date.now()}`,
        message: 'Self-hosted via Native Deploy Provider'
      };
    } catch (err: any) {
      console.error(`[Native Deploy] Deployment failed: ${err.message}`);
      return { status: 'failed', provider: 'native', message: err.message };
    }
  }

  async rollback(versionId: string): Promise<boolean> {
    console.log(`[Native Deploy] ⏪ Rolling back locally to version: ${versionId}`);
    try {
      const deployDir = path.join(process.cwd(), '.deploy');
      await execAsync('docker-compose down', { cwd: deployDir });
      return true;
    } catch (err) {
      return false;
    }
  }
}
