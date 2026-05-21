# Autopilot Workflow Instructions

## Pre-Flight Checklist

Before starting any autonomous task, verify:

1. You are on a feature branch (not `main`)
2. The working tree is clean (`git status` shows no uncommitted changes)
3. Dependencies are installed (`node_modules/` exists)

## Standard Autopilot Workflow

### Step 1: Understand the Task
- Read relevant source files without making changes
- Identify affected modules and dependencies
- Check for existing tests or documentation

### Step 2: Plan (for complex tasks)
- Create a structured implementation plan
- Identify potential risks or breaking changes
- Estimate the scope of changes (number of files, modules affected)

### Step 3: Implement
- Make changes incrementally, one logical unit at a time
- Run `npm run typecheck` after each significant change
- Keep commits atomic and well-described

### Step 4: Validate
- Run full validation: `npm run typecheck && npm run format:check`
- Run governance checks: `npm run governance:check`
- Verify no regressions in existing functionality

### Step 5: Commit and Report
- Use conventional commit messages
- Summarize what was done and any decisions made
- Note any follow-up tasks or known limitations

## Handling Failures

If `npm run typecheck` fails:
- Read the error messages carefully
- Fix type errors in the order they appear
- Re-run validation after each fix

If `npm run governance:check` fails:
- Review governance rules in `tools/governance/`
- Ensure changes comply with platform policies
- Ask for guidance if governance rules conflict with the task

## Session Management

- Use `/compact` if context becomes too large
- Use `/clear` between unrelated tasks
- Save important findings to session files for reference
