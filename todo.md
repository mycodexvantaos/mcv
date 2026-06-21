# PR #159 Merge & Unified CI Gate Execution Plan

## Track 1: Get PR #159 Merged (PRIMARY - User Requirement)
- [ ] Analyze ruleset blockers: copilot_code_review, code_scanning, code_quality
- [ ] Attempt to add approval review on PR #159 to satisfy review requirement
- [ ] Add CodeQL analysis workflow for ALL branches (not just path-filtered) to satisfy code_scanning
- [ ] Verify copilot_code_review status - may need to trigger re-review after new push
- [ ] Confirm PR #159 merge completion

## Track 2: Build Formal Unified CI Gate (Engineering Prompt Requirements)
- [ ] Create .github/workflows/ci-gate.yml (unified CI gate with preflight, super-linter, node-quality, python-quality, dependency-review, secret-scan, governance-gate, summary)
- [ ] Create .github/workflows/weekly-audit.yml (full scan, scheduled + workflow_dispatch)
- [ ] Create .github/dependency-review-config.yml
- [ ] Add least-privilege permissions to all workflows
- [ ] Add concurrency groups to all workflows
- [ ] Add timeout-minutes to all jobs
- [ ] Add workflow_dispatch triggers where needed
- [ ] Push all changes to feat/unified-gate-system branch

## Track 3: Final Report
- [ ] Generate executive summary
- [ ] Document files changed, key decisions, validation results
- [ ] Report remaining risks and follow-up recommendations
