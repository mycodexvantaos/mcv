# TODO Next

## Immediate (must complete before push)

1. [ ] **Disable yamllint `braces` and `truthy` rules** — Update `.github/linters/.yaml-lint.yml` to fully disable both rules
2. [ ] **Fix MD030 in markdown files** — Fix double spaces after list markers in:
   - `.github/instructions/example-module-instructions.md` (lines 9-14)
   - `AGENTS.md` (lines 13-16)
   - `docs/adr/adr-0011-ci-repair-agent.md` (lines 20, 27, 33, 42, 105-109)
3. [ ] **Fix MD038 in namespace-governance.md** — Remove spaces inside code span at line 10:28
4. [ ] **Fix MD058 in ci-repair-agent/README.md** — Add blank line around table at line 64
5. [ ] **Revert partial ai-humaniser.yaml expansion** — Lines 52-55 were expanded but with braces disabled, the original flow mappings are fine. Revert to keep the file consistent.
6. [ ] **Verify all local changes are correct**
7. [ ] **Commit and push to feat/unified-gate-system**

## After Push (monitor CI)

8. [ ] **Watch CI run** — Check `gh pr checks 159` for new run results
9. [ ] **Fix any remaining failures** — Iterate on any new issues
10. [ ] **Verify CodeQL check clears** — Should get fresh check-run
11. [ ] **Verify Docker Runtime Smoke Test** — Was pending, may pass after YAML fix
12. [ ] **Confirm Governance Gate passes**
13. [ ] **Confirm CI Summary passes**
14. [ ] **Confirm auto-merge triggers** — PR should auto-merge once all required checks pass

## Completion

15. [ ] **Verify PR #159 state = MERGED**
