# Pattern: Test Complexity Gate（測試複雜度門控）

**Category**: Governance
**Maturity**: Proven
**Score**: 86/100
**Source**: MyCodexVantaOS Core Archive

---

## Problem

傳統 code coverage 指標無法衡量架構健康度：

- 100% coverage 的代碼可能仍然嚴重耦合
- 沒有方法量化「這個服務有多難測試」
- Service Locator Pattern 可以無限膨脹而不被發現

## Solution

用「測試複雜度」（mock burden）作為架構健康指標：

```text
Test Complexity Governance Gate
  ├── Dependency Graph Analyzer     — 分析服務依賴圖
  ├── Mock Burden Calculator        — 計算需要 mock 多少依賴
  ├── Complexity Threshold Policy   — 定義可接受的複雜度上限
  ├── CI Gate Reporter              — CI 報告與阻止
  └── Refactor Recommendation       — 建議重構方向
```

**核心指標**：

```text
Mock Burden = 測試一個服務需要 mock 的外部依賴數量

Mock Burden < 5:   低複雜度（理想）
Mock Burden 5-10:  中複雜度（可接受，需關注）
Mock Burden > 10:  高複雜度（需要重構）
Mock Burden > 20:  極高複雜度（阻止合入 main）
```

## Implementation Guide

### Mock Burden Calculator

```typescript
// ci/service-complexity-analyzer.ts
import { Project } from "ts-morph";

interface ComplexityReport {
  service: string;
  mockBurden: number;
  dependencies: string[];
  recommendation?: string;
}

async function calculateMockBurden(serviceDir: string): Promise<ComplexityReport> {
  const project = new Project();
  project.addSourceFilesFromTsConfig(`${serviceDir}/tsconfig.json`);

  const externalDeps = new Set<string>();

  for (const sourceFile of project.getSourceFiles()) {
    for (const importDecl of sourceFile.getImportDeclarations()) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      // 計算需要 mock 的外部依賴
      if (!moduleSpecifier.startsWith(".") && !moduleSpecifier.startsWith("@types")) {
        externalDeps.add(moduleSpecifier);
      }
    }
  }

  const mockBurden = externalDeps.size;
  let recommendation: string | undefined;

  if (mockBurden > 20) {
    recommendation = "CRITICAL: Refactor required. Extract adapter pattern.";
  } else if (mockBurden > 10) {
    recommendation = "WARNING: Consider extracting dependencies.";
  }

  return {
    service: serviceDir,
    mockBurden,
    dependencies: [...externalDeps],
    recommendation,
  };
}
```

## CI Enforcement

```yaml
name: Service Complexity Gate
on:
  pull_request:
    paths:
      - "services/**"
      - "modules/**"

jobs:
  complexity-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Calculate mock burden
        run: node ci/service-complexity-analyzer.ts --threshold 10 --fail-above 20
      - name: Generate complexity report
        run: node ci/service-complexity-analyzer.ts --format markdown >> $GITHUB_STEP_SUMMARY
```

## Example Structure

```text
ci/
├── service-complexity-analyzer.ts
└── complexity-threshold.config.yaml

.github/workflows/
└── service-complexity-gate.yml
```

---

_Pattern Score: 86/100 | Priority: Medium | Related Skill: SM-09-A_
