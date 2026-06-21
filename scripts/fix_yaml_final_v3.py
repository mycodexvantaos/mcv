import os
from pathlib import Path

import yaml


def fix_yaml_file(path):
    try:
        with open(path, 'r') as f:
            content = f.read()
        
        content = content.replace('---', '').strip()
        if not content: return

        data = yaml.safe_load(content)
        if not data: return
            
        # Standardize the 'validates' field
        if 'validates' in data and isinstance(data['validates'], list):
            new_validates = []
            for item in data['validates']:
                if isinstance(item, str):
                    new_validates.append({
                        "dimension": item,
                        "description": f"Validation for {item}",
                        "checks": []
                    })
                else:
                    # Ensure all required fields are present for each validate target
                    new_item = {
                        "dimension": item.get("dimension", "unknown"),
                        "description": item.get("description", "no description"),
                        "checks": item.get("checks", [])
                    }
                    new_validates.append(new_item)
            data['validates'] = new_validates

        # Dump with explicit formatting
        # Using default_flow_style=False ensures it's in block format
        fixed_content = "---\n" + yaml.dump(data, default_flow_style=False, sort_keys=False, indent=2)
        
        with open(path, 'w') as f:
            f.write(fixed_content)
        print(f"Fixed {path}")
    except Exception as e:
        print(f"Error fixing {path}: {e}")

def main():
    base_dirs = ['unified-gates', 'config/unified-gates']
    for base_dir in base_dirs:
        for root, dirs, files in os.walk(base_dir):
            for file in files:
                if file.endswith('.yaml'):
                    fix_yaml_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
