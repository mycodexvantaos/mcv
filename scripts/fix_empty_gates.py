import yaml
import os
from pathlib import Path

GATES = [
    "gate-01-namespace-governance-validation",
    "gate-04-directory-binding-mediator-validation",
    "gate-05-dependency-graph-acyclic-validation",
    "gate-15-ai-compute-cluster-readiness",
    "gate-21-dataset-contract-validation",
    "gate-25-vector-database-schema-validation",
    "gate-32-model-contract-validation",
    "gate-34-inference-runtime-validation",
    "gate-41-ai-workload-contract-validation",
    "gate-47-workload-slo-validation",
    "gate-51-usage-event-contract-validation",
    "gate-56-cost-attribution-validation",
    "gate-62-kubernetes-baseline-validation",
    "gate-63-gitops-sync-validation",
    "gate-91-sbom-generation-validation",
    "gate-92-provenance-validation",
    "gate-93-signature-validation",
    "gate-99-production-closure-validation",
]

GATE_PATHS = {
    "gate-01-namespace-governance-validation": "unified-gates/ai-infra-gates/layer-00-meta-governance/gate-01-namespace-governance-validation.yaml",
    "gate-04-directory-binding-mediator-validation": "unified-gates/ai-infra-gates/layer-00-meta-governance/gate-04-directory-binding-mediator-validation.yaml",
    "gate-05-dependency-graph-acyclic-validation": "unified-gates/ai-infra-gates/layer-00-meta-governance/gate-05-dependency-graph-acyclic-validation.yaml",
    "gate-15-ai-compute-cluster-readiness": "unified-gates/ai-infra-gates/layer-10-compute-foundation/gate-15-ai-compute-cluster-readiness.yaml",
    "gate-21-dataset-contract-validation": "unified-gates/ai-infra-gates/layer-20-data-foundation/gate-21-dataset-contract-validation.yaml",
    "gate-25-vector-database-schema-validation": "unified-gates/ai-infra-gates/layer-20-data-foundation/gate-25-vector-database-schema-validation.yaml",
    "gate-32-model-contract-validation": "unified-gates/ai-infra-gates/layer-30-algorithm-foundation/gate-32-model-contract-validation.yaml",
    "gate-34-inference-runtime-validation": "unified-gates/ai-infra-gates/layer-30-algorithm-foundation/gate-34-inference-runtime-validation.yaml",
    "gate-41-ai-workload-contract-validation": "unified-gates/ai-infra-gates/layer-40-ai-workload/gate-41-ai-workload-contract-validation.yaml",
    "gate-47-workload-slo-validation": "unified-gates/ai-infra-gates/layer-40-ai-workload/gate-47-workload-slo-validation.yaml",
    "gate-51-usage-event-contract-validation": "unified-gates/ai-infra-gates/layer-50-ai-task-billing/gate-51-usage-event-contract-validation.yaml",
    "gate-56-cost-attribution-validation": "unified-gates/ai-infra-gates/layer-50-ai-task-billing/gate-56-cost-attribution-validation.yaml",
    "gate-62-kubernetes-baseline-validation": "unified-gates/ai-infra-gates/layer-60-cloud-managed-infrastructure/gate-62-kubernetes-baseline-validation.yaml",
    "gate-63-gitops-sync-validation": "unified-gates/ai-infra-gates/layer-60-cloud-managed-infrastructure/gate-63-gitops-sync-validation.yaml",
    "gate-91-sbom-generation-validation": "unified-gates/ai-infra-gates/layer-90-attestation-compliance-closure/gate-91-sbom-generation-validation.yaml",
    "gate-92-provenance-validation": "unified-gates/ai-infra-gates/layer-90-attestation-compliance-closure/gate-92-provenance-validation.yaml",
    "gate-93-signature-validation": "unified-gates/ai-infra-gates/layer-90-attestation-compliance-closure/gate-93-signature-validation.yaml",
    "gate-99-production-closure-validation": "unified-gates/ai-infra-gates/layer-90-attestation-compliance-closure/gate-99-production-closure-validation.yaml",
}

def get_layer(gate_id):
    if "layer-00" in GATE_PATHS[gate_id]: return "meta-governance"
    if "layer-10" in GATE_PATHS[gate_id]: return "compute-foundation"
    if "layer-20" in GATE_PATHS[gate_id]: return "data-foundation"
    if "layer-30" in GATE_PATHS[gate_id]: return "algorithm-foundation"
    if "layer-40" in GATE_PATHS[gate_id]: return "ai-workload"
    if "layer-50" in GATE_PATHS[gate_id]: return "ai-task-billing"
    if "layer-60" in GATE_PATHS[gate_id]: return "cloud-managed-infrastructure"
    if "layer-90" in GATE_PATHS[gate_id]: return "attestation-compliance-closure"
    return "meta-governance"

def fix_gates():
    for gate_id, rel_path in GATE_PATHS.items():
        full_path = Path(rel_path)
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        content = {
            "id": gate_id,
            "plane": "ai-infra",
            "lifecycle": "active",
            "blocking": True,
            "layer": get_layer(gate_id),
            "owner": "platform@mycodexvantaos.com",
            "validates": [
                {
                    "dimension": "canonical-readiness",
                    "description": f"Mandatory readiness for {gate_id}",
                    "checks": []
                }
            ]
        }
        
        with open(full_path, "w") as f:
            yaml.dump(content, f)
        print(f"Fixed {rel_path}")

if __name__ == "__main__":
    fix_gates()
