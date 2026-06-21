'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getDeployProvider = getDeployProvider;
const deploy_native_1 = require('./deploy-native');
const deploy_argocd_1 = require('./deploy-argocd');
function getDeployProvider() {
  const mode = process.env.MYCODEXVANTAOS_CORE_RUNTIME_MODE || 'auto';
  // Read credentials for connected mode
  const argoToken = process.env.ARGOCD_AUTH_TOKEN;
  const external = argoToken
    ? new deploy_argocd_1.ExternalDeployProvider('/path/to/kubeconfig', argoToken)
    : null;
  const native = new deploy_native_1.NativeDeployProvider();
  switch (mode) {
    case 'native':
      return native; // Strictly offline, internal publish
    case 'connected':
      if (!external) throw new Error('Connected mode requires ARGOCD_AUTH_TOKEN');
      return external;
    case 'hybrid':
    case 'auto':
      return external ? external : native; // Fallback gracefully
    default:
      return native;
  }
}
