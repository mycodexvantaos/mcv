.PHONY: test-fast validate-unified-gates

test-fast:
	python3 -m pytest tests/unified_gates -q

validate-unified-gates:
	python3 scripts/validate-unified-gates.py --root . --index config/unified-gates/unified-gate-index.yaml --output outputs/unified-gate-summary.json
