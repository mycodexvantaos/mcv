# PR #159 Merge & Complete Workflow Restructuring

## Phase 1: Create All Reference Workflow Files

- [x] unified-ci.yaml (created)
- [x] codeql.yml (created - CodeQL Advanced v4 with matrix)
- [x] security-scan.yaml (created - CLI-based)
- [x] dependency-review.yaml (created)
- [x] unified-cd.yaml (created)
- [x] release-consolidated.yaml (created)
- [x] ci-repair-agent.yml (created)
- [x] weekly-audit.yml (rewritten - CLI-based)
- [ ] semgrep.yaml standalone scanner
- [ ] trivy-scan.yaml standalone scanner
- [ ] checkov-scan.yaml standalone scanner
- [ ] gitleaks.yaml standalone scanner
- [ ] governance-check.yml
- [ ] policy-check.yml
- [ ] freeze-gate.yaml
- [ ] audit-check.yml
- [ ] release-candidate-check.yml
- [ ] docker-smoke.yml
- [ ] cache.yml
- [ ] sbom-upload.yaml
- [ ] provenance-attest.yaml
- [ ] sign-release.yaml
- [ ] Other reference workflows (ci.yml, cd.yml, testing.yml, etc.)

## Phase 2: Config & Support Files

- [ ] Update codeql-config.yml to match reference
- [ ] Update dependency-review-config.yml
- [ ] Add .github/hooks/ (security.json, quality-gates.json)
- [ ] Add .github/agents/ (code-review, refactor, ci-repair, docs)
- [ ] Add .github/copilot/ (settings.json)
- [ ] Add .github/copilot-instructions.md
- [ ] Add .github/copilot-config.md
- [ ] Add .github/dependabot.yml
- [ ] Add .github/release-drafter.yml
- [ ] Add .github/skills/ (platform-deploy, governance-compliance, feature-development)
- [ ] Add .github/instructions/ (architecture, security, etc.)
- [ ] Update super-linter.yml with proper VALIDATE\_\* settings

## Phase 3: Cleanup & Fixes

- [ ] Delete old ci-gate.yml (superseded by unified structure)
- [ ] Remove quick_test_runner.py (shell=True security issue)
- [ ] Fix shell injection in remaining workflows

## Phase 4: Commit, Push & Monitor CI

- [ ] Commit all changes
- [ ] Push to feat/unified-gate-system branch
- [ ] Monitor CI results on PR #159
- [ ] Fix any remaining CI failures

## Phase 5: Resolve Ruleset Blockers & Merge

- [ ] Verify all ruleset checks pass (copilot_code_review, code_scanning, code_quality)
- [ ] Address copilot_code_review if still blocked
- [ ] Confirm PR #159 merge completion

## Phase 6: Final Report

- [ ] Executive summary and deliverables
