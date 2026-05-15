import { AuthProvider } from '@mycodexvantaos/core-kernel';
import * as crypto from 'crypto';

export class NativeAuthProvider implements AuthProvider {
  manifest = { capability: 'auth', provider: 'native-jwt', mode: 'native' as const };
  private secret = 'local-native-secret';

  async initialize() {
    console.log('[Provider: auth-native] Initialized native local crypto authentication.');
  }

  async healthCheck() {
    return { status: 'healthy' as const };
  }

  async shutdown() {}

  // Standard capability methods expected
  async generateToken(payload: object) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(`${header}.${body}`)
      .digest('base64url');
    return `${header}.${body}.${signature}`;
  }

  async verifyToken(token: string) {
    try {
      const [header, body, signature] = token.split('.');
      if (!header || !body || !signature) return false;
      const expectedSignature = crypto
        .createHmac('sha256', this.secret)
        .update(`${header}.${body}`)
        .digest('base64url');
      return signature === expectedSignature;
    } catch {
      return false;
    }
  }
}
