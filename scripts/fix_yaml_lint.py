import os
from pathlib import Path


def fix_yaml_file(path):
    with open(path, "r") as f:
        lines = f.readlines()

    # Add --- if missing
    if not lines or not lines[0].startswith("---"):
        lines.insert(0, "---\n")

    # Fix indentation and line length for simple cases
    new_lines = []
    for line in lines:
        # Simple indentation fix for the 'validates' list which was failing
        if line.strip().startswith("- dimension:") and not line.startswith("  "):
            new_lines.append("  " + line)
        elif line.strip().startswith("description:") and not line.startswith("    "):
            new_lines.append("    " + line)
        elif line.strip().startswith("checks:") and not line.startswith("    "):
            new_lines.append("    " + line)
        else:
            new_lines.append(line)

    with open(path, "w") as f:
        f.writelines(new_lines)


def main():
    base_dirs = ["unified-gates", "config/unified-gates"]
    for base_dir in base_dirs:
        for root, dirs, files in os.walk(base_dir):
            for file in files:
                if file.endswith(".yaml"):
                    fix_yaml_file(os.path.join(root, file))
                    print(f"Fixed {os.path.join(root, file)}")


if __name__ == "__main__":
    main()
