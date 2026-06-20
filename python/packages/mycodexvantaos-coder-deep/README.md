# mycodexvantaos-coder-deep

Coder-Deep persistent memory, MCP context bridge, AI behavior tracking, and architecture sync for MyCodeXvantaOS.

## Overview

This library provides the core engine for the Coder-Deep system, which enables:

- **Persistent Memory Store**: Key-value memory with TTL, namespaces, and search across AI sessions
- **Context Cache**: LRU + TTL cache for large project contexts with compression
- **AI Behavior Tracker**: Logging and retrieval of AI agent actions for audit and improvement
- **Architecture Sync**: File mapping and architecture change detection across the monorepo
- **Pipeline Codex**: Codification of best practices, pipelines, and team workflows
- **Task Tracker**: Persistent task state with history and dependency tracking

## Installation

```bash
uv pip install mycodexvantaos-coder-deep
```

## Usage

```python
from mycodexvantaos_coder_deep.memory_store import MemoryStore
from mycodexvantaos_coder_deep.context_cache import ContextCache
from mycodexvantaos_coder_deep.behavior_tracker import BehaviorTracker
from mycodexvantaos_coder_deep.architecture_sync import ArchitectureSync
from mycodexvantaos_coder_deep.pipeline_codex import PipelineCodex
from mycodexvantaos_coder_deep.task_tracker import TaskTracker
```

## Architecture

Part of the MyCodeXvantaOS Python Intelligence Plane. Works alongside the FastAPI
service `coder-deep-mcp` which exposes these capabilities via HTTP API and MCP protocol.
