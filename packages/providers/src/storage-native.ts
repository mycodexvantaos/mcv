import { StorageCapability } from './storage.interface';
import * as fs from 'fs';
import * as path from 'path';

export class NativeStorageProvider implements StorageCapability {
  capability = 'storage' as const;
  source = 'native' as const;
  private storageDir: string;

  constructor() {
    this.storageDir = path.join(process.cwd(), '.native-storage');
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  async healthCheck(): Promise<boolean> {
    return fs.existsSync(this.storageDir);
  }

  async write(key: string, data: Buffer): Promise<void> {
    await fs.promises.writeFile(path.join(this.storageDir, key), data);
  }

  async read(key: string): Promise<Buffer | null> {
    try {
      return await fs.promises.readFile(path.join(this.storageDir, key));
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.promises.unlink(path.join(this.storageDir, key));
    } catch {}
  }
}
