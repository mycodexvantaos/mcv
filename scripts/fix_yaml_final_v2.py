import os
import yaml


def fix_yaml_file(path):
    try:
        with open(path, "r") as f:
            content = f.read()

        # Strip markers and clean up
        content = content.replace("---", "").strip()
        if not content:
            return

        data = yaml.safe_load(content)
        if not data:
            return

        # Standardize the 'validates' field if it's there
        if "validates" in data and isinstance(data["validates"], list):
            new_validates = []
            for item in data["validates"]:
                if isinstance(item, str):
                    new_validates.append(
                        {
                            "dimension": item,
                            "description": f"Validation for {item}",
                            "checks": [],
                        }
                    )
                else:
                    new_validates.append(item)
            data["validates"] = new_validates

        # Dump with clean formatting
        fixed_content = "---\n" + yaml.dump(
            data, default_flow_style=False, sort_keys=False, indent=2, width=120
        )

        with open(path, "w") as f:
            f.write(fixed_content)
        print(f"Fixed {path}")
    except Exception as e:
        print(f"Error fixing {path}: {e}")


def main():
    base_dirs = ["unified-gates", "config/unified-gates"]
    for base_dir in base_dirs:
        for root, dirs, files in os.walk(base_dir):
            for file in files:
                if file.endswith(".yaml"):
                    fix_yaml_file(os.path.join(root, file))


if __name__ == "__main__":
    main()
