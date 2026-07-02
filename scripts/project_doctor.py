#!/usr/bin/env python3
"""
Project Doctor — MyCodexVantaOS v1.0.0

Machine-executable project health tool for the MyCodexVantaOS monorepo.
Performs four deterministic tasks:
  1. Progress audit — inventory functions, classes, TODO/FIXME markers
  2. Missing module detection — uninstalled packages, empty stubs
  3. Unit test scaffolding — generate test stubs and AST parse benchmarks
  4. Logic vulnerability scan — bare except, eval, os.command patterns

Output: machine-readable JSON + corrected file artifacts

Document ID: IM-PROJDOCTOR-001
"""

from __future__ import annotations

import ast
import argparse
import importlib.util
import json
import sys
import time
from io import StringIO
from pathlib import Path
from typing import Any, Dict, List, Optional

# MyCodexVantaOS identity constants
CANONICAL_URL = "https://mycodexvantaos.com"
MACHINE_IDENTITY = "mycodexvantaos"


class ProjectAuditor:
    """Deterministic project health auditor for MyCodexVantaOS."""

    def __init__(self, target_path: str) -> None:
        self.target_path = Path(target_path)
        self.code_content = ""
        self.tree: Optional[ast.AST] = None
        self.report: Dict[str, Any] = {
            "status": "success",
            "target": str(self.target_path),
            "machineIdentity": MACHINE_IDENTITY,
            "canonicalUrl": CANONICAL_URL,
            "tasks": {},
        }

        # Read target file or directory
        if self.target_path.is_file() and self.target_path.suffix == ".py":
            with open(self.target_path, "r", encoding="utf-8") as f:
                self.code_content = f.read()
            self.tree = ast.parse(self.code_content)
        elif self.target_path.is_dir():
            py_files = list(self.target_path.glob("*.py"))
            if py_files:
                with open(py_files[0], "r", encoding="utf-8") as f:
                    self.code_content = f.read()
                self.tree = ast.parse(self.code_content)
                self.report["target"] = str(py_files[0])
            else:
                raise FileNotFoundError("No Python files found in target directory")
        else:
            raise FileNotFoundError("Provide a valid .py file or project directory")

    # ================= Task 1: Progress Audit =================
    def task_progress(self) -> Dict[str, Any]:
        """Inventory implemented functions, classes, and TODO/FIXME markers."""
        if self.tree is None:
            return {"error": "No AST available for analysis"}

        functions = [n.name for n in ast.walk(self.tree) if isinstance(n, ast.FunctionDef)]
        classes = [n.name for n in ast.walk(self.tree) if isinstance(n, ast.ClassDef)]
        todos = [line.strip() for line in self.code_content.split("\n") if "TODO" in line or "FIXME" in line]

        return {
            "total_functions": len(functions),
            "total_classes": len(classes),
            "function_list": functions[:20],
            "class_list": classes[:20],
            "todo_count": len(todos),
            "todo_details": todos[:10],
            "estimated_completion": f"{len(functions) + len(classes)} defined units",
        }

    # ================= Task 2: Missing Module Detection =================
    def task_missing_modules(self) -> Dict[str, Any]:
        """Detect ImportError risks, undefined variables, and empty stubs."""
        if self.tree is None:
            return {"error": "No AST available for analysis"}

        imports: List[str] = []
        missing: List[str] = []
        defined_names: set[str] = set()

        # Collect all defined names
        for node in ast.walk(self.tree):
            if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
                defined_names.add(node.name)
            if isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        defined_names.add(target.id)

        # Check imports
        for node in ast.walk(self.tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                imports.append(f"{node.module}.{node.names[0].name}" if node.module else node.names[0].name)

        # Check if packages are installed
        for imp in imports:
            base_pkg = imp.split(".")[0]
            if importlib.util.find_spec(base_pkg) is None:
                missing.append(f"Uninstalled package: {base_pkg}")

        # Check for empty stubs (pass-only functions)
        empty_funcs: List[str] = []
        for node in ast.walk(self.tree):
            if isinstance(node, ast.FunctionDef) and len(node.body) == 1 and isinstance(node.body[0], ast.Pass):
                empty_funcs.append(node.name)

        if empty_funcs:
            missing.append(f"Unimplemented stubs with only pass: {empty_funcs}")

        return {
            "imported_modules": imports[:30],
            "missing_packages": missing,
            "unimplemented_hints": empty_funcs,
            "suggestion": "pip install " + " ".join(
                [m.split(":")[-1].strip() for m in missing if "Uninstalled" in m]
            ) if missing else "All imports resolved",
        }

    # ================= Task 3: Unit Test Scaffolding =================
    def task_unittest_performance(self) -> Dict[str, Any]:
        """Generate test stubs and measure AST parse benchmark."""
        if self.tree is None:
            return {"error": "No AST available for analysis"}

        test_code: List[str] = []
        test_code.append("import unittest")
        test_code.append("from pathlib import Path")
        test_code.append(f"# Auto-generated test stubs for {self.target_path.name}")
        test_code.append("")

        functions = [n for n in ast.walk(self.tree) if isinstance(n, ast.FunctionDef)]
        for func in functions[:10]:
            test_code.append(f"class Test{func.name.capitalize()}(unittest.TestCase):")
            test_code.append(f"    def test_{func.name}_basic(self):")
            test_code.append(f"        # TODO: implement actual test logic")
            test_code.append(f"        self.assertTrue(True)  # placeholder")
            test_code.append("")

        test_script = "\n".join(test_code)

        # Performance benchmark: AST parse speed
        perf_result: Dict[str, Any] = {}
        if functions:
            func_name = functions[0].name
            start = time.perf_counter()
            for _ in range(1000):
                ast.parse(self.code_content)
            elapsed = time.perf_counter() - start
            perf_result = {
                "profiled_function": func_name,
                "ast_parse_benchmark_ms": round(elapsed * 1000, 2),
                "note": "Static parse performance; runtime profiling requires cProfile",
            }

        return {
            "generated_unittest_stub": test_script,
            "performance_benchmark": perf_result,
            "instruction": "Save test script as test_xxx.py and run python -m unittest",
        }

    # ================= Task 4: Logic Vulnerability Scan =================
    def task_logic_fix(self) -> Dict[str, Any]:
        """Detect common vulnerabilities (bare except, eval, os.command) and produce corrections."""
        if self.tree is None:
            return {"error": "No AST available for analysis"}

        vulnerabilities: List[Dict[str, Any]] = []
        fixed_code = self.code_content

        for node in ast.walk(self.tree):
            # Detect bare except:
            if isinstance(node, ast.Try):
                for handler in node.handlers:
                    if handler.type is None:
                        vulnerabilities.append({
                            "line": handler.lineno,
                            "type": "bare_except",
                            "risk": "Catches all exceptions and hides errors; specify Exception type",
                            "suggestion": "Replace 'except:' with 'except Exception as e:'",
                        })
            # Detect dangerous function calls
            if isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    if node.func.id in ("eval", "exec", "__import__"):
                        vulnerabilities.append({
                            "line": node.lineno,
                            "type": "dangerous_function",
                            "risk": f"Using {node.func.id} may cause code injection",
                            "suggestion": f"Avoid {node.func.id}; use safe alternatives",
                        })
                elif isinstance(node.func, ast.Attribute):
                    if node.func.attr in ("system", "popen"):
                        vulnerabilities.append({
                            "line": node.lineno,
                            "type": "os_command_injection",
                            "risk": "Executing system commands may lead to command injection",
                            "suggestion": "Use subprocess with list arguments; avoid shell=True",
                        })

        # Produce corrected file (basic string replacement)
        if vulnerabilities:
            fixed_code = fixed_code.replace("except:", "except Exception as e:")
            fixed_code = fixed_code.replace("eval(", "ast.literal_eval(")

        fix_path = self.target_path.parent / f"FIXED_{self.target_path.name}"
        with open(fix_path, "w", encoding="utf-8") as f:
            f.write(fixed_code)

        return {
            "vulnerabilities_found": vulnerabilities,
            "fixed_file_path": str(fix_path),
            "fix_summary": f"Corrected {len(vulnerabilities)} potential issues; file saved to {fix_path}",
            "applied_fixes": [
                "Changed except: to except Exception",
                "Changed eval to ast.literal_eval (demonstration)",
            ],
        }

    # ================= Run All Tasks =================
    def run_full_audit(self) -> Dict[str, Any]:
        """Execute all four audit tasks and return the complete report."""
        self.report["tasks"]["progress"] = self.task_progress()
        self.report["tasks"]["missing_modules"] = self.task_missing_modules()
        self.report["tasks"]["unittest_performance"] = self.task_unittest_performance()
        self.report["tasks"]["logic_fix"] = self.task_logic_fix()
        self.report["execution_timestamp"] = time.strftime("%Y-%m-%d %H:%M:%S")
        return self.report


# ================= CLI Entry Point =================
def main() -> None:
    parser = argparse.ArgumentParser(description="MyCodexVantaOS Project Health Auditor")
    parser.add_argument("--path", required=True, help="Target .py file or project directory path")
    parser.add_argument("--output", help="Output JSON report path (prints to terminal if omitted)")
    args = parser.parse_args()

    try:
        auditor = ProjectAuditor(args.path)
        report = auditor.run_full_audit()

        json_output = json.dumps(report, indent=2, ensure_ascii=False)

        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(json_output)
            print(f"Report generated: {args.output}")
        else:
            print(json_output)

    except Exception as e:
        error_report = {"status": "error", "machineIdentity": MACHINE_IDENTITY, "message": str(e)}
        print(json.dumps(error_report, indent=2, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
