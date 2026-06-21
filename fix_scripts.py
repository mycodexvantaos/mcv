scripts_path = "/home/ubuntu/mycodexvantaos/scripts/ci/stable_lint_gate.py"
tests_path = "/home/ubuntu/mycodexvantaos/tests/ci/test_stable_lint_gate.py"

# 修復 scripts/ci/stable_lint_gate.py (補全最後幾行)
with open(scripts_path, "r") as f:
    lines = f.readlines()
# 移除可能出錯的最後一行（如果是截斷的）
if "detect_probable_yaml_duplicate_keys" in lines[-1]:
    pass  # 邏輯可能需要更細緻，但我們先嘗試覆蓋

# 直接寫入正確的結尾
with open(scripts_path, "a") as f:
    # 如果文件在中間斷掉，我們需要補齊
    pass
