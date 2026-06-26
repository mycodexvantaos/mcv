.. path: unified-gates/gate/6-domain-ai/gate-data-quality.rst
.. governanceCode: mycodexvantaos-40100

==================
Gate Data Quality
==================

:Version: 1.0.0
:Status: normative

Overview
--------

The data quality gate validates that datasets used for training, fine-tuning,
or RAG retrieval meet defined quality thresholds before use in AI workloads.

Quality Dimensions
------------------

**Completeness**: Required fields MUST have a null rate below the threshold
defined in the dataset contract.

**Consistency**: Data values MUST conform to the schema defined in
``contracts/dataset-contract.yaml``. Schema violation rate MUST be below 0.01%.

**Freshness**: For time-sensitive datasets, data age MUST be within the
freshness window defined in the dataset contract.

**Deduplication**: Duplicate record rate MUST be below the threshold defined
in the dataset contract.

**PII Compliance**: Datasets MUST pass the PII scan gate (``gate-24``) before
any quality threshold evaluation.

Gate Reference
--------------

Implemented by: ``gate-27-data-quality-threshold-validation`` (l20)

Dataset contract: ``contracts/dataset-contract.yaml``
