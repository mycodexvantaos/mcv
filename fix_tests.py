#!/usr/bin/env python3
"""
Fix malformed test files
"""
import re
from pathlib import Path

def fix_test_file(test_file):
    """Fix malformed import statements in test files"""
    content = test_file.read_text()
    
    # Fix the malformed import: import {" Builder ... } -> import { Builder ... }
    fixed_content = re.sub(r'import \{\\?', 'import {', content)
    fixed_content = re.sub(r'\\?\}', '}', fixed_content)
    
    test_file.write_text(fixed_content)
    print(f"✅ Fixed {test_file.name}")

def main():
    packages_dir = Path("/workspace/mycodexvantaos/packages")
    
    for package_dir in packages_dir.iterdir():
        if not package_dir.is_dir():
            continue
            
        test_file = package_dir / "__tests__" / f"{package_dir.name}.test.ts"
        if test_file.exists():
            fix_test_file(test_file)

if __name__ == "__main__":
    print("Fixing test files...")
    main()
    print("Done!")