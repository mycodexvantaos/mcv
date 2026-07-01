/**
 * MyCodeXvantaOS 規範測試執行器
 * 全面驗證平台治理規範合規性
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

interface SpecTestResult {
  category: string;
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

interface SpecTestReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  coverage: number;
  results: SpecTestResult[];
  summary: {
    byCategory: Record<string, { passed: number; failed: number; total: number }>;
    criticalFailures: string[];
    warnings: string[];
  };
}

class SpecTestRunner {
  private projectRoot: string;
  private governanceSpec: any;
  private results: SpecTestResult[] = [];

  constructor(projectRoot: string = __dirname + '/..') {
    this.projectRoot = projectRoot;
  }

  /**
   * 執行所有規範測試
   */
  async runAllTests(): Promise<SpecTestReport> {
    console.log('🚀 開始執行 MyCodeXvantaOS 規範測試...\n');

    // 載入治理規範
    await this.loadGovernanceSpec();

    // 執行各類測試
    await this.runIdentityTests();
    await this.runNamingConventionTests();
    await this.runCanonicalIdentifierTests();
    await this.runProtocolIdentifierTests();
    await this.runProviderIdentifierTests();
    await this.runCompositeIdentifierTests();
    await this.runPathDerivationTests();
    await this.runLayerArchitectureTests();
    await this.runCapabilityTests();
    await this.runPackageStructureTests();
    await this.runServiceDiscoveryTests();
    await this.runGovernanceRulesTests();

    return this.generateReport();
  }

  private async loadGovernanceSpec(): Promise<void> {
    const specPath = path.join(this.projectRoot, 'governance', 'platform-governance-spec.yaml');
    if (fs.existsSync(specPath)) {
      const content = fs.readFileSync(specPath, 'utf-8');
      this.governanceSpec = yaml.parse(content);
      this.addResult('Governance', '載入治理規範', true, '治理規範載入成功');
    } else {
      this.addResult('Governance', '載入治理規範', false, '找不到治理規範檔案');
    }
  }

  // ========================================
  // A. 身份錨點測試
  // ========================================
  private async runIdentityTests(): Promise<void> {
    console.log('📋 執行身份錨點測試...');

    if (!this.governanceSpec?.identity) {
      this.addResult('Identity', '身份配置', false, '缺少身份配置');
      return;
    }

    const identity = this.governanceSpec.identity;

    // 測試 1: 組織身份
    this.testAssertion(
      'Identity',
      'org_identity',
      identity.org_identity === 'mycodexvantaos',
      `組織身份應為 mycodexvantaos，實際為 ${identity.org_identity}`
    );

    // 測試 2: 根前綴
    this.testAssertion(
      'Identity',
      'root_prefix',
      identity.root_prefix === 'mycodexvantaos',
      `根前綴應為 mycodexvantaos，實際為 ${identity.root_prefix}`
    );

    // 測試 3: NPM Scope
    this.testAssertion(
      'Identity',
      'npm_scope',
      identity.npm_scope === '@mycodexvantaos',
      `NPM Scope 應為 @mycodexvantaos，實際為 ${identity.npm_scope}`
    );

    // 測試 4: URN Namespace
    this.testAssertion(
      'Identity',
      'urn_namespace',
      identity.urn_namespace === 'urn:mycodexvantaos',
      `URN Namespace 應為 urn:mycodexvantaos，實際為 ${identity.urn_namespace}`
    );

    // 測試 5: 禁用前綴
    const forbiddenPrefixes = identity.forbidden_legacy_prefixes || [];
    this.testAssertion(
      'Identity',
      'forbidden_prefixes_defined',
      forbiddenPrefixes.length >= 5,
      `應定義至少 5 個禁用前綴，實際為 ${forbiddenPrefixes.length}`
    );

    // 測試 6: 禁用前綴正則表達式
    this.testAssertion(
      'Identity',
      'forbidden_prefix_regex',
      !!identity.forbidden_legacy_regex,
      '應定義禁用前綴正則表達式'
    );
  }

  // ========================================
  // B. 命名閉環模型測試
  // ========================================
  private async runNamingConventionTests(): Promise<void> {
    console.log('📋 執行命名慣例測試...');

    if (!this.governanceSpec?.naming_closure_model) {
      this.addResult('Naming', '命名閉環模型', false, '缺少命名閉環模型');
      return;
    }

    const model = this.governanceSpec.naming_closure_model;

    // 測試終止層級
    this.testAssertion(
      'Naming',
      'termination_layers',
      model.termination_layers === 3,
      `終止層級應為 3，實際為 ${model.termination_layers}`
    );

    // 測試 L0 原子層
    const l0 = model.L0_atomic;
    this.testAssertion(
      'Naming',
      'L0_atomic_defined',
      l0?.mutability === 'immutable',
      `L0 原子層應為不可變`
    );

    // 測試 L0 原子類別數量
    const categories = l0?.atomic_categories || {};
    const totalCategories = Object.values(categories).flat().length;
    this.testAssertion(
      'Naming',
      'L0_atomic_categories_count',
      totalCategories >= 30,
      `L0 原子類別應至少 30 個，實際為 ${totalCategories}`
    );

    // 測試 L1 規範層
    const l1 = model.L1_normative;
    this.testAssertion(
      'Naming',
      'L1_normative_defined',
      l1?.mutability === 'requires_L2_reference',
      `L1 規範層變更需要 L2 引用`
    );

    // 測試 L2 元層
    const l2 = model.L2_meta;
    this.testAssertion(
      'Naming',
      'L2_meta_defined',
      l2?.mutability === 'requires_physical_multisig',
      `L2 元層變更需要實體多重簽名`
    );

    // 測試閉環證明器
    const prover = model.closure_prover;
    this.testAssertion('Naming', 'closure_prover_defined', !!prover?.class, `應定義閉環證明器類別`);
  }

  // ========================================
  // C. 標準標識符測試
  // ========================================
  private async runCanonicalIdentifierTests(): Promise<void> {
    console.log('📋 執行標準標識符測試...');

    if (!this.governanceSpec?.canonical_identifiers) {
      this.addResult('Canonical', '標準標識符', false, '缺少標準標識符定義');
      return;
    }

    const identifiers = this.governanceSpec.canonical_identifiers;

    // 測試 service_id 格式
    const serviceId = identifiers.service_id;
    this.testAssertion(
      'Canonical',
      'service_id_format',
      serviceId?.format?.startsWith('mycodexvantaos-'),
      `service_id 格式應以 mycodexvantaos- 開頭`
    );

    // 測試 service_id 正則
    const serviceIdRegex = serviceId?.regex;
    this.testAssertion(
      'Canonical',
      'service_id_regex',
      serviceIdRegex?.includes('mycodexvantaos'),
      `service_id 正則應包含 mycodexvantaos`
    );

    // 測試 capability 集合
    const capabilities = identifiers.canonical_capability_set?.values || [];
    this.testAssertion(
      'Canonical',
      'capability_set_count',
      capabilities.length >= 15,
      `應定義至少 15 個標準能力，實際為 ${capabilities.length}`
    );

    // 測試 capability 包含核心能力
    const coreCapabilities = ['database', 'storage', 'auth', 'queue', 'secrets'];
    const missingCore = coreCapabilities.filter((cap) => !capabilities.includes(cap));
    this.testAssertion(
      'Canonical',
      'core_capabilities_present',
      missingCore.length === 0,
      `缺少核心能力: ${missingCore.join(', ')}`
    );

    // 測試有效範例
    const validExamples = serviceId?.valid_examples || [];
    this.testAssertion(
      'Canonical',
      'valid_examples_defined',
      validExamples.length >= 3,
      `應提供至少 3 個有效範例`
    );

    // 測試無效範例
    const invalidExamples = serviceId?.invalid_examples || [];
    this.testAssertion(
      'Canonical',
      'invalid_examples_defined',
      invalidExamples.length >= 2,
      `應提供至少 2 個無效範例`
    );
  }

  // ========================================
  // D. 協議特定標識符測試
  // ========================================
  private async runProtocolIdentifierTests(): Promise<void> {
    console.log('📋 執行協議標識符測試...');

    if (!this.governanceSpec?.protocol_specific_identifiers) {
      this.addResult('Protocol', '協議標識符', false, '缺少協議標識符定義');
      return;
    }

    const protocols = this.governanceSpec.protocol_specific_identifiers;

    // 測試 package_name
    const packageName = protocols.package_name;
    this.testAssertion(
      'Protocol',
      'package_name_format',
      packageName?.format?.startsWith('@mycodexvantaos/'),
      `package_name 格式應以 @mycodexvantaos/ 開頭`
    );

    // 測試 env_var
    const envVar = protocols.env_var;
    this.testAssertion(
      'Protocol',
      'env_var_format',
      envVar?.format?.startsWith('MYCODEXVANTAOS_'),
      `env_var 格式應以 MYCODEXVANTAOS_ 開頭`
    );

    // 測試禁用前綴
    this.testAssertion(
      'Protocol',
      'env_var_forbidden_prefix',
      envVar?.forbidden_prefix === 'ORCH_',
      `env_var 禁用前綴應為 ORCH_`
    );

    // 測試 URN
    const urn = protocols.urn;
    this.testAssertion(
      'Protocol',
      'urn_format',
      urn?.format?.startsWith('urn:mycodexvantaos:'),
      `URN 格式應以 urn:mycodexvantaos: 開頭`
    );

    // 測試 internal_uri
    const internalUri = protocols.internal_uri;
    this.testAssertion(
      'Protocol',
      'internal_uri_format',
      internalUri?.format?.startsWith('mycodexvantaos://'),
      `internal_uri 格式應以 mycodexvantaos:// 開頭`
    );
  }

  // ========================================
  // E. Provider 標識符測試
  // ========================================
  private async runProviderIdentifierTests(): Promise<void> {
    console.log('📋 執行 Provider 標識符測試...');

    if (!this.governanceSpec?.provider_identifiers) {
      this.addResult('Provider', 'Provider 標識符', false, '缺少 Provider 標識符定義');
      return;
    }

    const providers = this.governanceSpec.provider_identifiers;

    // 測試 provider_instance 格式
    const providerInstance = providers.provider_instance;
    this.testAssertion(
      'Provider',
      'instance_format_defined',
      !!providerInstance?.format,
      '應定義 provider_instance 格式'
    );

    // 測試順序規則
    this.testAssertion(
      'Provider',
      'capability_first_rule',
      providerInstance?.order?.includes('capability FIRST'),
      '能力應在前，Provider 在後'
    );

    // 測試有效範例
    const validExamples = providerInstance?.valid_examples || [];
    const allValidFormat = validExamples.every(
      (ex: string) => ex.includes('-') && !ex.startsWith('postgres') && !ex.startsWith('openai')
    );
    this.testAssertion(
      'Provider',
      'valid_provider_examples',
      validExamples.length >= 3 && allValidFormat,
      '應提供有效的 provider 範例'
    );

    // 測試無效範例
    const invalidExamples = providerInstance?.invalid_examples || [];
    this.testAssertion(
      'Provider',
      'invalid_provider_examples',
      invalidExamples.length >= 2,
      '應提供無效的 provider 範例'
    );
  }

  // ========================================
  // F. 複合標識符測試
  // ========================================
  private async runCompositeIdentifierTests(): Promise<void> {
    console.log('📋 執行複合標識符測試...');

    if (!this.governanceSpec?.composite_identifiers) {
      this.addResult('Composite', '複合標識符', false, '缺少複合標識符定義');
      return;
    }

    const composites = this.governanceSpec.composite_identifiers;

    // 測試分隔符
    this.testAssertion(
      'Composite',
      'separator_defined',
      composites.separator === '--',
      '複合標識符分隔符應為 --'
    );

    // 測試複合標識符定義
    const definitions = composites.definitions || {};
    const definitionCount = Object.keys(definitions).length;
    this.testAssertion(
      'Composite',
      'definitions_count',
      definitionCount >= 8,
      `應定義至少 8 種複合標識符，實際為 ${definitionCount}`
    );

    // 測試 vector_collection
    const vectorCollection = definitions.vector_collection;
    this.testAssertion(
      'Composite',
      'vector_collection_format',
      vectorCollection?.format?.includes('--'),
      'vector_collection 格式應包含 -- 分隔符'
    );

    // 測試 embedding_model_alias
    const embeddingAlias = definitions.embedding_model_alias;
    this.testAssertion(
      'Composite',
      'embedding_alias_format',
      embeddingAlias?.format?.endsWith('d'),
      'embedding_model_alias 格式應以 d 結尾'
    );

    // 測試 exception_record_id
    const exceptionRecord = definitions.exception_record_id;
    this.testAssertion(
      'Composite',
      'exception_record_format',
      exceptionRecord?.format?.startsWith('exception--'),
      'exception_record 格式應以 exception-- 開頭'
    );
  }

  // ========================================
  // G. 路徑推導測試
  // ========================================
  private async runPathDerivationTests(): Promise<void> {
    console.log('📋 執行路徑推導測試...');

    if (!this.governanceSpec?.path_derivation) {
      this.addResult('Path', '路徑推導', false, '缺少路徑推導定義');
      return;
    }

    const pathDerivation = this.governanceSpec.path_derivation;

    // 測試推導規則
    this.testAssertion(
      'Path',
      'derivation_rule_defined',
      !!pathDerivation.rule,
      '應定義路徑推導規則'
    );

    // 測試推導來源
    this.testAssertion(
      'Path',
      'source_of_truth_defined',
      !!pathDerivation.source_of_truth,
      '應定義唯一真實來源'
    );

    // 測試推導定義
    const derivations = pathDerivation.derivations || {};
    const derivationCount = Object.keys(derivations).length;
    this.testAssertion(
      'Path',
      'derivation_count',
      derivationCount >= 5,
      `應定義至少 5 種路徑推導，實際為 ${derivationCount}`
    );

    // 測試 service_path 推導
    const servicePath = derivations.service_path;
    this.testAssertion(
      'Path',
      'service_path_formula',
      servicePath?.formula?.startsWith('services/'),
      'service_path 應以 services/ 開頭'
    );

    // 測試 package_name 推導
    const packageName = derivations.package_name;
    this.testAssertion(
      'Path',
      'package_name_formula',
      packageName?.formula?.startsWith('@mycodexvantaos/'),
      'package_name 應以 @mycodexvantaos/ 開頭'
    );
  }

  // ========================================
  // H. 層級架構測試
  // ========================================
  private async runLayerArchitectureTests(): Promise<void> {
    console.log('📋 執行層級架構測試...');

    // 檢查 packages 目錄結構
    const packagesPath = path.join(this.projectRoot, 'packages');
    if (!fs.existsSync(packagesPath)) {
      this.addResult('Layer', 'packages 目錄', false, 'packages 目錄不存在');
      return;
    }

    const packageDirs = fs
      .readdirSync(packagesPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    // 測試 Builder 層
    const builderPackages = packageDirs.filter(
      (dir) => dir.includes('builder') || dir.includes('generator')
    );
    this.testAssertion(
      'Layer',
      'builder_layer_packages',
      builderPackages.length >= 1,
      `Builder 層應至少有 1 個套件，實際為 ${builderPackages.length}`
    );

    // 測試 Runtime 層
    const runtimePackages = packageDirs.filter(
      (dir) => dir.includes('runtime') || dir.includes('execution')
    );
    this.testAssertion(
      'Layer',
      'runtime_layer_packages',
      runtimePackages.length >= 1,
      `Runtime 層應至少有 1 個套件`
    );

    // 測試 Native Services 層
    const nativeServicePackages = packageDirs.filter(
      (dir) =>
        dir.includes('database') ||
        dir.includes('storage') ||
        dir.includes('auth') ||
        dir.includes('queue')
    );
    this.testAssertion(
      'Layer',
      'native_services_packages',
      nativeServicePackages.length >= 3,
      `Native Services 層應至少有 3 個套件`
    );

    // 測試 Deployment 層
    const deploymentPackages = packageDirs.filter(
      (dir) => dir.includes('deployment') || dir.includes('kubernetes') || dir.includes('docker')
    );
    this.testAssertion(
      'Layer',
      'deployment_layer_packages',
      deploymentPackages.length >= 1,
      `Deployment 層應至少有 1 個套件`
    );

    // 測試 Connector 層
    const connectorPackages = packageDirs.filter(
      (dir) => dir.includes('connector') || dir.includes('provider') || dir.includes('integration')
    );
    this.testAssertion(
      'Layer',
      'connector_layer_packages',
      connectorPackages.length >= 1,
      `Connector 層應至少有 1 個套件`
    );

    // 測試 Governance 層
    const governancePath = path.join(this.projectRoot, 'governance');
    this.testAssertion(
      'Layer',
      'governance_layer_exists',
      fs.existsSync(governancePath),
      'Governance 層目錄應存在'
    );
  }

  // ========================================
  // I. 能力測試
  // ========================================
  private async runCapabilityTests(): Promise<void> {
    console.log('📋 執行能力測試...');

    const capabilitiesPath = path.join(this.projectRoot, 'governance', 'capability-set.yaml');

    if (!fs.existsSync(capabilitiesPath)) {
      this.addResult('Capability', '能力集合檔案', false, 'capability-set.yaml 不存在');
      return;
    }

    try {
      const content = fs.readFileSync(capabilitiesPath, 'utf-8');
      const capabilitySet = yaml.parse(content);

      // 測試能力定義
      const capabilities = capabilitySet.capabilities || {};
      const capCount = Object.keys(capabilities).length;
      this.testAssertion(
        'Capability',
        'capabilities_count',
        capCount >= 15,
        `應定義至少 15 個能力，實際為 ${capCount}`
      );

      // 測試核心能力
      const coreCapabilities = ['database', 'storage', 'auth', 'queue', 'secrets', 'deploy'];
      const definedCapabilities = Object.keys(capabilities);
      const missingCore = coreCapabilities.filter(
        (cap) =>
          !definedCapabilities.includes(cap) && !definedCapabilities.some((c) => c.includes(cap))
      );
      this.testAssertion(
        'Capability',
        'core_capabilities_defined',
        missingCore.length === 0,
        `缺少核心能力定義: ${missingCore.join(', ')}`
      );
    } catch (error) {
      this.addResult('Capability', '能力集合解析', false, `解析失敗: ${error}`);
    }
  }

  // ========================================
  // J. 套件結構測試
  // ========================================
  private async runPackageStructureTests(): Promise<void> {
    console.log('📋 執行套件結構測試...');

    const packagesPath = path.join(this.projectRoot, 'packages');
    if (!fs.existsSync(packagesPath)) {
      this.addResult('Package', '套件目錄', false, 'packages 目錄不存在');
      return;
    }

    const packageDirs = fs
      .readdirSync(packagesPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    let validPackages = 0;
    let invalidPackages = 0;
    const namingViolations: string[] = [];

    for (const dir of packageDirs) {
      const packageJsonPath = path.join(packagesPath, dir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

          // 檢查命名慣例
          if (pkg.name?.startsWith('@mycodexvantaos/')) {
            validPackages++;
          } else {
            invalidPackages++;
            namingViolations.push(pkg.name || dir);
          }

          // 檢查必要欄位
          if (!pkg.name || !pkg.version) {
            invalidPackages++;
          }
        } catch {
          invalidPackages++;
        }
      }
    }

    this.testAssertion(
      'Package',
      'valid_package_count',
      validPackages >= 20,
      `應有至少 20 個有效套件，實際為 ${validPackages}`
    );

    this.testAssertion(
      'Package',
      'naming_convention_compliance',
      invalidPackages === 0,
      `有 ${invalidPackages} 個套件不符合命名慣例: ${namingViolations.slice(0, 5).join(', ')}`
    );
  }

  // ========================================
  // K. 服務發現測試
  // ========================================
  private async runServiceDiscoveryTests(): Promise<void> {
    console.log('📋 執行服務發現測試...');

    const servicesPath = path.join(this.projectRoot, 'services');
    const modulesPath = path.join(this.projectRoot, 'modules');

    // 測試服務目錄
    this.testAssertion(
      'Service',
      'services_directory_exists',
      fs.existsSync(servicesPath),
      'services 目錄應存在'
    );

    // 測試模組目錄
    this.testAssertion(
      'Service',
      'modules_directory_exists',
      fs.existsSync(modulesPath),
      'modules 目錄應存在'
    );

    if (fs.existsSync(servicesPath)) {
      const serviceDirs = fs
        .readdirSync(servicesPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      // 測試服務數量
      this.testAssertion(
        'Service',
        'service_count',
        serviceDirs.length >= 15,
        `應有至少 15 個服務，實際為 ${serviceDirs.length}`
      );

      // 測試服務命名
      const validServiceNames = serviceDirs.filter((name) => name.startsWith('mycodexvantaos-'));
      this.testAssertion(
        'Service',
        'service_naming_convention',
        validServiceNames.length === serviceDirs.length,
        `所有服務應以 mycodexvantaos- 開頭`
      );
    }
  }

  // ========================================
  // L. 治理規則測試
  // ========================================
  private async runGovernanceRulesTests(): Promise<void> {
    console.log('📋 執行治理規則測試...');

    // 測試 CI 規則目錄
    const ciRulesPath = path.join(this.projectRoot, 'ci', 'rules');
    this.testAssertion(
      'Governance',
      'ci_rules_directory_exists',
      fs.existsSync(ciRulesPath),
      'CI 規則目錄應存在'
    );

    if (fs.existsSync(ciRulesPath)) {
      const ruleFiles = fs.readdirSync(ciRulesPath).filter((file) => file.endsWith('.rule.ts'));

      this.testAssertion(
        'Governance',
        'rule_files_count',
        ruleFiles.length >= 15,
        `應有至少 15 個規則檔案，實際為 ${ruleFiles.length}`
      );

      // 測試關鍵規則檔案
      const requiredRules = [
        'service-id.rule.ts',
        'package-name.rule.ts',
        'env-var.rule.ts',
        'urn.rule.ts',
        'capability-id.rule.ts',
      ];

      const missingRules = requiredRules.filter((rule) => !ruleFiles.includes(rule));
      this.testAssertion(
        'Governance',
        'required_rule_files',
        missingRules.length === 0,
        `缺少必要規則檔案: ${missingRules.join(', ')}`
      );
    }

    // 測試 Provider 註冊表
    const providerRegistryPath = path.join(
      this.projectRoot,
      'governance',
      'provider-registry.yaml'
    );
    this.testAssertion(
      'Governance',
      'provider_registry_exists',
      fs.existsSync(providerRegistryPath),
      'provider-registry.yaml 應存在'
    );

    // 測試例外檔案
    const exceptionsPath = path.join(this.projectRoot, 'governance', 'exceptions.yaml');
    this.testAssertion(
      'Governance',
      'exceptions_file_exists',
      fs.existsSync(exceptionsPath),
      'exceptions.yaml 應存在'
    );
  }

  // ========================================
  // 輔助方法
  // ========================================
  private testAssertion(
    category: string,
    testName: string,
    condition: boolean,
    message: string
  ): void {
    this.addResult(category, testName, condition, message);
  }

  private addResult(
    category: string,
    testName: string,
    passed: boolean,
    message: string,
    details?: any
  ): void {
    this.results.push({
      category,
      testName,
      passed,
      message,
      details,
    });

    const icon = passed ? '✅' : '❌';
    console.log(`  ${icon} [${category}] ${testName}: ${message}`);
  }

  private generateReport(): SpecTestReport {
    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const total = this.results.length;

    // 按類別統計
    const byCategory: Record<string, { passed: number; failed: number; total: number }> = {};
    for (const result of this.results) {
      if (!byCategory[result.category]) {
        byCategory[result.category] = { passed: 0, failed: 0, total: 0 };
      }
      byCategory[result.category].total++;
      if (result.passed) {
        byCategory[result.category].passed++;
      } else {
        byCategory[result.category].failed++;
      }
    }

    // 關鍵失敗
    const criticalFailures = this.results
      .filter((r) => !r.passed && ['Identity', 'Canonical', 'Naming'].includes(r.category))
      .map((r) => `[${r.category}] ${r.testName}: ${r.message}`);

    // 警告
    const warnings = this.results
      .filter((r) => !r.passed && !['Identity', 'Canonical', 'Naming'].includes(r.category))
      .map((r) => `[${r.category}] ${r.testName}`);

    return {
      timestamp: new Date().toISOString(),
      totalTests: total,
      passed,
      failed,
      skipped: 0,
      coverage: Math.round((passed / total) * 100),
      results: this.results,
      summary: {
        byCategory,
        criticalFailures,
        warnings,
      },
    };
  }
}

// 主執行
async function main() {
  const runner = new SpecTestRunner();
  const report = await runner.runAllTests();

  console.log('\n' + '='.repeat(60));
  console.log('📊 規範測試報告');
  console.log('='.repeat(60));
  console.log(`總測試數: ${report.totalTests}`);
  console.log(`通過: ${report.passed} ✅`);
  console.log(`失敗: ${report.failed} ❌`);
  console.log(`覆蓋率: ${report.coverage}%`);
  console.log('\n按類別統計:');

  for (const [category, stats] of Object.entries(report.summary.byCategory)) {
    console.log(`  ${category}: ${stats.passed}/${stats.total} 通過`);
  }

  if (report.summary.criticalFailures.length > 0) {
    console.log('\n🚨 關鍵失敗:');
    report.summary.criticalFailures.forEach((f) => console.log(`  - ${f}`));
  }

  // 輸出 JSON 報告
  const reportPath = __dirname + '/../docs/analysis/spec-test-report.json';
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 報告已輸出至: ${reportPath}`);

  process.exit(report.failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('測試執行失敗:', error);
  process.exit(1);
});
