/**
 * MyCodexVantaOS 深度覆蓋率分析器
 * 分析代碼覆蓋率、架構覆蓋率、規範覆蓋率
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

interface CoverageMetrics {
  type: string;
  total: number;
  covered: number;
  percentage: number;
  details: CoverageDetail[];
}

interface CoverageDetail {
  name: string;
  path: string;
  covered: boolean;
  coveragePercent?: number;
  issues?: string[];
}

interface CoverageReport {
  timestamp: string;
  overallCoverage: number;
  metrics: CoverageMetrics[];
  recommendations: string[];
  criticalGaps: string[];
  testCoverage: {
    unitTests: number;
    integrationTests: number;
    specTests: number;
    total: number;
  };
}

class CoverageAnalyzer {
  private projectRoot: string;
  private governanceSpec: any;
  private metrics: CoverageMetrics[] = [];

  constructor(projectRoot: string = __dirname + '/..') {
    this.projectRoot = projectRoot;
  }

  /**
   * 執行全面覆蓋率分析
   */
  async analyze(): Promise<CoverageReport> {
    console.log('📊 開始深度覆蓋率分析...\n');

    // 載入治理規範
    await this.loadGovernanceSpec();

    // 執行各類覆蓋率分析
    await this.analyzePackageCoverage();
    await this.analyzeServiceCoverage();
    await this.analyzeCapabilityCoverage();
    await this.analyzeProviderCoverage();
    await this.analyzeLayerCoverage();
    await this.analyzeTestCoverage();
    await this.analyzeSpecCoverage();
    await this.analyzeDocumentationCoverage();
    await this.analyzeConfigCoverage();
    await this.analyzeInterfaceCoverage();

    return this.generateReport();
  }

  private async loadGovernanceSpec(): Promise<void> {
    const specPath = path.join(this.projectRoot, 'governance', 'platform-governance-spec.yaml');
    if (fs.existsSync(specPath)) {
      const content = fs.readFileSync(specPath, 'utf-8');
      this.governanceSpec = yaml.parse(content);
    }
  }

  // ========================================
  // 1. 套件覆蓋率分析
  // ========================================
  private async analyzePackageCoverage(): Promise<void> {
    console.log('📦 分析套件覆蓋率...');

    const packagesPath = path.join(this.projectRoot, 'packages');
    const details: CoverageDetail[] = [];

    if (!fs.existsSync(packagesPath)) {
      this.metrics.push({
        type: 'packages',
        total: 0,
        covered: 0,
        percentage: 0,
        details,
      });
      return;
    }

    const expectedPackages = [
      'ai-agent',
      'ai-embedding',
      'ai-llm',
      'ai-memory',
      'builder',
      'runtime',
      'deployment',
      'config-sync',
      'core-auth',
      'core-config',
      'core-gateway',
      'core-kernel',
      'database',
      'data-graph',
      'data-pipeline',
      'data-vector-store',
      'events',
      'monitoring',
      'platform-notification',
      'platform-observability',
      'platform-scheduler',
      'security-secrets',
      'security-validation',
      'service-discovery',
      'storage',
      'providers',
      'governance-policy',
    ];

    const existingDirs = fs
      .readdirSync(packagesPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    let covered = 0;

    for (const expected of expectedPackages) {
      const exists = existingDirs.some((dir) => dir.includes(expected));
      const packagePath = path.join(packagesPath, expected);

      let issues: string[] = [];
      let coveragePercent = 0;

      if (exists) {
        // 檢查套件完整性
        const pkgJsonPath = path.join(packagePath, 'package.json');
        const indexPath = path.join(packagePath, 'src', 'index.ts');
        const testPath = path.join(packagePath, '__tests__');
        const readmePath = path.join(packagePath, 'README.md');

        if (fs.existsSync(pkgJsonPath)) coveragePercent += 25;
        else issues.push('缺少 package.json');

        if (fs.existsSync(indexPath)) coveragePercent += 25;
        else issues.push('缺少 src/index.ts');

        if (fs.existsSync(testPath)) coveragePercent += 25;
        else issues.push('缺少測試目錄');

        if (fs.existsSync(readmePath)) coveragePercent += 25;
        else issues.push('缺少 README.md');

        if (coveragePercent >= 75) covered++;
      } else {
        issues.push('套件目錄不存在');
      }

      details.push({
        name: expected,
        path: `packages/${expected}`,
        covered: exists && issues.length === 0,
        coveragePercent: exists ? coveragePercent : 0,
        issues: issues.length > 0 ? issues : undefined,
      });
    }

    const total = expectedPackages.length;
    this.metrics.push({
      type: 'packages',
      total,
      covered,
      percentage: Math.round((covered / total) * 100),
      details,
    });

    console.log(`  📦 套件覆蓋率: ${covered}/${total} (${Math.round((covered / total) * 100)}%)`);
  }

  // ========================================
  // 2. 服務覆蓋率分析
  // ========================================
  private async analyzeServiceCoverage(): Promise<void> {
    console.log('🔧 分析服務覆蓋率...');

    const servicesPath = path.join(this.projectRoot, 'services');
    const details: CoverageDetail[] = [];

    const expectedServices = [
      'mycodexvantaos-ai-embedding',
      'mycodexvantaos-ai-llm',
      'mycodexvantaos-ai-agent',
      'mycodexvantaos-ai-memory',
      'mycodexvantaos-core-auth',
      'mycodexvantaos-core-config',
      'mycodexvantaos-core-gateway',
      'mycodexvantaos-core-kernel',
      'mycodexvantaos-data-graph',
      'mycodexvantaos-data-pipeline',
      'mycodexvantaos-data-vector-store',
      'mycodexvantaos-database',
      'mycodexvantaos-events',
      'mycodexvantaos-governance',
      'mycodexvantaos-monitoring',
      'mycodexvantaos-notification',
      'mycodexvantaos-observability',
      'mycodexvantaos-scheduler',
      'mycodexvantaos-security-secrets',
      'mycodexvantaos-security-validation',
      'mycodexvantaos-storage',
      'mycodexvantaos-builder',
      'mycodexvantaos-runtime',
      'mycodexvantaos-deployment',
      'mycodexvantaos-discovery',
    ];

    const existingServices = fs.existsSync(servicesPath)
      ? fs
          .readdirSync(servicesPath, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => dirent.name)
      : [];

    let covered = 0;

    for (const expected of expectedServices) {
      const exists = existingServices.includes(expected);
      const servicePath = path.join(servicesPath, expected);

      let issues: string[] = [];
      let coveragePercent = 0;

      if (exists) {
        // 檢查服務完整性
        const manifestPath = path.join(servicePath, 'service-manifest.yaml');
        const dockerfilePath = path.join(servicePath, 'Dockerfile');
        const configPath = path.join(servicePath, 'config');

        if (fs.existsSync(manifestPath)) coveragePercent += 40;
        else issues.push('缺少 service-manifest.yaml');

        if (fs.existsSync(dockerfilePath)) coveragePercent += 30;
        else issues.push('缺少 Dockerfile');

        if (fs.existsSync(configPath)) coveragePercent += 30;
        else issues.push('缺少 config 目錄');

        if (coveragePercent >= 70) covered++;
      } else {
        issues.push('服務目錄不存在');
      }

      details.push({
        name: expected,
        path: `services/${expected}`,
        covered: exists && issues.length === 0,
        coveragePercent: exists ? coveragePercent : 0,
        issues: issues.length > 0 ? issues : undefined,
      });
    }

    const total = expectedServices.length;
    this.metrics.push({
      type: 'services',
      total,
      covered,
      percentage: Math.round((covered / total) * 100),
      details,
    });

    console.log(`  🔧 服務覆蓋率: ${covered}/${total} (${Math.round((covered / total) * 100)}%)`);
  }

  // ========================================
  // 3. 能力覆蓋率分析
  // ========================================
  private async analyzeCapabilityCoverage(): Promise<void> {
    console.log('⚡ 分析能力覆蓋率...');

    const capabilitiesPath = path.join(this.projectRoot, 'governance', 'capability-set.yaml');
    const details: CoverageDetail[] = [];

    const requiredCapabilities = [
      'database',
      'storage',
      'auth',
      'queue',
      'state-store',
      'secrets',
      'repo',
      'deploy',
      'validation',
      'security',
      'observability',
      'notification',
      'scheduler',
      'vector-store',
      'embedding',
      'llm',
      'graph',
      'cache',
      'search',
    ];

    let definedCapabilities: string[] = [];

    if (fs.existsSync(capabilitiesPath)) {
      try {
        const content = fs.readFileSync(capabilitiesPath, 'utf-8');
        const capabilitySet = yaml.parse(content);
        definedCapabilities = Object.keys(capabilitySet.capabilities || {});
      } catch (error) {
        console.error('解析能力集合失敗:', error);
      }
    }

    let covered = 0;

    for (const capability of requiredCapabilities) {
      const isDefined = definedCapabilities.some((c) =>
        c.toLowerCase().includes(capability.toLowerCase())
      );

      // 檢查是否有對應的實作
      const hasImplementation = this.checkCapabilityImplementation(capability);

      const issues: string[] = [];
      if (!isDefined) issues.push('未在 capability-set.yaml 定義');
      if (!hasImplementation) issues.push('缺少實作');

      if (isDefined && hasImplementation) covered++;

      details.push({
        name: capability,
        path: `capabilities/${capability}`,
        covered: isDefined && hasImplementation,
        coveragePercent: (isDefined ? 50 : 0) + (hasImplementation ? 50 : 0),
        issues: issues.length > 0 ? issues : undefined,
      });
    }

    const total = requiredCapabilities.length;
    this.metrics.push({
      type: 'capabilities',
      total,
      covered,
      percentage: Math.round((covered / total) * 100),
      details,
    });

    console.log(`  ⚡ 能力覆蓋率: ${covered}/${total} (${Math.round((covered / total) * 100)}%)`);
  }

  private checkCapabilityImplementation(capability: string): boolean {
    const searchPaths = [
      path.join(this.projectRoot, 'packages'),
      path.join(this.projectRoot, 'services'),
    ];

    for (const searchPath of searchPaths) {
      if (!fs.existsSync(searchPath)) continue;

      const dirs = fs
        .readdirSync(searchPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      if (dirs.some((dir) => dir.toLowerCase().includes(capability.toLowerCase()))) {
        return true;
      }
    }

    return false;
  }

  // ========================================
  // 4. Provider 覆蓋率分析
  // ========================================
  private async analyzeProviderCoverage(): Promise<void> {
    console.log('🔌 分析 Provider 覆蓋率...');

    const providersPath = path.join(this.projectRoot, 'providers');
    const registryPath = path.join(this.projectRoot, 'governance', 'provider-registry.yaml');
    const details: CoverageDetail[] = [];

    const expectedProviders = [
      { capability: 'database', providers: ['postgres', 'sqlite', 'mongodb'] },
      { capability: 'storage', providers: ['s3', 'local', 'minio'] },
      { capability: 'auth', providers: ['oauth', 'jwt', 'session'] },
      { capability: 'queue', providers: ['redis', 'rabbitmq', 'sqs'] },
      { capability: 'vector-store', providers: ['pgvector', 'pinecone', 'weaviate'] },
      { capability: 'llm', providers: ['openai', 'anthropic', 'local'] },
      { capability: 'embedding', providers: ['openai', 'huggingface', 'local'] },
    ];

    let totalProviders = 0;
    let coveredProviders = 0;

    for (const { capability, providers } of expectedProviders) {
      for (const provider of providers) {
        totalProviders++;
        const providerPath = path.join(providersPath, capability, `${capability}-${provider}`);
        const exists = fs.existsSync(providerPath);

        const issues: string[] = [];
        if (!exists) issues.push('Provider 目錄不存在');

        if (exists) {
          const manifestPath = path.join(providerPath, 'provider-manifest.yaml');
          if (!fs.existsSync(manifestPath)) {
            issues.push('缺少 provider-manifest.yaml');
          } else {
            coveredProviders++;
          }
        }

        details.push({
          name: `${capability}-${provider}`,
          path: `providers/${capability}/${capability}-${provider}`,
          covered: exists && issues.length === 0,
          issues: issues.length > 0 ? issues : undefined,
        });
      }
    }

    this.metrics.push({
      type: 'providers',
      total: totalProviders,
      covered: coveredProviders,
      percentage: Math.round((coveredProviders / totalProviders) * 100),
      details,
    });

    console.log(
      `  🔌 Provider 覆蓋率: ${coveredProviders}/${totalProviders} (${Math.round((coveredProviders / totalProviders) * 100)}%)`
    );
  }

  // ========================================
  // 5. 層級覆蓋率分析
  // ========================================
  private async analyzeLayerCoverage(): Promise<void> {
    console.log('🏛️ 分析層級覆蓋率...');

    const details: CoverageDetail[] = [];

    const layers = [
      {
        name: 'Layer A: Builder',
        components: ['ui-generator', 'api-generator', 'schema-generator', 'code-generator'],
        path: 'packages/builder',
      },
      {
        name: 'Layer B: Runtime',
        components: ['app-runtime', 'api-runtime', 'job-scheduler', 'execution-engine'],
        path: 'packages/runtime',
      },
      {
        name: 'Layer C: Native Services',
        components: [
          'native-db',
          'native-storage',
          'native-auth',
          'native-queue',
          'native-secrets',
        ],
        path: 'packages',
      },
      {
        name: 'Layer D: Connector',
        components: [
          'github-connector',
          'redis-connector',
          'supabase-connector',
          'oauth-connector',
          's3-connector',
        ],
        path: 'packages',
      },
      {
        name: 'Layer E: Deployment',
        components: ['docker', 'kubernetes', 'serverless', 'static'],
        path: 'packages/deployment',
      },
      {
        name: 'Layer F: Governance',
        components: ['policy-engine', 'audit-logger', 'validation-rules', 'enforcement-engine'],
        path: 'governance',
      },
    ];

    let totalComponents = 0;
    let coveredComponents = 0;

    for (const layer of layers) {
      for (const component of layer.components) {
        totalComponents++;

        const searchPath = path.join(this.projectRoot, layer.path);
        let found = false;

        if (fs.existsSync(searchPath)) {
          const items = fs.readdirSync(searchPath, { withFileTypes: true });
          found = items.some((item) =>
            item.name.toLowerCase().includes(component.toLowerCase().replace('-', ''))
          );
        }

        if (found) coveredComponents++;

        details.push({
          name: `${layer.name}/${component}`,
          path: `${layer.path}/${component}`,
          covered: found,
          issues: found ? undefined : ['元件未實作'],
        });
      }
    }

    this.metrics.push({
      type: 'layers',
      total: totalComponents,
      covered: coveredComponents,
      percentage: Math.round((coveredComponents / totalComponents) * 100),
      details,
    });

    console.log(
      `  🏛️ 層級覆蓋率: ${coveredComponents}/${totalComponents} (${Math.round((coveredComponents / totalComponents) * 100)}%)`
    );
  }

  // ========================================
  // 6. 測試覆蓋率分析
  // ========================================
  private async analyzeTestCoverage(): Promise<void> {
    console.log('🧪 分析測試覆蓋率...');

    const details: CoverageDetail[] = [];

    // 計算測試檔案數量
    const testFiles = await this.countFiles(['**/*.test.ts', '**/*.spec.ts']);
    const totalFiles = await this.countFiles(['**/*.ts', '**/*.tsx']);

    // 排除 node_modules
    const sourceFiles = totalFiles - (await this.countFiles(['**/node_modules/**']));

    // 檢查各套件的測試覆蓋
    const packagesPath = path.join(this.projectRoot, 'packages');
    if (fs.existsSync(packagesPath)) {
      const packageDirs = fs
        .readdirSync(packagesPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      for (const pkg of packageDirs) {
        const pkgPath = path.join(packagesPath, pkg);
        const srcFiles = this.countFilesInDir(path.join(pkgPath, 'src'), '.ts');
        const testFiles = this.countFilesInDir(path.join(pkgPath, '__tests__'), '.ts');

        const coverage = srcFiles > 0 ? Math.min(100, Math.round((testFiles / srcFiles) * 100)) : 0;

        details.push({
          name: pkg,
          path: `packages/${pkg}`,
          covered: coverage >= 50,
          coveragePercent: coverage,
          issues: coverage < 50 ? [`測試覆蓋率低: ${coverage}%`] : undefined,
        });
      }
    }

    const testCoverageRatio = sourceFiles > 0 ? Math.round((testFiles / sourceFiles) * 100) : 0;

    this.metrics.push({
      type: 'tests',
      total: sourceFiles,
      covered: testFiles,
      percentage: testCoverageRatio,
      details,
    });

    console.log(`  🧪 測試覆蓋率: ${testFiles}/${sourceFiles} 檔案 (${testCoverageRatio}%)`);
  }

  // ========================================
  // 7. 規範覆蓋率分析
  // ========================================
  private async analyzeSpecCoverage(): Promise<void> {
    console.log('📜 分析規範覆蓋率...');

    const details: CoverageDetail[] = [];

    const specFiles = [
      { name: 'platform-governance-spec.yaml', path: 'governance/platform-governance-spec.yaml' },
      { name: 'capability-set.yaml', path: 'governance/capability-set.yaml' },
      { name: 'provider-registry.yaml', path: 'governance/provider-registry.yaml' },
      { name: 'namespace-policy.yaml', path: 'governance/namespace-policy.yaml' },
      { name: 'lifecycle-policy.yaml', path: 'governance/lifecycle-policy.yaml' },
      { name: 'exceptions.yaml', path: 'governance/exceptions.yaml' },
    ];

    let covered = 0;

    for (const spec of specFiles) {
      const fullPath = path.join(this.projectRoot, spec.path);
      const exists = fs.existsSync(fullPath);

      if (exists) {
        // 檢查檔案是否有效
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const parsed = yaml.parse(content);
          if (parsed && Object.keys(parsed).length > 0) {
            covered++;
          } else {
            details.push({
              name: spec.name,
              path: spec.path,
              covered: false,
              issues: ['檔案為空或無效'],
            });
            continue;
          }
        } catch {
          details.push({
            name: spec.name,
            path: spec.path,
            covered: false,
            issues: ['解析失敗'],
          });
          continue;
        }
      }

      details.push({
        name: spec.name,
        path: spec.path,
        covered: exists,
        issues: exists ? undefined : ['檔案不存在'],
      });
    }

    const total = specFiles.length;
    this.metrics.push({
      type: 'specs',
      total,
      covered,
      percentage: Math.round((covered / total) * 100),
      details,
    });

    console.log(`  📜 規範覆蓋率: ${covered}/${total} (${Math.round((covered / total) * 100)}%)`);
  }

  // ========================================
  // 8. 文檔覆蓋率分析
  // ========================================
  private async analyzeDocumentationCoverage(): Promise<void> {
    console.log('📚 分析文檔覆蓋率...');

    const details: CoverageDetail[] = [];

    const docsPath = path.join(this.projectRoot, 'docs');
    const expectedDocs = [
      'README.md',
      'ARCHITECTURE.md',
      'CONTRIBUTING.md',
      'API.md',
      'DEPLOYMENT.md',
      'SECURITY.md',
      'CHANGELOG.md',
      'onboarding/',
      'architecture-decision-records/',
      'analysis/',
    ];

    let covered = 0;

    for (const doc of expectedDocs) {
      const docPath = path.join(docsPath, doc);
      const exists = fs.existsSync(docPath) || fs.existsSync(path.join(this.projectRoot, doc));

      if (exists) covered++;

      details.push({
        name: doc,
        path: `docs/${doc}`,
        covered: exists,
        issues: exists ? undefined : ['文檔不存在'],
      });
    }

    const total = expectedDocs.length;
    this.metrics.push({
      type: 'documentation',
      total,
      covered,
      percentage: Math.round((covered / total) * 100),
      details,
    });

    console.log(`  📚 文檔覆蓋率: ${covered}/${total} (${Math.round((covered / total) * 100)}%)`);
  }

  // ========================================
  // 9. 配置覆蓋率分析
  // ========================================
  private async analyzeConfigCoverage(): Promise<void> {
    console.log('⚙️ 分析配置覆蓋率...');

    const details: CoverageDetail[] = [];

    const expectedConfigs = [
      '.env.native.example',
      '.env.connected.example',
      '.env.hybrid.example',
      '.env.docker.example',
      '.env.prod.example',
      'tsconfig.json',
      'jest.config.js',
      'eslint.config.js',
      'prettier.config.js',
      '.github/workflows/ci.yml',
      '.github/workflows/deploy.yml',
    ];

    let covered = 0;

    for (const config of expectedConfigs) {
      const configPath = path.join(this.projectRoot, config);
      const exists = fs.existsSync(configPath);

      if (exists) covered++;

      details.push({
        name: config,
        path: config,
        covered: exists,
        issues: exists ? undefined : ['配置檔案不存在'],
      });
    }

    const total = expectedConfigs.length;
    this.metrics.push({
      type: 'config',
      total,
      covered,
      percentage: Math.round((covered / total) * 100),
      details,
    });

    console.log(`  ⚙️ 配置覆蓋率: ${covered}/${total} (${Math.round((covered / total) * 100)}%)`);
  }

  // ========================================
  // 10. 介面覆蓋率分析
  // ========================================
  private async analyzeInterfaceCoverage(): Promise<void> {
    console.log('🔌 分析介面覆蓋率...');

    const details: CoverageDetail[] = [];

    const schemasPath = path.join(this.projectRoot, 'schemas');
    const expectedSchemas = [
      'service-manifest.schema.json',
      'module-manifest.schema.json',
      'provider-manifest.schema.json',
      'capability.schema.json',
      'policy.schema.json',
      'event.schema.json',
    ];

    let covered = 0;

    if (fs.existsSync(schemasPath)) {
      const schemaFiles = fs
        .readdirSync(schemasPath)
        .filter((file) => file.endsWith('.schema.json'));

      for (const schema of expectedSchemas) {
        const exists = schemaFiles.includes(schema);
        if (exists) covered++;

        details.push({
          name: schema,
          path: `schemas/${schema}`,
          covered: exists,
          issues: exists ? undefined : ['Schema 不存在'],
        });
      }
    } else {
      for (const schema of expectedSchemas) {
        details.push({
          name: schema,
          path: `schemas/${schema}`,
          covered: false,
          issues: ['schemas 目錄不存在'],
        });
      }
    }

    const total = expectedSchemas.length;
    this.metrics.push({
      type: 'interfaces',
      total,
      covered,
      percentage: Math.round((covered / total) * 100),
      details,
    });

    console.log(`  🔌 介面覆蓋率: ${covered}/${total} (${Math.round((covered / total) * 100)}%)`);
  }

  // ========================================
  // 輔助方法
  // ========================================
  private async countFiles(patterns: string[]): Promise<number> {
    let count = 0;

    const scan = (dir: string) => {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.name === 'node_modules' || item.name.startsWith('.')) continue;

        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          scan(fullPath);
        } else if (item.isFile()) {
          for (const pattern of patterns) {
            if (pattern.includes('*')) {
              const ext = pattern.split('.').pop();
              if (item.name.endsWith(`.${ext}`)) {
                count++;
                break;
              }
            } else if (fullPath.includes(pattern)) {
              count++;
              break;
            }
          }
        }
      }
    };

    scan(this.projectRoot);
    return count;
  }

  private countFilesInDir(dir: string, ext: string): number {
    if (!fs.existsSync(dir)) return 0;

    let count = 0;
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        count += this.countFilesInDir(fullPath, ext);
      } else if (item.name.endsWith(ext)) {
        count++;
      }
    }

    return count;
  }

  private generateReport(): CoverageReport {
    // 計算總體覆蓋率
    const totalItems = this.metrics.reduce((sum, m) => sum + m.total, 0);
    const coveredItems = this.metrics.reduce((sum, m) => sum + m.covered, 0);
    const overallCoverage = Math.round((coveredItems / totalItems) * 100);

    // 生成建議
    const recommendations: string[] = [];
    const criticalGaps: string[] = [];

    for (const metric of this.metrics) {
      if (metric.percentage < 50) {
        criticalGaps.push(`${metric.type}: 覆蓋率僅 ${metric.percentage}%，需要立即改善`);

        const uncoveredDetails = metric.details
          .filter((d) => !d.covered)
          .slice(0, 3)
          .map((d) => d.name);

        recommendations.push(`改善 ${metric.type} 覆蓋率: 優先實作 ${uncoveredDetails.join(', ')}`);
      } else if (metric.percentage < 75) {
        recommendations.push(`提升 ${metric.type} 覆蓋率: 當前 ${metric.percentage}%，目標 75%+`);
      }
    }

    // 計算測試統計
    const testMetric = this.metrics.find((m) => m.type === 'tests');
    const testCoverage = {
      unitTests: testMetric?.covered || 0,
      integrationTests: Math.round((testMetric?.covered || 0) * 0.3),
      specTests: this.metrics.find((m) => m.type === 'specs')?.covered || 0,
      total: testMetric?.total || 0,
    };

    return {
      timestamp: new Date().toISOString(),
      overallCoverage,
      metrics: this.metrics,
      recommendations,
      criticalGaps,
      testCoverage,
    };
  }
}

// 主執行
async function main() {
  const analyzer = new CoverageAnalyzer();
  const report = await analyzer.analyze();

  console.log('\n' + '='.repeat(60));
  console.log('📊 深度覆蓋率分析報告');
  console.log('='.repeat(60));
  console.log(`總體覆蓋率: ${report.overallCoverage}%`);
  console.log('\n各類覆蓋率:');

  for (const metric of report.metrics) {
    const bar =
      '█'.repeat(Math.round(metric.percentage / 10)) +
      '░'.repeat(10 - Math.round(metric.percentage / 10));
    console.log(
      `  ${metric.type.padEnd(15)} [${bar}] ${metric.percentage}% (${metric.covered}/${metric.total})`
    );
  }

  if (report.criticalGaps.length > 0) {
    console.log('\n🚨 關鍵缺口:');
    report.criticalGaps.forEach((gap) => console.log(`  - ${gap}`));
  }

  if (report.recommendations.length > 0) {
    console.log('\n💡 建議:');
    report.recommendations.forEach((rec) => console.log(`  - ${rec}`));
  }

  // 輸出 JSON 報告
  const reportPath = __dirname + '/../docs/analysis/coverage-report.json';
  const fs = require('fs');
  const path = require('path');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 報告已輸出至: ${reportPath}`);
}

main().catch((error) => {
  console.error('分析失敗:', error);
  process.exit(1);
});
