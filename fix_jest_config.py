#!/usr/bin/env python3
"""
Fix Jest configuration to properly handle TypeScript tests
"""
import os
import json
from pathlib import Path

def update_package_jest_config():
    """Update package.json files to use proper ts-jest configuration"""
    packages_dir = Path("/workspace/mycodexvantaos/packages")
    updated_count = 0
    
    for package_dir in packages_dir.iterdir():
        if not package_dir.is_dir():
            continue
            
        package_json = package_dir / "package.json"
        if not package_json.exists():
            continue
            
        try:
            with open(package_json, 'r') as f:
                data = json.load(f)
            
            # Update test script to use root jest config
            if 'scripts' in data:
                data['scripts']['test'] = 'jest --config ../../jest.config.js'
                updated_count += 1
                
                with open(package_json, 'w') as f:
                    json.dump(data, f, indent=2)
                    
                print(f"✓ Updated {package_dir.name}/package.json")
            
        except Exception as e:
            print(f"✗ Error updating {package_dir.name}: {e}")
    
    return updated_count

def create_jest_presets():
    """Create jest.preset.js for consistent TypeScript configuration"""
    preset_file = Path("/workspace/mycodexvantaos/jest.preset.js")
    
    preset_content = '''const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig.base.json');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
'''
    
    with open(preset_file, 'w') as f:
        f.write(preset_content)
    
    print("✓ Created jest.preset.js")
    return True

def main():
    print("Starting Jest configuration fixes...")
    
    # Update package files
    updated = update_package_jest_config()
    print(f"\nUpdated {updated} package.json files")
    
    # Create Jest preset
    create_jest_presets()
    
    print("\nJest configuration fixes complete!")
    print("Next steps:")
    print("1. Run 'pnpm install' to ensure dependencies are installed")
    print("2. Run 'pnpm test' from root directory")
    print("3. Check test results and fix any remaining issues")

if __name__ == "__main__":
    main()