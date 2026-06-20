import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml'; // assuming 'yaml' package is available because it was used in our code before

const modulesDir = path.join(process.cwd(), 'modules');
if (fs.existsSync(modulesDir)) {
  const dirs = fs.readdirSync(modulesDir);
  for (const dir of dirs) {
    const stat = fs.statSync(path.join(modulesDir, dir));
    if (stat.isDirectory()) {
      const manifestPath = path.join(modulesDir, dir, 'module-manifest.yaml');
      if (fs.existsSync(manifestPath)) {
        try {
          const content = fs.readFileSync(manifestPath, 'utf8');
          const parsed = yaml.parse(content);
          if (parsed && parsed.spec) {
            // Update to include supportedModes and requiredProviders
            if (!parsed.spec.supportedModes) {
                parsed.spec.supportedModes = ['native', 'hybrid', 'connected'];
            }
            if (!parsed.spec.requiredProviders) {
                // Heuristic based on domain or just generic array for now
                const providers = ['auth', 'database'];
                if (dir.includes('deploy') || dir.includes('validation')) providers.push('deploy');
                parsed.spec.requiredProviders = providers;
            }
            if (!parsed.spec.tier) {
                parsed.spec.tier = 2; // Default to services tier
            }

            fs.writeFileSync(manifestPath, yaml.stringify(parsed), 'utf8');
            console.log(`Updated module manifest for ${dir}`);
          }
        } catch (e) {
             console.error(`Error processing ${dir}:`, e);
        }
      }
    }
  }
}
