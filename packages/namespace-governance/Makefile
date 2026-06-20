# Minimal startup + verification surface for @mycodexvantaos/namespace-governance.
# Rationale: charter mandates a minimal start script (make test-fast) and a
# quick verification path.
.PHONY: install test test-fast coverage start verify rollback clean

install:
	npm install

test:
	npm test

test-fast:
	npm run test:fast

coverage:
	npm run coverage

start:
	npm start

verify:
	bash scripts/verify.sh

rollback:
	bash scripts/rollback.sh $(REF)

clean:
	rm -rf node_modules config/coverage
