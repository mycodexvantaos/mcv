"""Rationale: 建立可重複執行的 MyCodexVantaOS 原廠語言稽核器，將檔案與 Python 專案映射為能力資產。"""

from __future__ import annotations

import ast
import hashlib
import json
import re
import time
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Iterable

from mycodexvantaos_doctor.taxonomy import (
    BANNED_EXTERNAL_PLATFORM_TERMS,
    CATEGORY_RULES,
    MODULE_KEYWORDS,
    NATIVE_REPLACEMENTS,
    NativeCategory,
    NativeModule,
)


@dataclass(frozen=True)
class AuditFinding:
    code: str
    severity: str
    path: str
    line: int | None
    message: str
    recommendation: str


@dataclass(frozen=True)
class FileClassification:
    path: str
    category: str
    icon: str
    modules: tuple[str, ...]
    confidence: float
    sha256: str


@dataclass(frozen=True)
class PythonCodeMetrics:
    path: str
    functions: int
    classes: int
    async_functions: int
    imports: int
    todos: int
    max_function_length: int
    max_complexity: int


@dataclass
class AuditReport:
    schema_version: str
    generated_at: str
    target: str
    summary: dict[str, Any]
    classifications: list[FileClassification] = field(default_factory=list)
    python_metrics: list[PythonCodeMetrics] = field(default_factory=list)
    findings: list[AuditFinding] = field(default_factory=list)
    native_capability_matrix: dict[str, list[str]] = field(default_factory=dict)

    def to_json(self) -> str:
        return json.dumps(asdict(self), ensure_ascii=False, indent=2)


class MyCodexVantaOSAuditor:
    def __init__(self, target: str | Path) -> None:
        self.target = Path(target)
        if not self.target.exists():
            raise FileNotFoundError(f"target not found: {self.target}")

    def run(self) -> AuditReport:
        files = list(self._iter_supported_files())
        classifications = [self._classify_file(path) for path in files]
        findings = self._collect_findings(files)
        metrics = [self._metric_python_file(path) for path in files if path.suffix == ".py"]
        matrix = self._build_capability_matrix(classifications)
        summary = self._build_summary(files, classifications, metrics, findings)
        return AuditReport(
            schema_version="mcv.audit.report.v1",
            generated_at=time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            target=str(self.target),
            summary=summary,
            classifications=classifications,
            python_metrics=metrics,
            findings=findings,
            native_capability_matrix=matrix,
        )

    def write_report(self, output: str | Path) -> Path:
        output_path = Path(output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(self.run().to_json() + "\n", encoding="utf-8")
        return output_path

    def write_markdown_architecture(self, output: str | Path) -> Path:
        report = self.run()
        output_path = Path(output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(self._render_markdown(report), encoding="utf-8")
        return output_path

    def _iter_supported_files(self) -> Iterable[Path]:
        ignored = {".git", "node_modules", "__pycache__", ".venv", "venv", "dist", "build"}
        if self.target.is_file():
            if self.target.suffix.lower() in {".md", ".py", ".yaml", ".yml", ".json", ".toml"}:
                yield self.target
            return
        for path in sorted(self.target.rglob("*")):
            if any(part in ignored for part in path.parts):
                continue
            if path.is_file() and path.suffix.lower() in {".md", ".py", ".yaml", ".yml", ".json", ".toml"}:
                yield path

    def _read_text(self, path: Path) -> str:
        return path.read_text(encoding="utf-8", errors="replace")

    def _classify_file(self, path: Path) -> FileClassification:
        text = self._read_text(path)
        rel = self._relative(path)
        category, score = self._detect_category(path, text)
        modules = self._detect_modules(text, rel)
        sha = hashlib.sha256(text.encode("utf-8")).hexdigest()
        max_score = max(score, 1)
        confidence = min(1.0, max_score / 6)
        icon = next(rule.icon for rule in CATEGORY_RULES if rule.category == category)
        return FileClassification(
            path=rel,
            category=category.value,
            icon=icon,
            modules=tuple(module.value for module in modules),
            confidence=round(confidence, 3),
            sha256=sha,
        )

    def _detect_category(self, path: Path, text: str) -> tuple[NativeCategory, int]:
        rel_parts = [part.lower() for part in self._relative(path).replace("\\", "/").split("/")]
        lowered = text.lower()
        fname = path.name.lower().replace("_", " ").replace("-", " ")
        marker = re.search(r"<!--\s*mcv:\s*([^>]{1,40})\s*-->", text, flags=re.IGNORECASE)
        if marker:
            for rule in CATEGORY_RULES:
                if rule.category.value in marker.group(1):
                    return rule.category, 6
        scores: dict[NativeCategory, int] = {}
        for rule in CATEGORY_RULES:
            score = 0
            score += sum(3 for hint in rule.path_hints if hint in rel_parts)
            score += sum(2 for keyword in rule.keywords if keyword.lower() in fname)
            score += sum(lowered.count(keyword.lower()) for keyword in rule.keywords)
            scores[rule.category] = score
        best = max(scores, key=scores.get)
        if scores[best] == 0:
            return NativeCategory.TAXONOMY, 1
        return best, scores[best]

    def _detect_modules(self, text: str, rel: str) -> tuple[NativeModule, ...]:
        haystack = f"{rel}\n{text}".lower()
        detected: list[NativeModule] = []
        for module, keywords in MODULE_KEYWORDS.items():
            if any(keyword.lower() in haystack for keyword in keywords):
                detected.append(module)
        return tuple(detected)

    def _collect_findings(self, files: list[Path]) -> list[AuditFinding]:
        findings: list[AuditFinding] = []
        for path in files:
            text = self._read_text(path)
            findings.extend(self._detect_external_terms(path, text))
            if path.suffix == ".py":
                findings.extend(self._detect_python_risks(path, text))
            if path.suffix.lower() in {".yaml", ".yml"}:
                findings.extend(self._detect_yaml_risks(path, text))
        return findings

    def _detect_external_terms(self, path: Path, text: str) -> list[AuditFinding]:
        findings: list[AuditFinding] = []
        lines = text.splitlines()
        for index, line in enumerate(lines, start=1):
            for term in BANNED_EXTERNAL_PLATFORM_TERMS:
                if term.lower() in line.lower():
                    replacement = NATIVE_REPLACEMENTS.get(term, "MyCodexVantaOS 原生能力模組")
                    findings.append(
                        AuditFinding(
                            code="MCV-NAMING-001",
                            severity="high",
                            path=self._relative(path),
                            line=index,
                            message=f"偵測到非原廠平台語彙：{term}",
                            recommendation=f"改寫為：{replacement}",
                        )
                    )
        return findings

    def _detect_python_risks(self, path: Path, text: str) -> list[AuditFinding]:
        findings: list[AuditFinding] = []
        try:
            tree = ast.parse(text)
        except SyntaxError as exc:
            return [
                AuditFinding(
                    code="MCV-PY-SYNTAX-001",
                    severity="blocker",
                    path=self._relative(path),
                    line=exc.lineno,
                    message=exc.msg,
                    recommendation="修正 Python 語法後重新執行 MyCodexVantaOS Doctor。",
                )
            ]
        for node in ast.walk(tree):
            if isinstance(node, ast.Try):
                for handler in node.handlers:
                    if handler.type is None:
                        findings.append(
                            AuditFinding(
                                code="MCV-PY-SEC-001",
                                severity="high",
                                path=self._relative(path),
                                line=handler.lineno,
                                message="裸 except 會吞噬系統錯誤並破壞可觀測性。",
                                recommendation="改用 except Exception as exc 並記錄結構化錯誤上下文。",
                            )
                        )
            if isinstance(node, ast.Call):
                name = self._call_name(node)
                if name in {"eval", "exec", "__import__"}:
                    findings.append(
                        AuditFinding(
                            code="MCV-PY-SEC-002",
                            severity="critical",
                            path=self._relative(path),
                            line=node.lineno,
                            message=f"偵測到高風險動態執行：{name}",
                            recommendation="移除動態執行；若需解析字面值，使用 ast.literal_eval 並加入輸入白名單。",
                        )
                    )
                if name in {"os.system", "os.popen", "subprocess.call", "subprocess.run"}:
                    findings.extend(self._inspect_subprocess_call(path, node, name))
            if isinstance(node, ast.FunctionDef):
                length = (getattr(node, "end_lineno", node.lineno) or node.lineno) - node.lineno + 1
                if length > 50:
                    findings.append(
                        AuditFinding(
                            code="MCV-PY-MAINT-001",
                            severity="medium",
                            path=self._relative(path),
                            line=node.lineno,
                            message=f"函式 {node.name} 長度為 {length} 行，超過 50 行門檻。",
                            recommendation="拆分為具單一責任的小函式，保留可測試公開介面。",
                        )
                    )
        return findings

    def _inspect_subprocess_call(self, path: Path, node: ast.Call, name: str) -> list[AuditFinding]:
        findings: list[AuditFinding] = []
        for keyword in node.keywords:
            if keyword.arg == "shell" and isinstance(keyword.value, ast.Constant) and keyword.value.value is True:
                findings.append(
                    AuditFinding(
                        code="MCV-PY-SEC-003",
                        severity="critical",
                        path=self._relative(path),
                        line=node.lineno,
                        message=f"{name} 使用 shell=True，存在命令注入風險。",
                        recommendation="使用 subprocess.run([...], shell=False, check=True)，並對參數做白名單驗證。",
                    )
                )
        if name in {"os.system", "os.popen"}:
            findings.append(
                AuditFinding(
                    code="MCV-PY-SEC-004",
                    severity="high",
                    path=self._relative(path),
                    line=node.lineno,
                    message=f"使用 {name} 執行系統命令，缺乏參數隔離。",
                    recommendation="改用 subprocess.run 的 list 參數形式並設定 timeout。",
                )
            )
        return findings

    def _detect_yaml_risks(self, path: Path, text: str) -> list[AuditFinding]:
        findings: list[AuditFinding] = []
        risky_values = re.compile(r"^\s*[^#:\n]+:\s*(on|off|yes|no|y|n|[0-9]+\.[0-9]+)\s*$", re.IGNORECASE)
        for index, line in enumerate(text.splitlines(), start=1):
            if risky_values.search(line):
                findings.append(
                    AuditFinding(
                        code="MCV-YAML-TYPE-001",
                        severity="medium",
                        path=self._relative(path),
                        line=index,
                        message="YAML 裸值可能因解析器版本產生型別漂移。",
                        recommendation="以 MyCodexVantaOS Schema 驗證最終型別，語義關鍵欄位使用明確結構或引號。",
                    )
                )
        return findings

    def _metric_python_file(self, path: Path) -> PythonCodeMetrics:
        text = self._read_text(path)
        try:
            tree = ast.parse(text)
        except SyntaxError:
            return PythonCodeMetrics(self._relative(path), 0, 0, 0, 0, 0, 0, 0)
        functions = [node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]
        async_functions = [node for node in ast.walk(tree) if isinstance(node, ast.AsyncFunctionDef)]
        classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
        imports = [node for node in ast.walk(tree) if isinstance(node, ast.Import | ast.ImportFrom)]
        todos = sum(1 for line in text.splitlines() if "TODO" in line or "FIXME" in line)
        max_length = max(
            ((getattr(node, "end_lineno", node.lineno) or node.lineno) - node.lineno + 1 for node in functions),
            default=0,
        )
        max_complexity = max((self._complexity(node) for node in functions), default=0)
        return PythonCodeMetrics(
            path=self._relative(path),
            functions=len(functions),
            classes=len(classes),
            async_functions=len(async_functions),
            imports=len(imports),
            todos=todos,
            max_function_length=max_length,
            max_complexity=max_complexity,
        )

    def _complexity(self, node: ast.AST) -> int:
        branch_nodes = (
            ast.If,
            ast.For,
            ast.AsyncFor,
            ast.While,
            ast.Try,
            ast.ExceptHandler,
            ast.BoolOp,
            ast.IfExp,
            ast.Match,
        )
        return 1 + sum(1 for child in ast.walk(node) if isinstance(child, branch_nodes))

    def _call_name(self, node: ast.Call) -> str:
        if isinstance(node.func, ast.Name):
            return node.func.id
        if isinstance(node.func, ast.Attribute):
            parts = [node.func.attr]
            value = node.func.value
            while isinstance(value, ast.Attribute):
                parts.append(value.attr)
                value = value.value
            if isinstance(value, ast.Name):
                parts.append(value.id)
            return ".".join(reversed(parts))
        return ""

    def _build_capability_matrix(self, classifications: list[FileClassification]) -> dict[str, list[str]]:
        matrix: dict[str, list[str]] = defaultdict(list)
        for item in classifications:
            if not item.modules:
                matrix["Unmapped"].append(item.path)
            for module in item.modules:
                matrix[module].append(item.path)
        return dict(sorted(matrix.items(), key=lambda pair: pair[0]))

    def _build_summary(
        self,
        files: list[Path],
        classifications: list[FileClassification],
        metrics: list[PythonCodeMetrics],
        findings: list[AuditFinding],
    ) -> dict[str, Any]:
        category_counts = Counter(item.category for item in classifications)
        severity_counts = Counter(item.severity for item in findings)
        return {
            "total_files": len(files),
            "python_files": sum(1 for path in files if path.suffix == ".py"),
            "document_files": sum(1 for path in files if path.suffix.lower() in {".md", ".yaml", ".yml", ".json", ".toml"}),
            "category_counts": dict(sorted(category_counts.items())),
            "severity_counts": dict(sorted(severity_counts.items())),
            "total_findings": len(findings),
            "total_functions": sum(item.functions for item in metrics),
            "total_classes": sum(item.classes for item in metrics),
            "max_complexity": max((item.max_complexity for item in metrics), default=0),
        }

    def _render_markdown(self, report: AuditReport) -> str:
        lines: list[str] = [
            "# MyCodexVantaOS 原廠能力稽核報告",
            "",
            f"> Schema: `{report.schema_version}`",
            f"> Target: `{report.target}`",
            f"> Generated At: `{report.generated_at}`",
            "",
            "## 核心摘要",
            "",
            "```json",
            json.dumps(report.summary, ensure_ascii=False, indent=2),
            "```",
            "",
            "## 原廠能力矩陣",
            "",
        ]
        for module, paths in report.native_capability_matrix.items():
            lines.append(f"### {module}")
            for path in paths:
                lines.append(f"- `{path}`")
            lines.append("")
        lines.extend(["## 分類結果", ""])
        for item in report.classifications:
            modules = ", ".join(item.modules) if item.modules else "Unmapped"
            lines.append(f"- {item.icon} `{item.path}` -> **{item.category}** / {modules}")
        lines.extend(["", "## 品質與命名發現", ""])
        if not report.findings:
            lines.append("- 無發現")
        for finding in report.findings:
            location = f"{finding.path}:{finding.line}" if finding.line else finding.path
            lines.append(f"- **{finding.severity.upper()}** `{finding.code}` `{location}` -- {finding.message}")
            lines.append(f"  - 修正：{finding.recommendation}")
        lines.append("")
        return "\n".join(lines)

    def _relative(self, path: Path) -> str:
        try:
            return str(path.relative_to(self.target if self.target.is_dir() else self.target.parent))
        except ValueError:
            return str(path)
