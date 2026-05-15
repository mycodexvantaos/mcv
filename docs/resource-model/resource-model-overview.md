# Resource Model Overview

## Purpose

The Resource Model provides a universal abstraction for all platform entities. Every
domain object (workspace, document, collection, chat session) is a "resource" with:

- A unique kind identifier (e.g., `knowledge-collection`, `chat-session`)
- A standard metadata envelope (created, updated, labels, annotations)
- Typed spec and status fields
- Owner and workspace references

## Architecture

- **Package**: `@mycodexvantaos/resource-model`
- **Core Types**: Re-exported from `@mycodexvantaos/core`
- **Extended Types**: Added in `@mycodexvantaos/resource-model`
- **Contract**: `contracts/resource-kinds/*.yaml` (16 resource kind definitions)
- **Schema**: `contracts/schemas/resource-kind.schema.json`

## Resource Kind System

Each resource kind defines:
1. **Kind**: Unique identifier (e.g., `knowledge-collection`)
2. **API Version**: Version of the kind schema (e.g., `v1`)
3. **Spec Schema**: JSON Schema for the resource's desired state
4. **Status Schema**: JSON Schema for the resource's observed state
5. **Capabilities**: CRUD operations supported
6. **Events**: Events produced when the resource changes

## Supported Resource Kinds

See `contracts/resource-kinds/` for the full list of 16 defined kinds including:
workspace, knowledge-collection, knowledge-document, document-chunk,
chat-session, chat-message, memory-item, memory-collection, agent-run,
agent-tool-call, policy-binding, audit-event, usage-record, model-endpoint,
service-instance, and resource-binding.
