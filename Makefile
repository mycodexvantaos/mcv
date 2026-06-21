# MyCodeXvantaOS Unified Gate System Makefile

.PHONY: validate-gates
validate-gates:
	@echo "Validating Unified Gate System..."
	python3 scripts/unified_gates/validator.py \
		--gate-index unified-gates/gate/unified-gate-index.yaml \
		--strict

.PHONY: check-production-readiness
check-production-readiness:
	@echo "Checking Production Readiness Gates..."
	python3 scripts/unified_gates/validator.py \
		--gate-index unified-gates/gate/unified-gate-index.yaml \
		--check-blocking \
		--fail-on-error

.PHONY: test-gates
test-gates:
	@echo "Running Gate System Tests..."
	pytest tests/unified_gates/

.PHONY: pre-commit
pre-commit: validate-gates
	@echo "Pre-commit checks passed"
