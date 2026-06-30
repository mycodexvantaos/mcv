#!/usr/bin/env python3
"""Tests for ci/namespace_check.py — Namespace Governance CI Validator."""

import json
import sys
import tempfile
from pathlib import Path

import pytest

# Add ci/ to path so we can import namespace_check
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "ci"))

from namespace_check import (
    DependencyGraphValidator,
    GovernanceCodeValidator,
    LifecycleTransitionValidator,
    NamespaceRegistryValidator,
    RepositoryNameValidator,
    ValidationResult,
    ValidationReport,
    ERA_RANGES,
    LIFECYCLE_TRANSITIONS,
    VALID_DOMAINS,
    VALID_FUNCTIONS,
    VALID_LIFECYCLE_STAGES,
    VALID_NAMESPACES,
)


# ---------------------------------------------------------------------------
# Repository Name Validator
# ---------------------------------------------------------------------------

class TestRepositoryNameValidator:
    """Tests for RepositoryNameValidator (R-01 through R-10)."""

    def setup_method(self):
        self.validator = RepositoryNameValidator()

    # R-01: Canonical pattern match
    @pytest.mark.parametrize("name", [
        "mycodexvantaos-auth-service",
        "softwareos-qa-service",
        "mycodexvantaos-db-schemas-repository",
        "softwareos-machinenativeops-agent",
        "mycodexvantaos-rolloutd-controller",
    ])
    def test_r01_valid_repo_names(self, name):
        results = self.validator.validate(name)
        r01 = [r for r in results if r.rule_id == "R-01"]
        assert len(r01) == 1
        assert r01[0].status == "PASS"

    @pytest.mark.parametrize("name", [
        "invalid-name",
        "auth-service",
        "mycodexvantaos-auth",
        "other-namespace-service",
    ])
    def test_r01_invalid_repo_names(self, name):
        results = self.validator.validate(name)
        r01 = [r for r in results if r.rule_id == "R-01"]
        assert len(r01) == 1
        assert r01[0].status == "FAIL"

    # R-02: No uppercase
    def test_r02_uppercase_fail(self):
        results = self.validator.validate("mycodexvantaos-Auth-service")
        r02 = [r for r in results if r.rule_id == "R-02"]
        assert len(r02) == 1
        assert r02[0].status == "FAIL"

    def test_r02_no_uppercase_pass(self):
        results = self.validator.validate("mycodexvantaos-auth-service")
        r02 = [r for r in results if r.rule_id == "R-02"]
        assert len(r02) == 1
        assert r02[0].status == "PASS"

    # R-03: No underscore
    def test_r03_underscore_fail(self):
        results = self.validator.validate("mycodexvantaos-auth_service")
        r03 = [r for r in results if r.rule_id == "R-03"]
        assert r03[0].status == "FAIL"

    # R-04: No dot
    def test_r04_dot_fail(self):
        results = self.validator.validate("mycodexvantaos.auth.service")
        r04 = [r for r in results if r.rule_id == "R-04"]
        assert r04[0].status == "FAIL"

    # R-05: No whitespace
    def test_r05_whitespace_fail(self):
        results = self.validator.validate("mycodexvantaos auth service")
        r05 = [r for r in results if r.rule_id == "R-05"]
        assert r05[0].status == "FAIL"

    # R-06: No version suffix
    def test_r06_version_suffix_fail(self):
        results = self.validator.validate("mycodexvantaos-auth-service-v1")
        r06 = [r for r in results if r.rule_id == "R-06"]
        assert r06[0].status == "FAIL"

    # R-07: No environment marker
    def test_r07_env_marker_fail(self):
        results = self.validator.validate("mycodexvantaos-auth-service-prod")
        r07 = [r for r in results if r.rule_id == "R-07"]
        assert r07[0].status == "FAIL"

    # R-08: Namespace must be registered
    def test_r08_registered_namespace_pass(self):
        results = self.validator.validate("mycodexvantaos-auth-service")
        r08 = [r for r in results if r.rule_id == "R-08"]
        assert r08[0].status == "PASS"

    # R-09: Domain must be in controlled vocabulary
    def test_r09_valid_domain_pass(self):
        results = self.validator.validate("mycodexvantaos-auth-service")
        r09 = [r for r in results if r.rule_id == "R-09"]
        assert r09[0].status == "PASS"

    def test_r09_invalid_domain_fail(self):
        results = self.validator.validate("mycodexvantaos-unknown-service")
        r09 = [r for r in results if r.rule_id == "R-09"]
        assert r09[0].status == "FAIL"

    # R-10: Function must be in controlled vocabulary
    def test_r10_valid_function_pass(self):
        results = self.validator.validate("mycodexvantaos-auth-service")
        r10 = [r for r in results if r.rule_id == "R-10"]
        assert r10[0].status == "PASS"

    def test_r10_invalid_function_fail(self):
        results = self.validator.validate("mycodexvantaos-auth-unknownfunc")
        r10 = [r for r in results if r.rule_id == "R-10"]
        assert r10[0].status == "FAIL"

    # controller disambiguation: domain vs function
    def test_controller_as_domain(self):
        """controller as domain: mycodexvantaos-controller-manager"""
        results = self.validator.validate("mycodexvantaos-controller-manager")
        r09 = [r for r in results if r.rule_id == "R-09"]
        r10 = [r for r in results if r.rule_id == "R-10"]
        assert r09[0].status == "PASS"
        assert r10[0].status == "PASS"

    def test_controller_as_function(self):
        """controller as function: mycodexvantaos-rolloutd-controller"""
        results = self.validator.validate("mycodexvantaos-rolloutd-controller")
        r09 = [r for r in results if r.rule_id == "R-09"]
        r10 = [r for r in results if r.rule_id == "R-10"]
        assert r09[0].status == "PASS"
        assert r10[0].status == "PASS"

    # Compound domain: db-schemas
    def test_compound_domain_db_schemas(self):
        results = self.validator.validate("mycodexvantaos-db-schemas-repository")
        r09 = [r for r in results if r.rule_id == "R-09"]
        assert r09[0].status == "PASS"


# ---------------------------------------------------------------------------
# Governance Code Validator
# ---------------------------------------------------------------------------

class TestGovernanceCodeValidator:
    """Tests for GovernanceCodeValidator (G-01 through G-03)."""

    def setup_method(self):
        self.validator = GovernanceCodeValidator()

    # G-01: Canonical regex match
    @pytest.mark.parametrize("code", [
        "mycodexvantaos-00000",
        "mycodexvantaos-50100",
        "mycodexvantaos-99999",
    ])
    def test_g01_valid_codes(self, code):
        results = self.validator.validate(code)
        g01 = [r for r in results if r.rule_id == "G-01"]
        assert g01[0].status == "PASS"

    @pytest.mark.parametrize("code", [
        "mycodexvantaos-0",
        "mycodexvantaos-0000",
        "mycodexvantaos-000000",
        "softwareos-00000",
        "mycodexvantaos-abcde",
    ])
    def test_g01_invalid_codes(self, code):
        results = self.validator.validate(code)
        g01 = [r for r in results if r.rule_id == "G-01"]
        assert g01[0].status == "FAIL"

    # G-02: Space-based form detection
    def test_g02_space_form(self):
        results = self.validator.validate("mycodexvantaos 00000")
        g02 = [r for r in results if r.rule_id == "G-02"]
        assert g02[0].status == "FAIL"

    # G-03: Era range classification
    def test_g03_era_classification(self):
        results = self.validator.validate("mycodexvantaos-50100")
        g03 = [r for r in results if r.rule_id == "G-03"]
        assert g03[0].status == "PASS"
        assert "era-two" in g03[0].message


# ---------------------------------------------------------------------------
# Namespace Registry Validator
# ---------------------------------------------------------------------------

class TestNamespaceRegistryValidator:
    """Tests for NamespaceRegistryValidator (NR-01 through NR-06)."""

    def setup_method(self):
        self.validator = NamespaceRegistryValidator()

    def _make_valid_record(self, **overrides):
        record = {
            "id": "mycodexvantaos-auth-service",
            "namespace": "mycodexvantaos",
            "domain": "auth",
            "function": "service",
            "repository": "mycodexvantaos-auth-service",
            "governanceCode": "mycodexvantaos-50100",
            "lifecycle": "active",
        }
        record.update(overrides)
        return record

    # NR-01: Required fields
    def test_nr01_all_fields_present(self):
        results = self.validator.validate_registry([self._make_valid_record()])
        nr01 = [r for r in results if r.rule_id == "NR-01"]
        assert all(r.status == "PASS" for r in nr01)

    def test_nr01_missing_fields(self):
        record = {"id": "test"}
        results = self.validator.validate_registry([record])
        nr01 = [r for r in results if r.rule_id == "NR-01"]
        assert nr01[0].status == "FAIL"

    # NR-02: Lifecycle stage validity
    def test_nr02_valid_lifecycle(self):
        results = self.validator.validate_registry([self._make_valid_record(lifecycle="active")])
        nr02 = [r for r in results if r.rule_id == "NR-02"]
        assert nr02[0].status == "PASS"

    def test_nr02_invalid_lifecycle(self):
        results = self.validator.validate_registry([self._make_valid_record(lifecycle="running")])
        nr02 = [r for r in results if r.rule_id == "NR-02"]
        assert nr02[0].status == "FAIL"

    # NR-05: Global uniqueness
    def test_nr05_duplicate_id(self):
        r1 = self._make_valid_record()
        r2 = self._make_valid_record()
        results = self.validator.validate_registry([r1, r2])
        nr05 = [r for r in results if r.rule_id == "NR-05"]
        fail_results = [r for r in nr05 if r.status == "FAIL"]
        assert len(fail_results) >= 1

    # NR-06: Destroyed namespace reuse
    def test_nr06_destroyed_reuse(self):
        r1 = self._make_valid_record(
            id="mycodexvantaos-old-service",
            lifecycle="destroyed",
        )
        r2 = self._make_valid_record(
            id="mycodexvantaos-old-service",
            lifecycle="active",
        )
        results = self.validator.validate_registry([r1, r2])
        nr06 = [r for r in results if r.rule_id == "NR-06"]
        assert len(nr06) >= 1
        assert nr06[0].status == "FAIL"


# ---------------------------------------------------------------------------
# Lifecycle Transition Validator
# ---------------------------------------------------------------------------

class TestLifecycleTransitionValidator:
    """Tests for LifecycleTransitionValidator (LC-01 through LC-03)."""

    def setup_method(self):
        self.validator = LifecycleTransitionValidator()

    # LC-02: Valid transitions
    @pytest.mark.parametrize("from_stage,to_stage", [
        ("proposed", "active"),
        ("active", "deprecated"),
        ("deprecated", "archived"),
        ("archived", "destroyed"),
    ])
    def test_lc02_valid_transitions(self, from_stage, to_stage):
        results = self.validator.validate_transition("test-id", from_stage, to_stage)
        lc02 = [r for r in results if r.rule_id == "LC-02"]
        assert lc02[0].status == "PASS"

    # LC-02: Invalid transitions
    @pytest.mark.parametrize("from_stage,to_stage", [
        ("proposed", "destroyed"),
        ("active", "archived"),
        ("destroyed", "active"),
        ("archived", "proposed"),
    ])
    def test_lc02_invalid_transitions(self, from_stage, to_stage):
        results = self.validator.validate_transition("test-id", from_stage, to_stage)
        fail_results = [r for r in results if r.status == "FAIL"]
        assert len(fail_results) >= 1

    # LC-03: Destroyed is terminal
    def test_lc03_destroyed_terminal(self):
        results = self.validator.validate_transition("test-id", "destroyed", "active")
        lc03 = [r for r in results if r.rule_id == "LC-03"]
        assert lc03[0].status == "FAIL"

    # LC-01: Invalid stage names
    def test_lc01_invalid_from_stage(self):
        results = self.validator.validate_transition("test-id", "running", "active")
        lc01 = [r for r in results if r.rule_id == "LC-01"]
        assert lc01[0].status == "FAIL"


# ---------------------------------------------------------------------------
# Dependency Graph Validator
# ---------------------------------------------------------------------------

class TestDependencyGraphValidator:
    """Tests for DependencyGraphValidator (DP-01 through DP-03)."""

    def setup_method(self):
        self.validator = DependencyGraphValidator()

    # DP-01: Control-plane → Product-plane hard dependency
    def test_dp01_forbidden_hard_dep(self):
        edges = [
            {"from": "mycodexvantaos-auth-service", "to": "softwareos-qa-service", "type": "hard"},
        ]
        results = self.validator.validate_dependency_graph(edges)
        dp01 = [r for r in results if r.rule_id == "DP-01" and r.status == "FAIL"]
        assert len(dp01) >= 1

    def test_dp01_allowed_product_to_control(self):
        edges = [
            {"from": "softwareos-qa-service", "to": "mycodexvantaos-auth-service", "type": "hard"},
        ]
        results = self.validator.validate_dependency_graph(edges)
        dp01_fail = [r for r in results if r.rule_id == "DP-01" and r.status == "FAIL"]
        assert len(dp01_fail) == 0

    # DP-02: Bidirectional hard dependency without mediator
    def test_dp02_bidirectional_no_mediator(self):
        edges = [
            {"from": "mycodexvantaos-auth-service", "to": "mycodexvantaos-policy-engine", "type": "hard", "mediator": False},
            {"from": "mycodexvantaos-policy-engine", "to": "mycodexvantaos-auth-service", "type": "hard", "mediator": False},
        ]
        results = self.validator.validate_dependency_graph(edges)
        dp02 = [r for r in results if r.rule_id == "DP-02" and r.status == "FAIL"]
        assert len(dp02) >= 1

    def test_dp02_bidirectional_with_mediator(self):
        edges = [
            {"from": "mycodexvantaos-auth-service", "to": "mycodexvantaos-policy-engine", "type": "hard", "mediator": True},
            {"from": "mycodexvantaos-policy-engine", "to": "mycodexvantaos-auth-service", "type": "hard", "mediator": True},
        ]
        results = self.validator.validate_dependency_graph(edges)
        dp02 = [r for r in results if r.rule_id == "DP-02" and r.status == "PASS"]
        assert len(dp02) >= 1

    # DP-03: Cycle detection
    def test_dp03_cycle_detected(self):
        edges = [
            {"from": "mycodexvantaos-a-service", "to": "mycodexvantaos-b-service", "type": "hard"},
            {"from": "mycodexvantaos-b-service", "to": "mycodexvantaos-c-service", "type": "hard"},
            {"from": "mycodexvantaos-c-service", "to": "mycodexvantaos-a-service", "type": "hard"},
        ]
        results = self.validator.validate_dependency_graph(edges)
        dp03 = [r for r in results if r.rule_id == "DP-03"]
        assert dp03[0].status == "FAIL"

    def test_dp03_acyclic_pass(self):
        edges = [
            {"from": "mycodexvantaos-a-service", "to": "mycodexvantaos-b-service", "type": "hard"},
            {"from": "mycodexvantaos-b-service", "to": "mycodexvantaos-c-service", "type": "hard"},
        ]
        results = self.validator.validate_dependency_graph(edges)
        dp03 = [r for r in results if r.rule_id == "DP-03"]
        assert dp03[0].status == "PASS"


# ---------------------------------------------------------------------------
# Controlled Vocabularies
# ---------------------------------------------------------------------------

class TestControlledVocabularies:
    """Verify controlled vocabulary constants match spec."""

    def test_valid_namespaces(self):
        assert "mycodexvantaos" in VALID_NAMESPACES
        assert "softwareos" in VALID_NAMESPACES
        assert VALID_NAMESPACES["mycodexvantaos"] == "control-plane"
        assert VALID_NAMESPACES["softwareos"] == "product-plane"

    def test_domain_count(self):
        assert len(VALID_DOMAINS) == 28

    def test_function_count(self):
        assert len(VALID_FUNCTIONS) == 23

    def test_controller_in_both(self):
        assert "controller" in VALID_DOMAINS
        assert "controller" in VALID_FUNCTIONS

    def test_lifecycle_stages(self):
        assert VALID_LIFECYCLE_STAGES == {"proposed", "active", "deprecated", "archived", "destroyed"}

    def test_lifecycle_transitions(self):
        assert LIFECYCLE_TRANSITIONS == {
            "proposed": ["active"],
            "active": ["deprecated"],
            "deprecated": ["archived"],
            "archived": ["destroyed"],
            "destroyed": [],
        }

    def test_era_ranges(self):
        eras = [era for _, _, era in ERA_RANGES]
        assert eras == [
            "meta-governance",
            "era-one",
            "era-two",
            "era-three",
            "cross-era-governance",
        ]


# ---------------------------------------------------------------------------
# ValidationReport
# ---------------------------------------------------------------------------

class TestValidationReport:
    """Tests for ValidationReport data structure."""

    def test_overall_status_pass(self):
        report = ValidationReport()
        report.add(ValidationResult("R-01", "MUST", "PASS", "test", "ok"))
        assert report.overall_status() == "PASS"

    def test_overall_status_fail(self):
        report = ValidationReport()
        report.add(ValidationResult("R-01", "MUST", "FAIL", "test", "bad"))
        assert report.overall_status() == "FAIL"

    def test_to_dict_structure(self):
        report = ValidationReport()
        report.add(ValidationResult("R-01", "MUST", "PASS", "test", "ok"))
        d = report.to_dict()
        assert "generated_at" in d
        assert d["spec_version"] == "mycodexvantaos-00000"
        assert d["overall_status"] == "PASS"
        assert len(d["results"]) == 1
