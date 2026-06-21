#!/usr/bin/env python3
"""
MyCodeXvantaOS Coverage Analysis Script
Analyzes test coverage for all 27 packages
"""

import json
import os
import re
import subprocess
from pathlib import Path

# Package jest config template
JEST_CONFIG = '''module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        target: 'ES2020',
        sourceMap: true,
        inlineSourceMap: true,
        inlineSources: true
      }
    }]
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ],
  coverageReporters: ['text', 'json'],
  testTimeout: 15000
};
'''

def create_jest_config(pkg_path):
    """Create jest.config.js for a package"""
    config_path = os.path.join(pkg_path, 'jest.config.js')
    with open(config_path, 'w') as f:
        f.write(JEST_CONFIG)

def run_coverage(pkg_path):
    """Run tests with coverage for a package"""
    try:
        result = subprocess.run(
            ['npx', 'jest', '--coverage', '--testTimeout=15000', '--silent'],
            cwd=pkg_path,
            capture_output=True,
            text=True,
            timeout=120
        )
        return result.stdout + result.stderr
    except subprocess.TimeoutExpired:
        return ""
    except Exception as e:
        return f"Error: {e}"

def parse_coverage(output):
    """Parse coverage from jest output"""
    coverage = {
        'statements': 0,
        'branches': 0,
        'functions': 0,
        'lines': 0
    }
    
    # Look for coverage table
    lines = output.split('\n')
    for line in lines:
        # Match "index.ts | 36.36 | 0 | 42.85 | 36.36"
        if 'index.ts' in line or 'All files' in line:
            parts = line.split('|')
            if len(parts) >= 5:
                try:
                    # Extract percentages
                    stmt = parts[1].strip().replace('%', '')
                    branch = parts[2].strip().replace('%', '')
                    func = parts[3].strip().replace('%', '')
                    line_cov = parts[4].strip().replace('%', '')
                    
                    # Parse numbers
                    coverage['statements'] = float(stmt) if stmt and stmt != '-' else 0
                    coverage['branches'] = float(branch) if branch and branch != '-' else 0
                    coverage['functions'] = float(func) if func and func != '-' else 0
                    coverage['lines'] = float(line_cov) if line_cov and line_cov != '-' else 0
                except (ValueError, IndexError):
                    # Ignore malformed/non-numeric coverage rows and keep searching for a valid summary line.
                    continue
                break
    
    return coverage

def main():
    base_path = Path('/workspace/mycodexvantaos')
    packages_path = base_path / 'packages'
    
    results = {}
    
    print("=" * 60)
    print("MyCodeXvantaOS Coverage Analysis")
    print("=" * 60)
    print()
    
    # Get all packages
    packages = sorted([d for d in packages_path.iterdir() if d.is_dir()])
    
    for pkg_dir in packages:
        pkg_name = pkg_dir.name
        print(f"Analyzing: {pkg_name}...", end=" ", flush=True)
        
        # Create jest config
        create_jest_config(str(pkg_dir))
        
        # Run coverage
        output = run_coverage(str(pkg_dir))
        coverage = parse_coverage(output)
        results[pkg_name] = coverage
        
        print(f"Stmts: {coverage['statements']:.1f}% | Lines: {coverage['lines']:.1f}%")
    
    print()
    print("=" * 60)
    print("Coverage Summary")
    print("=" * 60)
    
    # Calculate totals
    total_stmts = 0
    total_branches = 0
    total_functions = 0
    total_lines = 0
    count = 0
    
    print(f"\n{'Package':<30} {'Stmts':>8} {'Branch':>8} {'Funcs':>8} {'Lines':>8}")
    print("-" * 70)
    
    for pkg_name, cov in sorted(results.items()):
        print(f"{pkg_name:<30} {cov['statements']:>7.1f}% {cov['branches']:>7.1f}% {cov['functions']:>7.1f}% {cov['lines']:>7.1f}%")
        if cov['statements'] > 0:
            total_stmts += cov['statements']
            total_branches += cov['branches']
            total_functions += cov['functions']
            total_lines += cov['lines']
            count += 1
    
    print("-" * 70)
    if count > 0:
        avg_stmts = total_stmts / count
        avg_branches = total_branches / count
        avg_functions = total_functions / count
        avg_lines = total_lines / count
        print(f"{'AVERAGE':<30} {avg_stmts:>7.1f}% {avg_branches:>7.1f}% {avg_functions:>7.1f}% {avg_lines:>7.1f}%")
    
    print()
    print(f"Packages analyzed: {len(results)}")
    print(f"Packages with coverage: {count}")
    
    # Save results to JSON
    output_file = base_path / 'coverage-results.json'
    with open(output_file, 'w') as f:
        json.dump({
            'packages': results,
            'summary': {
                'average_statements': avg_stmts if count > 0 else 0,
                'average_branches': avg_branches if count > 0 else 0,
                'average_functions': avg_functions if count > 0 else 0,
                'average_lines': avg_lines if count > 0 else 0,
                'packages_analyzed': len(results),
                'packages_with_coverage': count
            }
        }, f, indent=2)
    
    print(f"\nResults saved to: {output_file}")

if __name__ == '__main__':
    main()