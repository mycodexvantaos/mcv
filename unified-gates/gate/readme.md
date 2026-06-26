# gate/ — Gate Specification Documentation

> **Path:** `unified-gates/gate/`
> **Type:** Documentation (RST)
> **Authority:** unified-gate-governance

This directory contains the normative RST-format specification documents for the MyCodexVantaOS unified gate system. Each subdirectory addresses a distinct dimension of gate design, from the core conceptual model through technical implementation, execution engine, governance, AI-specific domains, evolution strategy, and the full coverage taxonomy.

## Structure

| Directory | Scope |
|-----------|-------|
| `1-core/` | Gate concept, policies, validation model, and namespace mapping |
| `2-lifecycle/` | Gate lifecycle stages, state machine, and metadata schema |
| `3-technical/` | Framework, spec format, catalog, composition, dependencies, configuration, templates, and SDK |
| `4-execution/` | Execution engine, pipeline, metrics, monitoring, alerting, audit, and reporting |
| `5-governance/` | RBAC, compliance, risk, waiver, escalation, SLO, and cost governance |
| `6-domain-ai/` | AI-specific gate domains: model quality, safety, data quality, inference latency, training stability, vector index, billing accuracy, multi-tenant isolation |
| `7-evolution/` | Experiments, evolution strategy, roadmap, and feedback loop |
| `8-coverage/` | 11-dimension coverage taxonomy (code, structure, requirements, workflow, artifacts, resilience, observability, security, API contract, change, state/data) |

## Conventions

All RST files in this directory use the following header hierarchy:

```rst
=====
Title
=====

Section
-------

Subsection
~~~~~~~~~~
```

All normative statements use RFC 2119 keywords: **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, **MAY**.
