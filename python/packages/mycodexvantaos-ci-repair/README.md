# mycodexvantaos-ci-repair

CI Repair Engine — GitHub Actions failure analysis, error classification & repair patch generation for MyCodeXvantaOS.

## Features

- **Log Parser**: Bottom-up regex-based classification of CI failure logs into 10 error categories
- **Repair Engine**: Generates actionable repair plans with auto-fix vs manual review classification
- **GitHub Client**: Async API client for fetching workflow runs, jobs, and logs
- **Database Client**: PostgreSQL persistence for analysis history and statistics

## Error Categories

| Category | Auto-fixable |
|---|---|
| dependency_error | ✅ |
| lint_error | ✅ |
| test_failure | ❌ |
| build_error | ❌ |
| docker_build_error | ❌ |
| deployment_error | ❌ |
| permission_error | ❌ |
| configuration_error | ❌ |
| timeout_error | ❌ |
| unknown_error | ❌ |
