#!/usr/bin/env python3
"""
Deep scan of packages/, services/, modules/, providers/ directories.

Scanning is LOCAL-FIRST: the repository checkout on disk is used by default
(no network required).  An optional --remote flag enables GitHub REST API
scanning of an arbitrary ref when a local checkout is unavailable.

Outputs JSON report + human-readable summary.
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path


# ── Local filesystem scanner ─────────────────────────────────────────────────

class LocalScanner:
    """Scan a local repository checkout — zero network dependencies."""

    def __init__(self, repo_root: Path) -> None:
        self.repo_root = repo_root

    def list_dir(self, rel_path: str) -> list[dict]:
        """Return [{name, type}] for entries in a local directory."""
        target = self.repo_root / rel_path
        if not target.is_dir():
            return []
        entries = []
        for entry in sorted(target.iterdir()):
            entries.append({
                "name": entry.name,
                "type": "dir" if entry.is_dir() else "file",
            })
        return entries

    def file_content(self, rel_path: str) -> str | None:
        """Return text content of a local file, or None if absent."""
        target = self.repo_root / rel_path
        if not target.is_file():
            return None
        try:
            return target.read_text(encoding="utf-8", errors="replace")
        except OSError as exc:
            print(f"  Warning: cannot read {rel_path}: {exc}", file=sys.stderr)
            return None


# ── Remote GitHub REST adapter ───────────────────────────────────────────────

class _ApiError(Exception):
    """Wraps a non-404 GitHub API error so callers can decide how to handle it."""
    def __init__(self, status: int, path: str) -> None:
        self.status = status
        self.path = path
        super().__init__(f"HTTP {status} for {path}")


class RemoteScanner:
    """Scan a GitHub repository via REST API (optional, network-dependent)."""

    def __init__(
        self,
        org: str,
        repo: str,
        branch: str = "main",
        token: str | None = None,
        fail_on_error: bool = True,
    ) -> None:
        self.org = org
        self.repo = repo
        self.branch = branch
        self.fail_on_error = fail_on_error
        self._incomplete = False  # set when a non-fatal error is swallowed
        self._base = f"https://api.github.com/repos/{org}/{repo}/contents"
        self._headers: dict[str, str] = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "deep-scan-script/2.0",
        }
        if token:
            self._headers["Authorization"] = "Bearer " + token
        self._delay = 0.72 if token else 60  # respect GitHub rate limits

    def _gh_get(self, rel_path: str) -> list | dict | None:
        """Perform a single GitHub API request.

        Returns parsed JSON on success, None on 404.
        Raises _ApiError for other HTTP failures.
        Raises SystemExit (via _handle_api_error) when fail_on_error=True.
        """
        url = (
            f"{self._base}/{rel_path}?ref={self.branch}"
            if rel_path
            else f"{self._base}?ref={self.branch}"
        )
        req = urllib.request.Request(url, headers=self._headers)
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                return None
            self._handle_api_error(_ApiError(exc.code, rel_path))
            return None  # reached only when fail_on_error=False
        except Exception as exc:
            print(f"  Network error for {rel_path}: {exc}", file=sys.stderr)
            self._handle_api_error(_ApiError(0, rel_path))
            return None

    def _handle_api_error(self, err: _ApiError) -> None:
        """Propagate or record an API error depending on fail_on_error."""
        if self.fail_on_error:
            print(
                f"  FATAL: {err}. Use --no-fail-on-error to treat as empty "
                f"(results will be incomplete).",
                file=sys.stderr,
            )
            sys.exit(2)
        # Non-fatal: mark report as incomplete and continue
        print(
            f"  WARNING: {err} — directory treated as empty; "
            f"report may be incomplete.",
            file=sys.stderr,
        )
        self._incomplete = True

    def list_dir(self, rel_path: str) -> list[dict]:
        """Return [{name, type}] for a remote directory."""
        time.sleep(self._delay)
        items = self._gh_get(rel_path)
        if not isinstance(items, list):
            return []
        return [{"name": i["name"], "type": i["type"]} for i in items]

    def file_content(self, rel_path: str) -> str | None:
        """Return decoded text content of a remote file."""
        url = (
            f"https://api.github.com/repos/{self.org}/{self.repo}"
            f"/contents/{rel_path}?ref={self.branch}"
        )
        req = urllib.request.Request(url, headers=self._headers)
        try:
            time.sleep(self._delay)
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode())
                if data.get("encoding") == "base64":
                    import base64
                    return base64.b64decode(
                        data["content"].replace("\n", "")
                    ).decode("utf-8", errors="replace")
        except Exception as exc:
            print(f"  Warning: cannot fetch {rel_path}: {exc}", file=sys.stderr)
        return None


# ── Scan helpers (scanner-agnostic) ─────────────────────────────────────────

SKIP_DIRS = {"node_modules", ".git", "dist", "build", "__pycache__"}


def scan_package(name: str, scanner) -> dict:
    result = {
        "name": name,
        "pkg_name": None,
        "description": None,
        "deps_count": 0,
        "has_src": False,
        "src_files": [],
        "has_dockerfile": False,
        "has_index_ts": False,
        "is_stub": False,
        "notes": [],
    }

    pkg_raw = scanner.file_content(f"packages/{name}/package.json")
    if pkg_raw:
        try:
            pkg = json.loads(pkg_raw)
            result["pkg_name"] = pkg.get("name")
            result["description"] = pkg.get("description")
            deps: dict = {}
            for section in ("dependencies", "devDependencies", "peerDependencies"):
                deps.update(pkg.get(section, {}))
            result["deps_count"] = len(deps)
        except (json.JSONDecodeError, Exception):
            result["notes"].append("package.json parse error")
    else:
        result["notes"].append("no package.json")

    top_items = scanner.list_dir(f"packages/{name}")
    result["has_dockerfile"] = any(
        i["name"].lower() == "dockerfile" for i in top_items
    )

    src_dir = [i for i in top_items if i["name"] == "src" and i["type"] == "dir"]
    if src_dir:
        src_items = scanner.list_dir(f"packages/{name}/src")
        result["src_files"] = [i["name"] for i in src_items]
        result["has_src"] = True
        real = [f for f in result["src_files"] if f != ".gitkeep"]
        result["is_stub"] = len(real) <= 1 and any(
            f in ("index.ts", "index.d.ts") for f in real
        )
        result["has_index_ts"] = "index.ts" in result["src_files"]
    else:
        result["is_stub"] = True
        result["notes"].append("no src/ dir")

    return result


def scan_service(name: str, scanner) -> dict:
    result = {
        "name": name,
        "pkg_name": None,
        "description": None,
        "deps_count": 0,
        "has_dockerfile": False,
        "has_src": False,
        "top_items": [],
        "is_http_service": False,
        "notes": [],
    }

    top_items = scanner.list_dir(f"services/{name}")
    result["top_items"] = [i["name"] for i in top_items]
    result["has_dockerfile"] = any(
        i["name"].lower() == "dockerfile" for i in top_items
    )
    result["has_src"] = any(
        i["name"] == "src" and i["type"] == "dir" for i in top_items
    )

    http_indicators = {
        "Dockerfile", "dockerfile", "server.ts", "server.js",
        "app.ts", "app.js", "main.ts", "main.js", "index.ts",
    }
    result["is_http_service"] = result["has_dockerfile"] or bool(
        set(result["top_items"]) & http_indicators
    )

    pkg_raw = scanner.file_content(f"services/{name}/package.json")
    if pkg_raw:
        try:
            pkg = json.loads(pkg_raw)
            result["pkg_name"] = pkg.get("name")
            result["description"] = pkg.get("description")
            deps: dict = {}
            for section in ("dependencies", "devDependencies"):
                deps.update(pkg.get(section, {}))
            result["deps_count"] = len(deps)
        except (json.JSONDecodeError, Exception):
            result["notes"].append("package.json parse error")
    else:
        result["notes"].append("no package.json")

    return result


def scan_module(name: str, scanner) -> dict:
    result = {
        "name": name,
        "has_ts": False,
        "has_yaml": False,
        "has_package_json": False,
        "top_items": [],
        "notes": [],
    }

    top_items = scanner.list_dir(f"modules/{name}")
    result["top_items"] = [i["name"] for i in top_items]

    yaml_exts = {".yaml", ".yml"}
    ts_exts = {".ts", ".tsx"}

    def has_ext(items: list[dict], exts: set[str]) -> bool:
        return any(Path(i["name"]).suffix in exts for i in items)

    result["has_yaml"] = has_ext(top_items, yaml_exts)
    result["has_ts"] = has_ext(top_items, ts_exts)
    result["has_package_json"] = any(i["name"] == "package.json" for i in top_items)

    return result


# ── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Deep scan of repository structure. "
            "Defaults to local filesystem scanning (no network required). "
            "Pass --remote to scan a GitHub ref via the REST API."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--repo-root",
        default=".",
        help="Path to the repository root (default: cwd). Used in local mode.",
    )
    parser.add_argument(
        "--remote",
        action="store_true",
        help=(
            "Use GitHub REST API instead of the local checkout. "
            "Requires GITHUB_TOKEN env var for authenticated rate limits."
        ),
    )
    parser.add_argument("--org", default="ai-software-engineering-guild")
    parser.add_argument("--repo-name", default="mycodexvantaos")
    parser.add_argument("--branch", default="main")
    parser.add_argument(
        "--no-fail-on-error",
        dest="fail_on_error",
        action="store_false",
        default=True,
        help=(
            "In remote mode: treat non-404 API errors as empty directories "
            "instead of exiting. The JSON report will include "
            '{"incomplete": true} when any directory could not be fetched.'
        ),
    )
    parser.add_argument(
        "--output",
        default=None,
        help=(
            "Path for the JSON report. "
            "Defaults to docs/architecture/repo-scan-report.json relative to repo root."
        ),
    )
    args = parser.parse_args()

    # Build the scanner
    if args.remote:
        token = os.environ.get("GITHUB_TOKEN")
        if not token:
            print(
                "Warning: GITHUB_TOKEN not set — unauthenticated requests are "
                "rate-limited to 60/hour.",
                file=sys.stderr,
            )
        scanner = RemoteScanner(
            org=args.org,
            repo=args.repo_name,
            branch=args.branch,
            token=token,
            fail_on_error=args.fail_on_error,
        )
        print(f"Mode: REMOTE (GitHub API, branch={args.branch})")
    else:
        repo_root = Path(args.repo_root).resolve()
        scanner = LocalScanner(repo_root)
        print(f"Mode: LOCAL (repo root={repo_root})")

    # ── STEP 1: List top-level dirs ──────────────────────────────────────────
    print("=" * 70)
    print("STEP 1: Listing packages/ top-level dirs")
    print("=" * 70)
    packages_dirs = [i["name"] for i in scanner.list_dir("packages") if i["type"] == "dir"]
    print(f"Found {len(packages_dirs)} dirs in packages/")
    print(sorted(packages_dirs))

    print("\n" + "=" * 70)
    print("STEP 2: Listing services/ top-level dirs")
    print("=" * 70)
    services_dirs = [i["name"] for i in scanner.list_dir("services") if i["type"] == "dir"]
    print(f"Found {len(services_dirs)} dirs in services/")
    print(sorted(services_dirs))

    print("\n" + "=" * 70)
    print("STEP 3: Listing modules/ top-level items")
    print("=" * 70)
    modules_items = scanner.list_dir("modules")
    modules_dirs  = [i["name"] for i in modules_items if i["type"] == "dir"]
    modules_files = [i["name"] for i in modules_items if i["type"] == "file"]
    print(f"Found {len(modules_dirs)} dirs, {len(modules_files)} files in modules/")
    print("dirs:", sorted(modules_dirs))
    print("files:", sorted(modules_files))

    print("\n" + "=" * 70)
    print("STEP 4: Listing providers/ top-level items")
    print("=" * 70)
    providers_items = scanner.list_dir("providers")
    print(f"Found {len(providers_items)} items in providers/")
    for item in sorted(providers_items, key=lambda x: x["name"]):
        print(f"  {item['type']:4s}  {item['name']}")
        if item["type"] == "dir":
            sub = scanner.list_dir(f"providers/{item['name']}")
            for s in sub:
                print(f"         {s['type']:4s}  {s['name']}")

    # ── STEP 5: Overlap analysis ─────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("STEP 5: packages/ <-> services/ overlap name analysis")
    print("=" * 70)

    service_base: dict[str, str] = {}
    for s in services_dirs:
        base = s.replace("mycodexvantaos-", "")
        service_base[base] = s

    overlap_pairs: list[tuple[str, str]] = []
    no_service: list[str] = []
    for p in sorted(packages_dirs):
        if p in service_base:
            overlap_pairs.append((p, service_base[p]))
        else:
            no_service.append(p)

    print(f"\nOVERLAP pairs ({len(overlap_pairs)}):")
    for pkg, svc in overlap_pairs:
        print(f"  packages/{pkg}  <->  services/{svc}")

    print(f"\npackages/ with NO matching service ({len(no_service)}):")
    for p in no_service:
        print(f"  packages/{p}")

    services_only = [
        s for s in services_dirs if s.replace("mycodexvantaos-", "") not in packages_dirs
    ]
    print(f"\nservices/ with NO matching package ({len(services_only)}):")
    for s in services_only:
        print(f"  services/{s}")

    # ── STEP 6: Deep scan packages ───────────────────────────────────────────
    print("\n" + "=" * 70)
    print("STEP 6: Deep scan ALL packages/ dirs")
    print("=" * 70)

    packages_data: list[dict] = []
    for i, name in enumerate(sorted(packages_dirs)):
        print(f"  [{i+1:02d}/{len(packages_dirs)}] scanning packages/{name} ...", end=" ", flush=True)
        data = scan_package(name, scanner)
        packages_data.append(data)
        stub_label = "STUB" if data["is_stub"] else "REAL"
        print(f"{stub_label}  deps={data['deps_count']}  {data['pkg_name'] or '?'}")

    # ── STEP 7: Deep scan services ───────────────────────────────────────────
    print("\n" + "=" * 70)
    print("STEP 7: Deep scan ALL services/ dirs")
    print("=" * 70)

    services_data: list[dict] = []
    for i, name in enumerate(sorted(services_dirs)):
        print(f"  [{i+1:02d}/{len(services_dirs)}] scanning services/{name} ...", end=" ", flush=True)
        data = scan_service(name, scanner)
        services_data.append(data)
        http_label = "HTTP?" if data["is_http_service"] else "     "
        df_label   = "Dockerfile" if data["has_dockerfile"] else "          "
        print(f"{http_label}  {df_label}  deps={data['deps_count']}  files={data['top_items'][:4]}")

    # ── STEP 8: Deep scan modules ─────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("STEP 8: Deep scan modules/ dirs")
    print("=" * 70)

    modules_data: list[dict] = []
    for i, name in enumerate(sorted(modules_dirs)):
        print(f"  [{i+1:02d}/{len(modules_dirs)}] scanning modules/{name} ...", end=" ", flush=True)
        data = scan_module(name, scanner)
        modules_data.append(data)
        ts_label   = "TS"   if data["has_ts"]           else "  "
        yaml_label = "YAML" if data["has_yaml"]         else "    "
        pkg_label  = "PKG"  if data["has_package_json"] else "   "
        print(f"{ts_label} {yaml_label} {pkg_label}  {data['top_items'][:5]}")

    # ── Save JSON report ──────────────────────────────────────────────────────
    incomplete = isinstance(scanner, RemoteScanner) and scanner._incomplete

    report: dict = {
        "scanned_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "mode": "remote" if args.remote else "local",
        "incomplete": incomplete,
        "packages": packages_data,
        "services": services_data,
        "modules":  modules_data,
        "overlap_pairs": overlap_pairs,
        "packages_no_service": no_service,
        "services_no_package": services_only,
    }

    if args.output:
        out_path = Path(args.output)
    elif args.remote:
        out_path = Path(__file__).parent.parent.parent / "docs/architecture/repo-scan-report.json"
    else:
        repo_root_path = Path(args.repo_root).resolve()
        out_path = repo_root_path / "docs/architecture/repo-scan-report.json"

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, indent=2) + "\n")
    print(f"\n✅ JSON report saved to: {out_path}")

    if incomplete:
        print(
            "\n⚠️  WARNING: Report is INCOMPLETE — some API errors were swallowed. "
            "Do not use this as a migration source of truth.",
            file=sys.stderr,
        )
        sys.exit(1)

    # ── Summary ───────────────────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    stub_count = sum(1 for p in packages_data if p["is_stub"])
    real_count = len(packages_data) - stub_count
    print(f"\npackages/  total={len(packages_data)}  real={real_count}  stub={stub_count}")

    http_count = sum(1 for s in services_data if s["is_http_service"])
    df_count   = sum(1 for s in services_data if s["has_dockerfile"])
    print(f"services/  total={len(services_data)}  http-service={http_count}  dockerfile={df_count}")

    ts_count   = sum(1 for m in modules_data if m["has_ts"])
    yaml_count = sum(1 for m in modules_data if m["has_yaml"])
    pkg_count  = sum(1 for m in modules_data if m["has_package_json"])
    print(f"modules/   total={len(modules_data)}  has-ts={ts_count}  has-yaml={yaml_count}  has-package.json={pkg_count}")

    print(f"\nOverlap pairs: {len(overlap_pairs)}")
    print(f"packages/ without matching service: {len(no_service)}")
    print(f"services/ without matching package: {len(services_only)}")


if __name__ == "__main__":
    main()
