import os
import yaml


# Custom dumper to force 2-space indentation for lists
class MyDumper(yaml.SafeDumper):
    def increase_indent(self, flow=False, indentless=False):
        return super(MyDumper, self).increase_indent(flow, False)


def fix_yaml_file(path):
    with open(path, "r") as f:
        content = f.read()

    if content.startswith("---\n"):
        content = content[4:]

    try:
        data = yaml.safe_load(content)
        if data is None:
            return

        fixed_content = "---\n" + yaml.dump(
            data,
            Dumper=MyDumper,
            default_flow_style=False,
            sort_keys=False,
            indent=2,
            width=120,
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
