# Naming Quick Start

> Based on naming-spec-v1.md

## The Three Layers

| Layer             | Separator    | Example                                                      |
| ----------------- | ------------ | ------------------------------------------------------------ |
| Canonical         | `-`          | `mycodexvantaos-ai-embedding`                                |
| Composite         | `--`         | `mycodexvantaos-ai-memory--memories--bge-small-384`          |
| Protocol-specific | per-protocol | `@mycodexvantaos/ai-embedding`, `MYCODEXVANTAOS_LLM_API_KEY` |

## Creating a New Service

1. Choose a service-id: `mycodexvantaos-<domain>-<capability>`
2. Run: `./scripts/generate-service-scaffold.sh mycodexvantaos-<domain>-<capability>`
3. Fill in `modules/mycodexvantaos-<domain>-<capability>/module-manifest.yaml`
4. Validate: `./scripts/validate-all.sh`

## The 19 Canonical Capabilities

`database` · `storage` · `auth` · `queue` · `state-store` · `secrets` · `repo` · `deploy` ·
`validation` · `security` · `observability` · `notification` · `scheduler` · `vector-store` ·
`embedding` · `llm` · `graph` · `cache` · `search`

## Common Mistakes

| Wrong                              | Right                                               | Rule |
| ---------------------------------- | --------------------------------------------------- | ---- |
| `mycodexvantaos-ai-embedding-v2`   | `mycodexvantaos-ai-embedding` (version in metadata) | 3.6  |
| `mycodexvantaos-ai-embedding-prod` | namespace: mycodexvantaos-prod                      | 3.7  |
| `postgres-database`                | `database-postgres`                                 | 8.2  |
| `ORCH_DATABASE_URL`                | `MYCODEXVANTAOS_DATABASE_URL`                       | 7.2  |
