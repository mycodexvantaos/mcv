# Provider Registration Guide

## Adding a New Provider Instance

1. Choose a canonical capability from 5.5
2. Name your provider: `<capability>-<provider-name>` (capability FIRST)
3. Create the directory: `providers/<capability>/<capability>-<provider-name>/`
4. Add `provider-manifest.yaml` (validate against `schemas/provider-manifest.schema.json`)
5. Add `config.schema.json`
6. Register in `governance/provider-registry.yaml`
7. Update `catalog/provider-map.yaml`

## Example

Adding a new vector-store provider `weaviate`:

```
providers/
  vector-store/
    vector-store-weaviate/        ← instance name: vector-store-weaviate
      provider-manifest.yaml
      config.schema.json
```

`provider-manifest.yaml` must have:

```yaml
metadata:
  name: vector-store-weaviate    ← <capability>-<provider>
  capability: vector-store       ← from canonical set 5.5
```
