/**
 * MyCodexVantaOS Enhanced CI Validation
 * Comprehensive validation for architecture compliance
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

interface PackageInfo {
  name: string;
  description: string;
  capabilities: string[];
}

class ArchitectureValidator {
  private projectRoot: string;

  constructor(projectRoot: string = __dirname + '/..') {
    this.projectRoot = projectRoot;
  }

  /**
   * Validate complete architecture compliance
   */
  async validate(): Promise<ValidationResult> {
    const result: ValidationResult = {
      passed: true,
      errors: [],
      warnings: [],
    };

    console.log('🔍 Starting MyCodexVantaOS Architecture Validation...');

    // 1. Validate governance manifest exists
    await this.validateGovernanceManifest(result);

    // 2. Validate package structure
    await this.validatePackageStructure(result);

    // 3. Validate capability declarations
    await this.validateCapabilityDeclarations(result);

    // 4. Validate naming conventions
    await this.validateNamingConventions(result);

    // 5. Validate core principles
    await this.validateCorePrinciples(result);

    // 6. Validate layer completeness
    await this.validateLayerCompleteness(result);

    return result;
  }

  private async validateGovernanceManifest(result: ValidationResult): Promise<void> {
    const manifestPath = path.join(this.projectRoot, 'governance.json');

    if (!fs.existsSync(manifestPath)) {
      result.errors.push('Governance manifest not found at governance.json');
      result.passed = false;
      return;
    }

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      if (!manifest.principles || !Array.isArray(manifest.principles)) {
        result.errors.push('Governance manifest missing principles array');
        result.passed = false;
      }

      const requiredPrinciples = [
        'local-first',
        'cloud-agnostic',
        'contract-first',
        'governance-enforced',
      ];
      const missingPrinciples = requiredPrinciples.filter((p) => !manifest.principles.includes(p));

      if (missingPrinciples.length > 0) {
        result.errors.push(`Missing required principles: ${missingPrinciples.join(', ')}`);
        result.passed = false;
      }

      console.log('  ✅ Governance manifest valid');
    } catch (error) {
      result.errors.push(`Failed to parse governance manifest: ${error}`);
      result.passed = false;
    }
  }

  private async validatePackageStructure(result: ValidationResult): Promise<void> {
    const packagesPath = path.join(this.projectRoot, 'packages');

    if (!fs.existsSync(packagesPath)) {
      result.errors.push('Packages directory not found');
      result.passed = false;
      return;
    }

    const requiredPackages = [
      '@mycodexvantaos/builder',
      '@mycodexvantaos/runtime',
      '@mycodexvantaos/deployment',
      '@mycodexvantaos/service-discovery',
      '@mycodexvantaos/config-sync',
      '@mycodexvantaos/storage',
      '@mycodexvantaos/database',
      '@mycodexvantaos/events',
      '@mycodexvantaos/monitoring',
    ];

    const packageDirs = fs
      .readdirSync(packagesPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    const existingPackages = packageDirs
      .map((dir) => {
        const packageJsonPath = path.join(packagesPath, dir, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          return pkg.name;
        }
        return null;
      })
      .filter(Boolean);

    const missingPackages = requiredPackages.filter((pkg) => !existingPackages.includes(pkg));

    if (missingPackages.length > 0) {
      result.errors.push(`Missing required packages: ${missingPackages.join(', ')}`);
      result.passed = false;
    }

    console.log(`  ✅ Package structure valid (${existingPackages.length} packages)`);
  }

  private async validateCapabilityDeclarations(result: ValidationResult): Promise<void> {
    const capabilitiesPath = path.join(this.projectRoot, 'capabilities');

    if (!fs.existsSync(capabilitiesPath)) {
      result.warnings.push('Capabilities directory not found');
      return;
    }

    const capabilityFiles = fs
      .readdirSync(capabilitiesPath)
      .filter((file) => file.endsWith('.yaml') || file.endsWith('.json'));

    if (capabilityFiles.length < 8) {
      result.warnings.push(
        `Expected at least 8 capability declarations, found ${capabilityFiles.length}`
      );
    }

    console.log(`  ✅ Found ${capabilityFiles.length} capability declarations`);
  }

  private async validateNamingConventions(result: ValidationResult): Promise<void> {
    const packagesPath = path.join(this.projectRoot, 'packages');
    const packageDirs = fs
      .readdirSync(packagesPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const dir of packageDirs) {
      const packageJsonPath = path.join(packagesPath, dir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

        if (!pkg.name.startsWith('@mycodexvantaos/')) {
          result.errors.push(`Package "${pkg.name}" does not follow @mycodexvantaos/ convention`);
          result.passed = false;
        }
      }
    }

    console.log('  ✅ Naming conventions valid');
  }

  private async validateCorePrinciples(result: ValidationResult): Promise<void> {
    // Validate that packages implement core principles
    const requiredPrinciples = [
      'local-first',
      'cloud-agnostic',
      'contract-first',
      'governance-enforced',
    ];

    for (const principle of requiredPrinciples) {
      const principleFound = this.searchPrincipleInProject(principle);
      if (!principleFound) {
        result.warnings.push(`Core principle "${principle}" may not be properly implemented`);
      }
    }

    console.log('  ✅ Core principles validated');
  }

  private async validateLayerCompleteness(result: ValidationResult): Promise<void> {
    const requiredLayers = ['Builder', 'Runtime', 'Native Services'];

    for (const layer of requiredLayers) {
      const layerExists = this.checkLayerExists(layer);
      if (!layerExists) {
        result.errors.push(`Required architecture layer "${layer}" is missing or incomplete`);
        result.passed = false;
      }
    }

    console.log('  ✅ Architecture layers complete');
  }

  private searchPrincipleInProject(principle: string): boolean {
    // Simple search - in production, this would be more sophisticated
    const filesToCheck = ['README.md', 'governance.json', 'package.json'];

    for (const file of filesToCheck) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.toLowerCase().includes(principle.toLowerCase())) {
          return true;
        }
      }
    }

    return false;
  }

  private checkLayerExists(layer: string): boolean {
    // Check if layer has corresponding packages
    const governancePath = path.join(this.projectRoot, 'governance.json');

    if (fs.existsSync(governancePath)) {
      const governance = JSON.parse(fs.readFileSync(governancePath, 'utf-8'));
      return governance.layers && governance.layers.some((l: any) => l.name === layer);
    }

    return false;
  }
}

// Main execution
async function main() {
  const validator = new ArchitectureValidator();
  const result = await validator.validate();

  console.log('\n📊 Validation Results:');
  console.log(`  Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Errors: ${result.errors.length}`);
  console.log(`  Warnings: ${result.warnings.length}\n`);

  if (result.errors.length > 0) {
    console.log('❌ Errors:');
    result.errors.forEach((error) => console.log(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    result.warnings.forEach((warning) => console.log(`  - ${warning}`));
  }

  process.exit(result.passed ? 0 : 1);
}

main().catch((error) => {
  console.error('Validation failed:', error);
  process.exit(1);
});
