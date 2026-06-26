.. path: unified-gates/gate/6-domain-ai/gate-model-quality.rst
.. governanceCode: mycodexvantaos-60600

==================
Gate Model Quality
==================

:Version: 1.0.0
:Status: normative

Overview
--------

The model quality gate validates that AI models meet defined quality thresholds
before deployment to inference infrastructure. Quality is measured across
accuracy, robustness, fairness, and calibration dimensions.

Quality Dimensions
------------------

**Accuracy**: Model performance on the held-out evaluation dataset MUST meet
the threshold defined in the model contract (``contracts/model-contract.yaml``).
Minimum acceptable accuracy varies by model type and use case.

**Robustness**: Model performance under distribution shift and adversarial inputs
MUST not degrade beyond the defined tolerance. Robustness is measured via
out-of-distribution (OOD) test sets.

**Fairness**: For models making decisions affecting users, fairness metrics
(demographic parity, equalized odds) MUST be within defined bounds.

**Calibration**: Model confidence scores MUST be calibrated. Expected Calibration
Error (ECE) MUST be below the threshold defined in the model contract.

Gate Reference
--------------

Implemented by: ``gate-32-model-contract-validation`` (l30)

Quality thresholds are defined in: ``contracts/model-contract.yaml``
