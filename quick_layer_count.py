#!/usr/bin/env python3
"""Quick layer coverage counter"""

import os
import json
from pathlib import Path

# Define layer structure
layer_structure = {
    "Layer A (Builder)": [
        "api-generator", "schema-generator", "workflow-generator", 
        "test-generator", "deployment-manifest-generator", "ui-generator"
    ],
    "Layer B (Runtime)": [
        "execution", "session-runtime", "background-job-runtime", 
        "scheduler", "plugin-loader"
    ],
    "Layer C (Native Services)": [
        "native-queue", "native-logging", "native-validation",
        "cache-manager", "search-engine", "analytics", "advanced-monitoring"
    ],
    "Layer D (Connector)": [
        "connector-github", "connector-redis", "connector-postgresql",
        "connector-s3", "connector-auth", "connector-kafka", 
        "connector-elastic", "connector-mongodb"
    ],
    "Layer E (Deployment)": [
        "auto-scaler", "load-balancer", "ssl-manager"
    ],
    "Layer F (Governance)": [
        "audit-logger", "compliance-checker", "policy-engine"
    ]
}

packages_dir = Path("/workspace/mycodexvantaos/packages")

# Count existing packages
existing_packages = set()
if packages_dir.exists():
    for item in packages_dir.iterdir():
        if item.is_dir() and not item.name.startswith('.'):
            # Check if it has package.json
            if (item / "package.json").exists():
                existing_packages.add(item.name)

# Analyze each layer
total_components = 0
total_existing = 0
layer_results = {}

for layer_name, components in layer_structure.items():
    layer_total = len(components)
    layer_existing = len([c for c in components if c in existing_packages])
    layer_percentage = (layer_existing / layer_total * 100) if layer_total > 0 else 0
    
    layer_results[layer_name] = {
        "total": layer_total,
        "existing": layer_existing,
        "percentage": layer_percentage,
        "missing": [c for c in components if c not in existing_packages]
    }
    
    total_components += layer_total
    total_existing += layer_existing

# Calculate overall percentage
overall_percentage = (total_existing / total_components * 100) if total_components > 0 else 0

# Print results
print("=" * 60)
print("LAYER COVERAGE ANALYSIS")
print("=" * 60)
print(f"\nOverall: {total_existing}/{total_components} components ({overall_percentage:.1f}%)\n")

for layer_name, result in layer_results.items():
    status = "✓" if result["percentage"] == 100 else "✗"
    print(f"{status} {layer_name}: {result['existing']}/{result['total']} ({result['percentage']:.0f}%)")
    if result["missing"]:
        print(f"  Missing: {', '.join(result['missing'])}")

print("\n" + "=" * 60)

# Identify missing components
all_missing = []
for layer_name, result in layer_results.items():
    all_missing.extend(result["missing"])

if all_missing:
    print(f"\n🔍 Missing components ({len(all_missing)}):")
    for component in all_missing:
        print(f"  - {component}")
else:
    print(f"\n🎉 All {total_components} components are present!")

print("=" * 60)

# Save results to JSON
results = {
    "overall_coverage": round(overall_percentage, 1),
    "total_components": total_components,
    "existing_components": total_existing,
    "missing_components": all_missing,
    "layers": {
        name: {
            "coverage": round(result["percentage"], 1),
            "total": result["total"],
            "existing": result["existing"],
            "missing": result["missing"]
        }
        for name, result in layer_results.items()
    }
}

output_file = Path("/workspace/mycodexvantaos/docs/analysis/quick-layer-coverage.json")
output_file.parent.mkdir(parents=True, exist_ok=True)
with open(output_file, 'w') as f:
    json.dump(results, f, indent=2)

print(f"\n💾 Results saved to {output_file}")