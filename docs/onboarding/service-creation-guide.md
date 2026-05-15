# Service Creation Guide

## Step 1: Validate the service-id

Your service-id must match: `^mycodexvantaos-[a-z0-9]+(-[a-z0-9]+)+$`

```bash
# Test your service-id
echo "mycodexvantaos-ai-reasoning" | grep -E '^mycodexvantaos-[a-z0-9]+(-[a-z0-9]+)+$'
```

## Step 2: Generate scaffold

```bash
./scripts/generate-service-scaffold.sh mycodexvantaos-ai-reasoning \
  --capabilities=llm,embedding
```

This creates:

- `services/mycodexvantaos-ai-reasoning/`
- `modules/mycodexvantaos-ai-reasoning/module-manifest.yaml`
- `packages/ai-reasoning/package.json`
- `infra/kubernetes/base/mycodexvantaos-ai-reasoning/`

## Step 3: Set lifecycle stage

Edit `modules/mycodexvantaos-ai-reasoning/module-manifest.yaml`:

- Start at `experimental`, advance through `alpha → beta → stable`

## Step 4: Validate

```bash
./scripts/validate-all.sh
```

All hard rules must pass before merging.
