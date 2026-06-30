import * as fs from "fs";
import * as path from "path";

// Fix moving module-manifests to modules/ directory
const servicesDir = path.join(process.cwd(), "services");
const modulesDir = path.join(process.cwd(), "modules");

if (fs.existsSync(servicesDir)) {
  const dirs = fs.readdirSync(servicesDir);
  for (const dir of dirs) {
    const srcManifest = path.join(servicesDir, dir, "module-manifest.yaml");
    if (fs.existsSync(srcManifest)) {
      const destDir = path.join(modulesDir, dir);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(srcManifest, path.join(destDir, "module-manifest.yaml"));
      fs.unlinkSync(srcManifest);
      console.log(`Moved module-manifest.yaml for ${dir} to modules/`);
    }
  }
}
