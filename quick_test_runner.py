#!/usr/bin/env python3
"""
Quick test runner to execute tests for individual packages
"""
import subprocess
import json
from pathlib import Path

def run_package_test(package_name):
    """Run tests for a specific package"""
    print(f"\n{'='*60}")
    print(f"Testing package: {package_name}")
    print(f"{'='*60}")
    
    package_dir = f"/workspace/mycodexvantaos/packages/{package_name}"
    
    # Build the TypeScript first
    build_cmd = f"cd {package_dir} && npx tsc --noEmit"
    print(f"Building TypeScript...")
    result = subprocess.run(build_cmd, shell=True, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"❌ TypeScript compilation failed:")
        print(result.stderr[:500])
        return False
    
    print("✅ TypeScript compilation successful")
    
    # Run Jest with simple configuration
    test_cmd = f"cd {package_dir} && npx jest --no-coverage --testTimeout=10000 --passWithNoTests"
    print(f"Running tests...")
    
    try:
        result = subprocess.run(test_cmd, shell=True, capture_output=True, text=True, timeout=60)
        print(result.stdout[-500:])  # Last 500 chars
        
        if "Test Suites: 0 passed" in result.stdout and "Test Suites: 0 failed" in result.stdout:
            print("ℹ️  No tests found - need to add tests")
        elif "Test Suites: 1 failed" in result.stdout:
            print("❌ Tests failed")
            return False
        elif "PASS" in result.stdout:
            print("✅ Tests passed!")
            return True
            
    except subprocess.TimeoutExpired:
        print("⏰ Test timed out")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True

def main():
    """Run tests for a subset of packages to validate infrastructure"""
    # Test a few representative packages first
    priority_packages = [
        'builder',
        'runtime', 
        'storage',
        'events',
        'monitoring'
    ]
    
    results = {}
    for package in priority_packages:
        try:
            success = run_package_test(package)
            results[package] = success
        except Exception as e:
            print(f"❌ Error testing {package}: {e}")
            results[package] = False
    
    print(f"\n{'='*60}")
    print("TEST RESULTS SUMMARY")
    print(f"{'='*60}")
    for package, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {package}")
    
    passed = sum(1 for s in results.values() if s)
    total = len(results)
    print(f"\nTotal: {passed}/{total} passed")

if __name__ == "__main__":
    main()