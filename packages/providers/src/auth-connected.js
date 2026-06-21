'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ConnectedAuthProvider = void 0;
class ConnectedAuthProvider {
  manifest = { capability: 'auth', provider: 'oauth-keycloak', mode: 'connected' };
  isOnline = false; // Simulate offline/unreachable identity provider
  async initialize() {}
  async healthCheck() {
    return this.isOnline ? { status: 'healthy' } : { status: 'down', reason: 'IDP unreachable' };
  }
  async shutdown() {}
  async verifyToken(token) {
    if (!this.isOnline) throw new Error('IDP Down');
    return true;
  }
}
exports.ConnectedAuthProvider = ConnectedAuthProvider;
