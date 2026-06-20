#!/usr/bin/env python3
"""Generate Sec.16 Python packages, Sec.20 runtimes/local, Sec.21 Cloudflare providers, Sec.22 apps"""
import os

BASE = "/workspace/mycodexvantaos"
created = 0
skipped = 0

def write(path, content):
    global created, skipped
    full = os.path.join(BASE, path)
    if os.path.exists(full):
        skipped += 1
        return
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(content)
    created += 1
    print(f"  OK {path}")

# ═══════════════════════════════════════════════
# Sec.16 - Python Intelligence Plane
# ═══════════════════════════════════════════════

# knowledge-pipeline
pkg = "mycodexvantaos-knowledge-pipeline"
mod = "mycodexvantaos_knowledge_pipeline"
write(f"python/packages/{pkg}/pyproject.toml", f"""[project]
name = "{pkg}"
version = "0.1.0"
description = "Knowledge Pipeline - Document parsing, embedding generation, semantic clustering"
readme = "README.md"
requires-python = ">=3.11"
license = {{text = "MIT"}}
authors = [
    {{name = "NinjaTeam AI", email = "ai-team@ninjatech.ai"}},
]
dependencies = [
    "pydantic>=2.9.0",
    "pydantic-settings>=2.5.0",
]

[project.optional-dependencies]
ml = [
    "scikit-learn>=1.5.0",
    "numpy>=2.0.0",
    "sentence-transformers>=3.0.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["{mod}"]

[tool.ruff]
target-version = "py311"
line-length = 100

[tool.mypy]
python_version = "3.11"
strict = true
""")

write(f"python/packages/{pkg}/README.md", f"""# {pkg}

Knowledge Pipeline - Document parsing, embedding generation, semantic clustering

## Core Types

- `DocumentInput`
- `ParsedDocument`
- `EmbeddingResult`
- `ClusterResult`

## Status

Skeleton - pydantic models with TODO markers for implementation.
""")

write(f"python/packages/{pkg}/{mod}/__init__.py", '''"""
MyCodeXvantaOS Knowledge Pipeline
Document parsing, embedding generation, and semantic clustering.
"""

from mycodexvantaos_knowledge_pipeline.models import (
    DocumentInput,
    ParsedDocument,
    EmbeddingResult,
    ClusterResult,
)

__all__ = [
    "DocumentInput",
    "ParsedDocument",
    "EmbeddingResult",
    "ClusterResult",
]
''')

write(f"python/packages/{pkg}/{mod}/models.py", '''"""
Knowledge Pipeline data models
Matches contracts/schemas/knowledge-model.schema.json
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class DocumentInput(BaseModel):
    """Input document for processing"""

    document_id: str
    filename: str
    content_type: str
    content: str
    metadata: dict[str, object] = Field(default_factory=dict)


class ParsedDocument(BaseModel):
    """Parsed document with extracted chunks"""

    document_id: str
    chunks: list[str] = Field(default_factory=list)
    metadata: dict[str, object] = Field(default_factory=dict)


class EmbeddingResult(BaseModel):
    """Embedding generation result"""

    document_id: str
    chunk_ids: list[str]
    embeddings: list[list[float]] = Field(default_factory=list)
    model: str = "text-embedding-3-small"
    total_tokens: int = 0


class ClusterResult(BaseModel):
    """Semantic clustering result"""

    clusters: list[dict[str, object]] = Field(default_factory=list)
    total_documents: int = 0
    total_clusters: int = 0
''')

# agent-worker
pkg = "mycodexvantaos-agent-worker"
mod = "mycodexvantaos_agent_worker"
write(f"python/packages/{pkg}/pyproject.toml", f"""[project]
name = "{pkg}"
version = "0.1.0"
description = "Agent Worker - AI-powered agent execution for RAG, tool use, and multi-step reasoning"
readme = "README.md"
requires-python = ">=3.11"
license = {{text = "MIT"}}
authors = [
    {{name = "NinjaTeam AI", email = "ai-team@ninjatech.ai"}},
]
dependencies = [
    "pydantic>=2.9.0",
    "pydantic-settings>=2.5.0",
]

[project.optional-dependencies]
llm = [
    "openai>=1.30.0",
    "anthropic>=0.25.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["{mod}"]

[tool.ruff]
target-version = "py311"
line-length = 100

[tool.mypy]
python_version = "3.11"
strict = true
""")

write(f"python/packages/{pkg}/README.md", f"""# {pkg}

Agent Worker - AI-powered agent execution for RAG, tool use, and multi-step reasoning

## Core Types

- `AgentTask`
- `AgentResult`
- `ToolInvocation`

## Status

Skeleton - pydantic models with TODO markers for implementation.
""")

write(f"python/packages/{pkg}/{mod}/__init__.py", '''"""
MyCodeXvantaOS Agent Worker
AI-powered agent execution for RAG, tool use, and multi-step reasoning.
"""

from mycodexvantaos_agent_worker.models import (
    AgentTask,
    AgentResult,
    ToolInvocation,
)

__all__ = [
    "AgentTask",
    "AgentResult",
    "ToolInvocation",
]
''')

write(f"python/packages/{pkg}/{mod}/models.py", '''"""
Agent Worker data models
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class AgentTask(BaseModel):
    """A task for the agent worker to execute"""

    task_id: str
    session_id: str
    prompt: str
    collection_ids: list[str] = Field(default_factory=list)
    tools: list[str] = Field(default_factory=list)
    max_steps: int = 10
    metadata: dict[str, object] = Field(default_factory=dict)


class ToolInvocation(BaseModel):
    """Record of a tool invocation during agent execution"""

    tool_name: str
    arguments: dict[str, object] = Field(default_factory=dict)
    result: str | None = None
    error: str | None = None
    duration_ms: float = 0.0


class AgentResult(BaseModel):
    """Result from agent execution"""

    task_id: str
    session_id: str
    response: str
    tool_invocations: list[ToolInvocation] = Field(default_factory=list)
    total_tokens: int = 0
    evidence_level: str = "knowledge-assisted"
    metadata: dict[str, object] = Field(default_factory=dict)
''')

# vector-tools
pkg = "mycodexvantaos-vector-tools"
mod = "mycodexvantaos_vector_tools"
write(f"python/packages/{pkg}/pyproject.toml", f"""[project]
name = "{pkg}"
version = "0.1.0"
description = "Vector Tools - Similarity search, reranking, and vector utilities"
readme = "README.md"
requires-python = ">=3.11"
license = {{text = "MIT"}}
authors = [
    {{name = "NinjaTeam AI", email = "ai-team@ninjatech.ai"}},
]
dependencies = [
    "pydantic>=2.9.0",
    "pydantic-settings>=2.5.0",
]

[project.optional-dependencies]
ml = [
    "scikit-learn>=1.5.0",
    "numpy>=2.0.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["{mod}"]

[tool.ruff]
target-version = "py311"
line-length = 100

[tool.mypy]
python_version = "3.11"
strict = true
""")

write(f"python/packages/{pkg}/README.md", f"""# {pkg}

Vector Tools - Similarity search, reranking, and vector utilities

## Core Types

- `VectorSearchQuery`
- `VectorSearchResult`
- `RerankResult`

## Status

Skeleton - pydantic models with TODO markers for implementation.
""")

write(f"python/packages/{pkg}/{mod}/__init__.py", '''"""
MyCodeXvantaOS Vector Tools
Similarity search, reranking, and vector utilities.
"""

from mycodexvantaos_vector_tools.models import (
    VectorSearchQuery,
    VectorSearchResult,
    RerankResult,
)

__all__ = [
    "VectorSearchQuery",
    "VectorSearchResult",
    "RerankResult",
]
''')

write(f"python/packages/{pkg}/{mod}/models.py", '''"""
Vector Tools data models
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class VectorSearchQuery(BaseModel):
    """Vector similarity search query"""

    query_vector: list[float]
    top_k: int = 10
    filter: dict[str, object] | None = None
    namespace: str | None = None


class VectorSearchResult(BaseModel):
    """Vector similarity search result"""

    id: str
    score: float
    metadata: dict[str, object] = Field(default_factory=dict)
    content: str | None = None


class RerankResult(BaseModel):
    """Reranked search results"""

    results: list[VectorSearchResult]
    original_count: int = 0
    reranked_count: int = 0
    model: str = "default"
''')

# evaluation
pkg = "mycodexvantaos-evaluation"
mod = "mycodexvantaos_evaluation"
write(f"python/packages/{pkg}/pyproject.toml", f"""[project]
name = "{pkg}"
version = "0.1.0"
description = "Evaluation - AI evaluation tools, metrics, and benchmarking"
readme = "README.md"
requires-python = ">=3.11"
license = {{text = "MIT"}}
authors = [
    {{name = "NinjaTeam AI", email = "ai-team@ninjatech.ai"}},
]
dependencies = [
    "pydantic>=2.9.0",
    "pydantic-settings>=2.5.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["{mod}"]

[tool.ruff]
target-version = "py311"
line-length = 100

[tool.mypy]
python_version = "3.11"
strict = true
""")

write(f"python/packages/{pkg}/README.md", f"""# {pkg}

Evaluation - AI evaluation tools, metrics, and benchmarking

## Core Types

- `EvaluationRun`
- `EvaluationMetric`
- `EvaluationReport`

## Status

Skeleton - pydantic models with TODO markers for implementation.
""")

write(f"python/packages/{pkg}/{mod}/__init__.py", '''"""
MyCodeXvantaOS Evaluation
AI evaluation tools, metrics, and benchmarking.
"""

from mycodexvantaos_evaluation.models import (
    EvaluationRun,
    EvaluationMetric,
    EvaluationReport,
)

__all__ = [
    "EvaluationRun",
    "EvaluationMetric",
    "EvaluationReport",
]
''')

write(f"python/packages/{pkg}/{mod}/models.py", '''"""
Evaluation data models
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class EvaluationMetric(BaseModel):
    """A single evaluation metric"""

    name: str
    value: float
    threshold: float | None = None
    passed: bool | None = None
    description: str | None = None


class EvaluationRun(BaseModel):
    """An evaluation run configuration"""

    run_id: str
    target_service: str
    metrics: list[str] = Field(default_factory=list)
    dataset: str | None = None
    metadata: dict[str, object] = Field(default_factory=dict)


class EvaluationReport(BaseModel):
    """Evaluation report with results"""

    run_id: str
    target_service: str
    metrics: list[EvaluationMetric] = Field(default_factory=list)
    overall_passed: bool = True
    summary: str | None = None
    created_at: str | None = None
''')

# Python apps
write("python/apps/knowledge-worker/pyproject.toml", """[project]
name = "knowledge-worker"
version = "0.1.0"
description = "Knowledge Worker CLI - Executes knowledge pipeline jobs (ingest, embed, cluster)"
readme = "README.md"
requires-python = ">=3.11"
license = {text = "MIT"}
authors = [
    {name = "NinjaTeam AI", email = "ai-team@ninjatech.ai"},
]
dependencies = [
    "pydantic>=2.9.0",
    "mycodexvantaos-knowledge-pipeline",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.ruff]
target-version = "py311"
line-length = 100

[tool.mypy]
python_version = "3.11"
strict = true
""")

write("python/apps/knowledge-worker/README.md", """# knowledge-worker

Knowledge Worker CLI - Executes knowledge pipeline jobs (ingest, embed, cluster)

## Usage

```bash
uv run python main.py --job-type ingest --input data.json
uv run python main.py --job-type ingest --input data.json --dry-run
```

## Status

Skeleton - CLI entry point with TODO markers.
""")

write("python/apps/knowledge-worker/main.py", '''"""
Knowledge Worker CLI - Executes knowledge pipeline jobs (ingest, embed, cluster)
"""

import argparse
import json
import sys


def execute_job(job_type: str, input_path: str, dry_run: bool = False) -> dict:
    """Execute a knowledge-worker job."""
    with open(input_path) as f:
        input_data = json.load(f)

    result = {
        "job_type": job_type,
        "status": "completed" if not dry_run else "dry-run",
        "input_count": len(input_data) if isinstance(input_data, list) else 1,
        "dry_run": dry_run,
        "message": "TODO: implement actual job execution",
    }
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="Knowledge Worker CLI")
    parser.add_argument("--job-type", required=True, help="Type of job to execute")
    parser.add_argument("--input", required=True, help="Path to input JSON file")
    parser.add_argument("--dry-run", action="store_true", help="Only report what would be done")
    args = parser.parse_args()

    result = execute_job(args.job_type, args.input, args.dry_run)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
''')

write("python/apps/agent-worker/pyproject.toml", """[project]
name = "agent-worker"
version = "0.1.0"
description = "Agent Worker CLI - Executes agent tasks (RAG, tool use, reasoning)"
readme = "README.md"
requires-python = ">=3.11"
license = {text = "MIT"}
authors = [
    {name = "NinjaTeam AI", email = "ai-team@ninjatech.ai"},
]
dependencies = [
    "pydantic>=2.9.0",
    "mycodexvantaos-agent-worker",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.ruff]
target-version = "py311"
line-length = 100

[tool.mypy]
python_version = "3.11"
strict = true
""")

write("python/apps/agent-worker/README.md", """# agent-worker

Agent Worker CLI - Executes agent tasks (RAG, tool use, reasoning)

## Usage

```bash
uv run python main.py --job-type rag --input task.json
uv run python main.py --job-type rag --input task.json --dry-run
```

## Status

Skeleton - CLI entry point with TODO markers.
""")

write("python/apps/agent-worker/main.py", '''"""
Agent Worker CLI - Executes agent tasks (RAG, tool use, reasoning)
"""

import argparse
import json
import sys


def execute_job(job_type: str, input_path: str, dry_run: bool = False) -> dict:
    """Execute an agent-worker job."""
    with open(input_path) as f:
        input_data = json.load(f)

    result = {
        "job_type": job_type,
        "status": "completed" if not dry_run else "dry-run",
        "input_count": len(input_data) if isinstance(input_data, list) else 1,
        "dry_run": dry_run,
        "message": "TODO: implement actual job execution",
    }
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="Agent Worker CLI")
    parser.add_argument("--job-type", required=True, help="Type of job to execute")
    parser.add_argument("--input", required=True, help="Path to input JSON file")
    parser.add_argument("--dry-run", action="store_true", help="Only report what would be done")
    args = parser.parse_args()

    result = execute_job(args.job_type, args.input, args.dry_run)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
''')

print(f"\nSec.ion 16 done (created={created}, skipped={skipped})")

# ═══════════════════════════════════════════════
# Sec.20 - runtimes/local/
# ═══════════════════════════════════════════════

write("runtimes/local/README.md", """# Local Runtime

Runtime configuration for local development and testing.

## Supported Providers

- Database: SQLite (file-based)
- Cache: In-memory Map
- Storage: Local filesystem
- Queue: In-process (asyncio)
- AI: Ollama (optional)

## Supported Services

All platform services can run locally for development.

## Usage

```bash
# Start local API server
pnpm --filter @mycodexvantaos/api-node dev

# Run with Docker Compose (optional)
docker-compose -f infra/docker-compose/docker-compose.yml up
```

## Self-Hostable

Yes - the local runtime is the primary self-hostable configuration.
""")

write("runtimes/local/runtime.yaml", """id: local
display_name: Local Development Runtime
description: Local development and testing runtime
supported_services:
  - identity
  - workspace
  - service-catalog
  - resource-registry
  - policy-engine
  - audit-log
  - usage-meter
  - knowledge-store
  - knowledge-search
  - agent-chat
  - model-byok
  - memory-store
  - memory-capture
  - memory-dream
storage_backend: filesystem
database_backend: sqlite
queue_backend: in-process
ai_provider_support:
  - ollama
  - openai
  - anthropic
self_hostable: true
""")

print(f"\nSec.ion 20 done (created={created}, skipped={skipped})")

# ═══════════════════════════════════════════════
# Sec.21 - Cloudflare Providers (5 providers)
# ═══════════════════════════════════════════════

cf_providers = {
    "cloudflare-d1": ("Cloudflare D1 Provider", "SQLite-based database adapter for Cloudflare D1"),
    "cloudflare-kv": ("Cloudflare KV Provider", "Key-value cache and session adapter for Cloudflare KV"),
    "cloudflare-r2": ("Cloudflare R2 Provider", "Object storage adapter for Cloudflare R2"),
    "cloudflare-workers-ai": ("Cloudflare Workers AI Provider", "Chat and embedding model adapter for Workers AI"),
    "cloudflare-vectorize": ("Cloudflare Vectorize Provider", "Vector search adapter for Cloudflare Vectorize"),
}

for prov_name, (display, desc) in cf_providers.items():
    prov_dir = f"providers/mycodexvantaos-provider-{prov_name}"
    
    write(f"{prov_dir}/package.json", f"""{{
  "name": "@mycodexvantaos/provider-{prov_name}",
  "version": "0.1.0",
  "description": "{desc}",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {{
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "echo \\"TODO: add tests\\" && exit 0"
  }},
  "keywords": ["mycodexvantaos", "provider", "{prov_name}"],
  "license": "MIT",
  "devDependencies": {{
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  }},
  "dependencies": {{
    "@mycodexvantaos/core": "workspace:*",
    "@mycodexvantaos/ports": "workspace:*"
  }}
}}
""")
    
    write(f"{prov_dir}/tsconfig.json", """{
  "extends": "../../tsconfig.providers.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
""")
    
    write(f"{prov_dir}/README.md", f"""# @mycodexvantaos/provider-{prov_name}

{desc}

Part of the Cloudflare runtime provider set.

## Status

Skeleton - implements port interfaces with TODO markers.
""")
    
    write(f"{prov_dir}/CHANGELOG.md", f"""# @mycodexvantaos/provider-{prov_name}

## 0.1.0 (2025-05-15)

- Initial skeleton
""")
    
    write(f"{prov_dir}/src/index.ts", f"""/**
 * @mycodexvantaos/provider-{prov_name}
 * {desc}
 *
 * Implements port interfaces from @mycodexvantaos/ports
 * for the Cloudflare runtime.
 */

// TODO: Implement {display} adapter
// TODO: Import relevant port interface from @mycodexvantaos/ports
// TODO: Implement adapter class

export {{}};
""")

print(f"\nSec.ion 21 done (created={created}, skipped={skipped})")

# ═══════════════════════════════════════════════
# Sec.22 - Missing Apps (api-node, admin-console)
# ═══════════════════════════════════════════════

write("apps/api-node/package.json", """{
  "name": "@mycodexvantaos/api-node",
  "version": "0.1.0",
  "private": true,
  "description": "Node.js API server for self-hosted / Docker / Kubernetes runtime",
  "type": "module",
  "main": "index.ts",
  "scripts": {
    "dev": "npx tsx watch index.ts",
    "build": "npx tsup index.ts --format esm --outDir dist",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@mycodexvantaos/core": "workspace:*",
    "@mycodexvantaos/ports": "workspace:*",
    "@mycodexvantaos/application": "workspace:*",
    "@mycodexvantaos/adapters": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  },
  "license": "UNLICENSED"
}
""")

write("apps/api-node/README.md", """# @mycodexvantaos/api-node

Node.js API server for self-hosted / Docker / Kubernetes runtime.

Shares the same route definitions as `api-worker` but runs on Node.js
instead of Cloudflare Workers.

## Status

Skeleton - route definitions with TODO markers.
""")

write("apps/api-node/index.ts", """/**
 * @module apps/api-node
 * @description Node.js API server for self-hosted deployment.
 *
 * Shares route definitions with the Cloudflare Workers api-worker
 * but uses Node.js adapters (SQLite, filesystem, in-process queue) instead.
 */

// TODO: Import route definitions from shared config
// TODO: Wire up Node.js adapters (SQLite, filesystem, in-process queue)
// TODO: Start HTTP server

console.log('MyCodeXvantaOS API Node - TODO: implement');
""")

write("apps/admin-console/package.json", """{
  "name": "@mycodexvantaos/admin-console",
  "version": "0.1.0",
  "private": true,
  "description": "Admin console for platform management",
  "type": "module",
  "scripts": {
    "dev": "echo \\"TODO: setup Next.js dev\\" && exit 0"
  },
  "license": "UNLICENSED"
}
""")

write("apps/admin-console/README.md", """# @mycodexvantaos/admin-console

Admin console for platform management - user management, policy configuration, audit review, usage dashboards.

## Status

Placeholder - to be implemented.
""")

print(f"\nSec.ion 22 done (created={created}, skipped={skipped})")

print(f"\nTotal: created={created}, skipped={skipped}")
