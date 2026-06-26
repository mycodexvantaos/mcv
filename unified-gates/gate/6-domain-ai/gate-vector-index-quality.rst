.. path: unified-gates/gate/6-domain-ai/gate-vector-index-quality.rst
.. governanceCode: mycodexvantaos-70900

==========================
Gate Vector Index Quality
==========================

:Version: 1.0.0
:Status: normative

Overview
--------

The vector index quality gate validates that vector database indexes meet
defined quality thresholds for retrieval accuracy, latency, and consistency
before use in RAG pipelines or semantic search workloads.

Quality Dimensions
------------------

**Recall@K**: For a defined evaluation query set, Recall@K MUST meet the
threshold defined in the vector index contract. Default: Recall@10 > 0.90.

**Index Freshness**: The index MUST reflect documents ingested within the
freshness window defined in the contract.

**Dimension Consistency**: All vectors in the index MUST have the same
embedding dimension as declared in ``contracts/vector-index-contract.yaml``.

**Query Latency**: p99 query latency MUST be below the threshold defined
in the vector index contract. Default: < 100ms.

Gate Reference
--------------

Implemented by: ``gate-25-vector-database-schema-validation`` (l20) and
``gate-26-embedding-dimension-validation`` (l20)

Vector index contract: ``contracts/vector-index-contract.yaml``
