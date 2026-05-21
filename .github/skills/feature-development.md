# Skill: Feature Development

## Description

This skill guides Copilot through the standard feature development workflow for the mycodexvantaos platform.

## Workflow

### 1. Create Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feat/<feature-name>
```

### 2. Explore Existing Code

Before writing code, understand the relevant parts of the codebase:
- Read related source files
- Check existing patterns and conventions
- Identify affected modules

### 3. Plan Implementation

For complex features, create a plan:
```
/plan <description of the feature>
```

### 4. Implement

- Write TypeScript with strict mode
- Follow existing patterns in the codebase
- Add JSDoc comments for public APIs
- Keep changes focused and atomic

### 5. Validate

```bash
npm run typecheck
npm run format:check
npm run governance:check
```

### 6. Commit

```bash
git add -A
git commit -m "feat: <concise description>"
```

### 7. Create Pull Request

```bash
gh pr create --title "feat: <description>" --body "<detailed description>"
```

## Conventions

- Branch naming: `feat/<feature-name>`, `fix/<bug-name>`, `docs/<topic>`
- Commit messages: conventional commits format
- PR descriptions: include what, why, and how
- Always request review before merging
