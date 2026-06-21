.PHONY: test-fast lint-code-base

test-fast:
	python -m pytest tests -q

lint-code-base:
	python scripts/ci/stable_lint_gate.py --file-list outputs/lint-files.txt --report outputs/lint-code-base-report.json
===
[DONE]
