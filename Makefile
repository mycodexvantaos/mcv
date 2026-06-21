# MyCodeXvantaOS Unified Gate System Makefile

.PHONY: test-fast validate-unified-gates validate-gates check-production-readiness test-gates pre-commit

test-fast:
	python3 -m pytest tests/unified_gates -q

validate-unified-gates:
	python3 scripts/validate-unified-gates.py --root . --index config/unified-gates/unified-gate-index.yaml --output outputs/unified-gate-summary.json

validate-gates:
	@echo "Validating Unified Gate System..."
	python3 scripts/validate-unified-gates.py --root . --index config/unified-gates/unified-gate-index.yaml --output outputs/unified-gate-summary.json

check-production-readiness:
	@echo "Checking Production Readiness Gates..."
	python3 scripts/validate-unified-gates.py --root . --index config/unified-gates/unified-gate-index.yaml --output outputs/unified-gate-summary.json

test-gates:
	@echo "Running Gate System Tests..."
	pytest tests/unified_gates/

pre-commit: validate-gates
	@echo "Pre-commit checks passed"
