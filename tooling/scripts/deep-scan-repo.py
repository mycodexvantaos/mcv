#!/usr/bin/env python3
"""
Deep scan of packages/, services/, modules/, providers/ directories
via GitHub REST API v3 (authenticated).

Outputs JSON report + human-readable summary.
"""

import json
import os
import time
import sys
import urllib.request
import urllib.error
from pathlib import Path

# ── Config ─────────────────────────────────────────────────────────────────
ORG   = "ai-software-engineering-guild"
REPO  = "mycodexvantaos"
BRANCH = "main"
BASE  = f"https://api.github.com/repos/{ORG}/{REPO}/contents"
HEADERS = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "deep-scan-script/1.0",
}
if github_token := os.environ.get("GITHUB_TOKEN"):
    HEADERS["Authorization"] = f"Bearer {github_token}"
DELAY = 0.72 if github_token else 60  # GitHub API rate limits per hour

# ── Helpers ─────────────────────────────────────────────────────────────────
def gh_get(path: str) -> list | dict | None:
    url = f"{BASE}/{path}?ref={BRANCH}" if path else f"{BASE}?ref={BRANCH}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        print(f"  HTTP {e.code} for {path}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"  Error for {path}: {e}", file=sys.stderr)
        return None

def file_content(path: str) -> str | None:
    url = f"https://api.github.com/repos/{ORG}/{REPO}/contents/{path}?ref={BRANCH}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            if data.get("encoding") == "base64":
                import base64
                return base64.b64decode(data["content"].replace("\n","")).decode("utf-8", errors="replace")
            return None
    except:
        return None

def list_dir(path: str) -> list[dict]:
    """Return list of {name, type} dicts for a directory."""
    items = gh_get(path)
    if not isinstance(items, list):
        return []
    return [{"name": i["name"], "type": i["type"]} for i in items]

def has_real_ts(items: list[dict], prefix: str) -> bool:
    """Check if src/ has actual .ts files (not just gitkeep)."""
    src_items = [i for i in items if i["name"] not in (".gitkeep", "index.ts", "index.d.ts")]
    return len(src_items) > 0

# ── Scan functions ───────────────────────────────────────────────────────────

def scan_package(name: str) -> dict:
    """Scan a single packages/<name> directory."""
    result = {"name": name, "pkg_name": None, "description": None,
              "deps_count": 0, "has_src": False, "src_files": [],
              "has_dockerfile": False, "has_index_ts": False,
              "is_stub": False, "notes": []}
    time.sleep(DELAY)

    # read package.json
    pkg_raw = file_content(f"packages/{name}/package.json")
    if pkg_raw:
        try:
            pkg = json.loads(pkg_raw)
            result["pkg_name"] = pkg.get("name")
            result["description"] = pkg.get("description")
            deps = {}
            deps.update(pkg.get("dependencies", {}))
            deps.update(pkg.get("devDependencies", {}))
            deps.update(pkg.get("peerDependencies", {}))
            result["deps_count"] = len(deps)
        except:
            result["notes"].append("package.json parse error")
    else:
        result["notes"].append("no package.json")

    time.sleep(DELAY)
    # check src/
    top_items = list_dir(f"packages/{name}")
    result["has_dockerfile"] = any(i["name"].lower() == "dockerfile" for i in top_items)

    src_dir = [i for i in top_items if i["name"] == "src" and i["type"] == "dir"]
    if src_dir:
        time.sleep(DELAY)
        src_items = list_dir(f"packages/{name}/src")
        result["src_files"] = [i["name"] for i in src_items]
        result["has_src"] = True
        real = [f for f in result["src_files"] if f not in (".gitkeep",)]
        result["is_stub"] = (len(real) <= 1 and any(f in ("index.ts", "index.d.ts") for f in real))
        result["has_index_ts"] = "index.ts" in result["src_files"]
    else:
        result["is_stub"] = True
        result["notes"].append("no src/ dir")

    return result


def scan_service(name: str) -> dict:
    """Scan a single services/<name> directory."""
    result = {"name": name, "pkg_name": None, "description": None,
              "deps_count": 0, "has_dockerfile": False, "has_src": False,
              "top_items": [], "is_http_service": False, "notes": []}
    time.sleep(DELAY)

    top_items = list_dir(f"services/{name}")
    result["top_items"] = [i["name"] for i in top_items]
    result["has_dockerfile"] = any(i["name"].lower() == "dockerfile" for i in top_items)
    result["has_src"] = any(i["name"] == "src" and i["type"] == "dir" for i in top_items)

    # Heuristics for HTTP service
    http_indicators = {"Dockerfile", "dockerfile", "server.ts", "server.js",
                       "app.ts", "app.js", "main.ts", "main.js", "index.ts"}
    result["is_http_service"] = result["has_dockerfile"] or \
        bool(set(result["top_items"]) & http_indicators)

    time.sleep(DELAY)
    pkg_raw = file_content(f"services/{name}/package.json")
    if pkg_raw:
        try:
            pkg = json.loads(pkg_raw)
            result["pkg_name"] = pkg.get("name")
            result["description"] = pkg.get("description")
            deps = {}
            deps.update(pkg.get("dependencies", {}))
            deps.update(pkg.get("devDependencies", {}))
            result["deps_count"] = len(deps)
        except:
            result["notes"].append("package.json parse error")
    else:
        result["notes"].append("no package.json")

    return result


def scan_module(name: str) -> dict:
    """Scan a single modules/<name> directory."""
    result = {"name": name, "has_ts": False, "has_yaml": False,
              "has_package_json": False, "top_items": [], "notes": []}
    time.sleep(DELAY)

    top_items = list_dir(f"modules/{name}")
    if not top_items and not isinstance(gh_get(f"modules/{name}"), list):
        # might be a file not dir
        result["notes"].append("not a directory (may be file)")
        return result

    result["top_items"] = [i["name"] for i in top_items]

    yaml_exts  = {".yaml", ".yml"}
    ts_exts    = {".ts", ".tsx"}

    def has_ext(items, exts):
        return any(Path(i["name"]).suffix in exts for i in items)

    result["has_yaml"]         = has_ext(top_items, yaml_exts)
    result["has_ts"]           = has_ext(top_items, ts_exts)
    result["has_package_json"] = any(i["name"] == "package.json" for i in top_items)

    return result


# ── Main scan ────────────────────────────────────────────────────────────────

def main():
    print("=" * 70)
    print("STEP 1: Listing packages/ top-level dirs")
    print("=" * 70)
    packages_dirs = [i["name"] for i in list_dir("packages") if i["type"] == "dir"]
    print(f"Found {len(packages_dirs)} dirs in packages/")
    print(sorted(packages_dirs))

    print("\n" + "=" * 70)
    print("STEP 2: Listing services/ top-level dirs")
    print("=" * 70)
    services_dirs = [i["name"] for i in list_dir("services") if i["type"] == "dir"]
    print(f"Found {len(services_dirs)} dirs in services/")
    print(sorted(services_dirs))

    print("\n" + "=" * 70)
    print("STEP 3: Listing modules/ top-level items")
    print("=" * 70)
    modules_items = list_dir("modules")
    modules_dirs  = [i["name"] for i in modules_items if i["type"] == "dir"]
    modules_files = [i["name"] for i in modules_items if i["type"] == "file"]
    print(f"Found {len(modules_dirs)} dirs, {len(modules_files)} files in modules/")
    print("dirs:", sorted(modules_dirs))
    print("files:", sorted(modules_files))

    print("\n" + "=" * 70)
    print("STEP 4: Listing providers/ top-level items")
    print("=" * 70)
    providers_items = list_dir("providers")
    print(f"Found {len(providers_items)} items in providers/")
    for item in sorted(providers_items, key=lambda x: x["name"]):
        print(f"  {item['type']:4s}  {item['name']}")
        if item["type"] == "dir":
            time.sleep(DELAY)
            sub = list_dir(f"providers/{item['name']}")
            for s in sub:
                print(f"         {s['type']:4s}  {s['name']}")

    # ── Overlap analysis ──────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("STEP 5: packages/ <-> services/ overlap name analysis")
    print("=" * 70)

    # Strip "mycodexvantaos-" prefix from services
    service_base = {}
    for s in services_dirs:
        base = s.replace("mycodexvantaos-", "")
        service_base[base] = s

    overlap_pairs = []
    no_service = []
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

    services_only = [s for s in services_dirs if s.replace("mycodexvantaos-","") not in packages_dirs]
    print(f"\nservices/ with NO matching package ({len(services_only)}):")
    for s in services_only:
        print(f"  services/{s}")

    # ── Deep scan selected packages ──────────────────────────────────────
    print("\n" + "=" * 70)
    print("STEP 6: Deep scan ALL packages/ dirs (package.json + src check)")
    print("=" * 70)

    packages_data = []
    for i, name in enumerate(sorted(packages_dirs)):
        print(f"  [{i+1:02d}/{len(packages_dirs)}] scanning packages/{name} ...", end=" ", flush=True)
        data = scan_package(name)
        packages_data.append(data)
        stub_label = "STUB" if data["is_stub"] else "REAL"
        print(f"{stub_label}  deps={data['deps_count']}  {data['pkg_name'] or '?'}")

    # ── Deep scan services ──────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("STEP 7: Deep scan ALL services/ dirs")
    print("=" * 70)

    services_data = []
    for i, name in enumerate(sorted(services_dirs)):
        print(f"  [{i+1:02d}/{len(services_dirs)}] scanning services/{name} ...", end=" ", flush=True)
        data = scan_service(name)
        services_data.append(data)
        http_label = "HTTP?" if data["is_http_service"] else "     "
        df_label   = "Dockerfile" if data["has_dockerfile"] else "          "
        print(f"{http_label}  {df_label}  deps={data['deps_count']}  files={data['top_items'][:4]}")

    # ── Deep scan modules ──────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("STEP 8: Deep scan modules/ dirs")
    print("=" * 70)

    modules_data = []
    for i, name in enumerate(sorted(modules_dirs)):
        print(f"  [{i+1:02d}/{len(modules_dirs)}] scanning modules/{name} ...", end=" ", flush=True)
        data = scan_module(name)
        modules_data.append(data)
        ts_label   = "TS"   if data["has_ts"]   else "  "
        yaml_label = "YAML" if data["has_yaml"] else "    "
        pkg_label  = "PKG"  if data["has_package_json"] else "   "
        print(f"{ts_label} {yaml_label} {pkg_label}  {data['top_items'][:5]}")

    # ── Save JSON report ───────────────────────────────────────────────
    report = {
        "scanned_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "branch": BRANCH,
        "packages": packages_data,
        "services": services_data,
        "modules":  modules_data,
        "overlap_pairs": overlap_pairs,
        "packages_no_service": no_service,
        "services_no_package": services_only,
    }

    out_path = Path(__file__).parent.parent.parent / "docs/architecture/repo-scan-report.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, indent=2) + "\n")
    print(f"\n✅ JSON report saved to: {out_path}")

    # ── Summary ────────────────────────────────────────────────────────
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
