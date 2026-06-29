.. path: unified-gates/gate/6-domain-ai/gate-training-stability.rst
.. governanceCode: mycodexvantaos-60600

========================
Gate Training Stability
========================

:Version: 1.0.0
:Status: normative

Overview
--------

The training stability gate validates that AI model training runs are stable,
reproducible, and converging before the resulting model checkpoint is registered
in the model registry.

Stability Dimensions
--------------------

**Loss Convergence**: Training loss MUST show monotonic decrease (with acceptable
variance) over the final 10% of training steps. Divergence or NaN loss values
cause immediate gate failure.

**Gradient Health**: Gradient norm MUST remain within the defined bounds.
Gradient explosion (norm > 1000) or vanishing gradients (norm < 1e-7) MUST
cause gate failure.

**Reproducibility**: Two training runs with the same seed and configuration
MUST produce model checkpoints with cosine similarity > 0.99.

**Resource Utilization**: GPU utilization MUST be above 80% for at least 90%
of the training duration. Low utilization indicates a pipeline bottleneck.

Gate Reference
--------------

Implemented by: ``gate-33-training-pipeline-validation`` (l30)
