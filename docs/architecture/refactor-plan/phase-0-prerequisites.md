# Phase 0 — 前置作業（Prerequisites）

**預估時間:** 0.5 天  
**風險:** 🟢 無（只讀掃描 + 工具建立，不移動任何代碼）  
**必須完成才能開 Phase 1**

---

## 0.1 目標

在不改動任何現有代碼的前提下，建立整個重構的基礎工具集，並確認所有搬移前置條件。

---

## 0.2 任務清單

### Task 0.1 — 建立 directory-contract.yaml Schema

建立 `contracts/schemas/governance/directory-contract.v1.json`：

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://mycodexvantaos.dev/schemas/directory-contract.v1.json",
  "title": "DirectoryContract",
  "type": "object",
  "required": ["apiVersion", "kind", "metadata", "spec"],
  "properties": {
    "apiVersion": { "const": "cxos/v1" },
    "kind": { "const": "DirectoryContract" },
    "metadata": {
      "type": "object",
      "required": ["name", "phase", "owners"],
      "properties": {
        "name": { "type": "string", "pattern": "^[a-z][a-z0-9-]*$" },
        "phase": { "type": "string", "enum": ["planning","active","deprecated"] },
        "owners": {
          "type": "object",
          "required": ["primary"],
          "properties": {
            "primary": { "type": "string" },
            "reviewers": { "type": "array", "items": { "type": "string" } }
          }
        }
      }
    },
    "spec": {
      "type": "object",
      "required": ["provides","consumes","blastRadius"],
      "properties": {
        "provides": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["capability"],
            "properties": { "capability": { "type": "string" } }
          }
        },
        "consumes": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["capability","from"],
            "properties": {
              "capability": { "type": "string" },
              "from": { "type": "string" }
            }
          }
        },
        "blastRadius": {
          "type": "object",
          "required": ["isolation"],
          "properties": {
            "isolation": { "type": "string", "enum": ["none","namespace","process","vm"] },
            "sharedState": { "type": "string" }
          }
        },
        "health": {
          "type": "object",
          "properties": {
            "probe": { "type": "string" },
            "interval": { "type": "string" },
            "failureThreshold": { "type": "integer" }
          }
        },
        "fallback": { "type": "array" },
        "recovery": { "type": "object" }
      }
    }
  }
}
```

### Task 0.2 — 建立驗證工具 `tools/scripts/govctl.py`

```python
#!/usr/bin/env python3
"""
govctl.py — governance 驗證控制器
用法:
  python3 govctl.py validate <dir>         # 驗證單一目錄的 directory-contract.yaml
  python3 govctl.py validate-all           # 驗證所有目錄
  python3 govctl.py check-deps             # 掃描斷鏈依賴
  python3 govctl.py scan-imports <dir>     # 掃描某目錄的 import 路徑
"""
import sys, os, json
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
SCHEMA_PATH = ROOT / "contracts/schemas/governance/directory-contract.v1.json"

def validate(directory: str) -> bool:
    contract_path = ROOT / directory / "directory-contract.yaml"
    if not contract_path.exists():
        print(f"❌ MISSING: {contract_path}")
        return False
    # TODO: 接入 jsonschema 驗證
    print(f"✅ FOUND: {contract_path}")
    return True

def check_deps() -> int:
    """掃描所有 @mycodexvantaos/* import，確認目標包存在"""
    import re
    broken = []
    pkg_names = set()
    
    # 收集所有已知包名
    for pj in ROOT.rglob("package.json"):
        if "node_modules" in str(pj): continue
        try:
            d = json.loads(pj.read_text())
            if d.get("name","").startswith("@mycodexvantaos/"):
                pkg_names.add(d["name"])
        except: pass
    
    # 掃描 import 引用
    for ts in ROOT.rglob("*.ts"):
        if "node_modules" in str(ts) or "dist" in str(ts): continue
        content = ts.read_text(errors="ignore")
        for m in re.finditer(r"from\s+['\"](@mycodexvantaos/[^'\"]+)['\"]", content):
            pkg = m.group(1).split("/")[0] + "/" + m.group(1).split("/")[1] if m.group(1).count("/") > 1 else m.group(1)
            if pkg not in pkg_names:
                broken.append((str(ts), pkg))
    
    if broken:
        print(f"❌ {len(broken)} broken imports found:")
        for f, p in broken[:20]:
            print(f"  {f}: {p}")
    else:
        print(f"✅ All @mycodexvantaos/* imports resolve correctly ({len(pkg_names)} packages known)")
    return len(broken)

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "help"
    if cmd == "validate" and len(sys.argv) > 2:
        sys.exit(0 if validate(sys.argv[2]) else 1)
    elif cmd == "validate-all":
        target_dirs = ["contracts","governance","adapters","services","intelligence",
                       "data","infra","apps","release","tooling","tests","docs"]
        results = [validate(d) for d in target_dirs if (ROOT/d).exists()]
        sys.exit(0 if all(results) else 1)
    elif cmd == "check-deps":
        sys.exit(0 if check_deps() == 0 else 1)
    else:
        print(__doc__)
```

### Task 0.3 — 建立依賴掃描腳本 `tools/scripts/scan_before_move.py`

```python
#!/usr/bin/env python3
"""
使用方法: python3 scan-before-move.py <source_dir>
在搬移前確認：
  1. 沒有其他目錄 import 此目錄的代碼
  2. 此目錄沒有 import 其他將被搬移的目錄
"""
import sys, os, re
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent

def scan(source_dir: str):
    source = ROOT / source_dir
    if not source.exists():
        print(f"❌ {source_dir} does not exist")
        return

    inbound = []   # 外部引用此目錄
    outbound = []  # 此目錄引用外部

    for ts in ROOT.rglob("*.ts"):
        if "node_modules" in str(ts) or "dist" in str(ts): continue
        rel = str(ts.relative_to(ROOT))
        content = ts.read_text(errors="ignore")
        
        # 相對路徑 import
        for m in re.finditer(r"from\s+['\"](\.\.[^'\"]*)['\"]", content):
            imp = m.group(1)
            # 解析 import 的絕對路徑
            abs_imp = (ts.parent / imp).resolve()
            if str(abs_imp).startswith(str(source)):
                if not str(ts).startswith(str(source)):
                    inbound.append((rel, imp))
            if str(ts).startswith(str(source)):
                if not str(abs_imp).startswith(str(source)):
                    outbound.append((rel, imp))

    print(f"\n📁 分析目錄: {source_dir}")
    print(f"\n→ 外部引用此目錄 (inbound): {len(inbound)} 處")
    for f, i in inbound[:10]: print(f"  {f}: {i}")
    
    print(f"\n← 此目錄引用外部 (outbound): {len(outbound)} 處")
    for f, i in outbound[:10]: print(f"  {f}: {i}")
    
    if len(inbound) == 0:
        print(f"\n✅ 安全：無外部代碼直接引用 {source_dir}/")
    else:
        print(f"\n⚠️  注意：有 {len(inbound)} 處外部引用需在搬移後同步更新")

if __name__ == "__main__":
    scan(sys.argv[1] if len(sys.argv) > 1 else ".")
```

### Task 0.4 — 確認 project-import/ 可安全封存

```bash
# 執行：
grep -r "project-import" . \
  --include="*.ts" --include="*.py" --include="*.js" \
  --include="*.json" --include="*.yaml" --include="*.yml" \
  --exclude-dir=.git --exclude-dir=node_modules

# 預期輸出: 0 行（實測已確認）
# 若有輸出：先修正那些引用再繼續
```

### Task 0.5 — 建立空的目標目錄結構（僅創建，不移動）

```bash
# 預先建立各目標目錄（帶 .gitkeep），讓後續 Phase 有地方放檔案
mkdir -p tools/scripts
mkdir -p runtime-mesh/{capability-router,failover-registry,ai-repair-queue}
touch tools/scripts/.gitkeep
```

### Task 0.6 — 產生「三層架構分類表」

```bash
# 執行 tools/scripts/classify_packages.py 產生
# docs/architecture/refactor-plan/data/package-classification.csv
```

輸出格式：

| 包名 | 目前位置 | 代碼行數 | 分類 | 目標位置 | 備注 |
|------|----------|----------|------|----------|------|
| @mycodexvantaos/core | packages/core | 1,160 | domain-model | contracts/domain | 無依賴，可安全移動 |
| @mycodexvantaos/ports | packages/ports | 492 | port-interface | contracts/ports | 被 7 個包依賴 |
| @mycodexvantaos/runtime | packages/runtime | ~800 | runtime-kernel | services/core/kernel | **被 32 個包依賴，Phase 4 最後處理** |

---

## 0.3 完成標準

```
✅ tools/scripts/govctl.py 已建立並可執行
✅ tools/scripts/scan_before_move.py 已建立
✅ project-import/ 掃描確認 0 個現役引用
⏳ contracts/schemas/governance/directory-contract.v1.json 尚未建立（待 PR 後續補齊）
⏳ docs/architecture/refactor-plan/data/package-classification.csv 尚未產生（待執行 classify-packages.py）
⏳ git commit "chore: Phase 0 — refactor tooling and prerequisite scan"
⏳ CI 全綠（待前兩項補齊）
```

---

## 0.4 輸出物

- `contracts/schemas/governance/directory-contract.v1.json`
- `tools/scripts/govctl.py`
- `tools/scripts/scan_before_move.py`
- `tools/scripts/classify_packages.py`
- `docs/architecture/refactor-plan/data/package-classification.csv`
