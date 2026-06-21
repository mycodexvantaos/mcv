import os
import re


def main():
    with open("/home/ubuntu/upload/pasted_content.txt", "r") as f:
        content = f.read()

    # 使用正則表達式尋找路徑標記
    # 例如：=== path: .github/workflows/lint-code-base.yml ===
    pattern = r"===\s+path:\s+(.*?)\s+===\n(.*?)(?=\n===\s+path:|\n===\s*$|$)"
    matches = re.finditer(pattern, content, re.DOTALL)

    for match in matches:
        path = match.group(1).strip()
        file_content = match.group(2)

        # 移除可能存在的多餘前導/後隨換行
        if file_content.startswith("\n"):
            file_content = file_content[1:]

        full_path = os.path.join(os.path.expanduser("~/mycodexvantaos"), path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)

        with open(full_path, "w") as f:
            f.write(file_content)
        print(f"Applied content to {path}")


if __name__ == "__main__":
    main()
