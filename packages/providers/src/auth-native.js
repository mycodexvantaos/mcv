'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.NativeAuthProvider = void 0;
const crypto = __importStar(require('crypto'));
class NativeAuthProvider {
  manifest = { capability: 'auth', provider: 'native-jwt', mode: 'native' };
  secret = 'local-native-secret';
  async initialize() {
    console.log('[Provider: auth-native] Initialized native local crypto authentication.');
  }
  async healthCheck() {
    return { status: 'healthy' };
  }
  async shutdown() {}
  // Standard capability methods expected
  async generateToken(payload) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(`${header}.${body}`)
      .digest('base64url');
    return `${header}.${body}.${signature}`;
  }
  async verifyToken(token) {
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
exports.NativeAuthProvider = NativeAuthProvider;
