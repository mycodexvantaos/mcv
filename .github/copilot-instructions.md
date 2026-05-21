# Copilot Instructions for mycodexvantaos

## Build Commands

- `npm run build` — Build the Next.js project
- `npm run dev` — Start development server with Turbopack on port 9002
- `npm run lint` — Run TypeScript type checking (tsc --noEmit)
- `npm run typecheck` — Run TypeScript type checking
- `npm run format` — Format code with Prettier
- `npm run format:check` — Check code formatting
- `npm run deploy` — Build and deploy to Cloudflare
- `npm run validate` — Run typecheck validation
- `npm run contracts:validate` — Validate contracts SDK
- `npm run governance:check` — Run governance checks

## Code Style

- Use TypeScript strict mode throughout the project
- Prefer functional components over class components
- Use Next.js App Router conventions
- Always add JSDoc comments for public APIs
- Follow Prettier formatting rules (run `npm run format` before committing)
- Use ES module imports (import/export syntax)
- Prefer `const` over `let`; avoid `var`

## Architecture

- This is a Next.js application deployed on Cloudflare via OpenNext
- Uses Genkit for AI capabilities (`src/ai/`)
- Follows a modular monorepo structure with packages in `packages/`
- Services are defined in `services/`
- Governance and policy checks are in `tools/governance/`
- Infrastructure as code is in `infra/`

## Workflow

- Run `npm run typecheck && npm run format:check` after making changes
- Commit messages follow conventional commits format (e.g., `feat:`, `fix:`, `docs:`, `chore:`)
- Create feature branches from `main`
- Always run governance checks before submitting PRs: `npm run governance:check`
- Validate contracts after modifying SDK: `npm run contracts:validate`

## Testing

- Tests are not yet fully configured; add tests when implementing new features
- Use Jest for unit testing
- Place test files in `__tests__/` directory or co-locate with source files using `.test.ts` suffix

## Security

- Never commit secrets or API keys
- Use environment variables for all credentials
- Follow the security guidelines in `SECURITY.md`
