import { NativeDeployProvider } from './deploy-native';
import { ExternalDeployProvider } from './deploy-argocd';
import { DeployCapability } from './deploy.interface';

export function getDeployProvider(): DeployCapability {
  const mode = process.env.MYCODEXVANTAOS_CORE_RUNTIME_MODE || 'auto';

  // Read credentials for connected mode
  const argoToken = process.env.ARGOCD_AUTH_TOKEN;
  const external = argoToken ? new ExternalDeployProvider('/path/to/kubeconfig', argoToken) : null;
  const native = new NativeDeployProvider();

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
