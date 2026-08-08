"""
Tests for KnowledgeRegistry.
"""

from knowledge_engine.core.enums import (
    LabStatus,
    PatternCategory,
)

from knowledge_engine.models.pattern import Pattern
from knowledge_engine.models.finding_requirement import (
    FindingRequirement,
)

from knowledge_engine.services.registry import (
    KnowledgeRegistry,
    KnowledgeRegistryError,
)

from tests.utils import (
    print_header,
    passed,
    finished,
)


def valid_pattern():

    return {
        "id": "example_cbc_pattern",
        "name": "Example CBC Pattern",
        "category": "cbc",
        "description": "Synthetic test pattern.",
        "priority": 100,
        "required": [
            {
                "test_name": "hemoglobin",
                "status": "low",
            },
            {
                "test_name": "mcv",
                "status": "low",
            },
        ],
        "supportive": [
            {
                "test_name": "rdw",
                "status": "high",
            },
        ],
        "contradictory": [
            {
                "test_name": "mcv",
                "status": "high",
            },
        ],
        "possible_explanations": [
            "Synthetic explanation.",
        ],
    }


def test_register():

    print_header("TEST 1 — REGISTER")

    registry = KnowledgeRegistry()

    pattern = registry.register(
        valid_pattern()
    )

    assert isinstance(pattern, Pattern)
    assert pattern.id == "example_cbc_pattern"

    passed()


def test_required_conversion():

    print_header("TEST 2 — REQUIRED CONVERSION")

    registry = KnowledgeRegistry()

    pattern = registry.register(
        valid_pattern()
    )

    assert len(pattern.required) == 2

    assert isinstance(
        pattern.required[0],
        FindingRequirement,
    )

    assert (
        pattern.required[0].test_name
        == "hemoglobin"
    )

    assert (
        pattern.required[0].status
        is LabStatus.LOW
    )

    passed()


def test_supportive_conversion():

    print_header("TEST 3 — SUPPORTIVE CONVERSION")

    registry = KnowledgeRegistry()

    pattern = registry.register(
        valid_pattern()
    )

    assert len(pattern.supportive) == 1

    assert (
        pattern.supportive[0].test_name
        == "rdw"
    )

    passed()


def test_contradictory_conversion():

    print_header("TEST 4 — CONTRADICTORY CONVERSION")

    registry = KnowledgeRegistry()

    pattern = registry.register(
        valid_pattern()
    )

    assert len(pattern.contradictory) == 1

    assert (
        pattern.contradictory[0].test_name
        == "mcv"
    )

    assert (
        pattern.contradictory[0].status
        is LabStatus.HIGH
    )

    passed()


def test_get():

    print_header("TEST 5 — GET")

    registry = KnowledgeRegistry()

    registered = registry.register(
        valid_pattern()
    )

    retrieved = registry.get(
        "example_cbc_pattern"
    )

    assert retrieved is registered

    passed()


def test_all():

    print_header("TEST 6 — ALL")

    registry = KnowledgeRegistry()

    registry.register(
        valid_pattern()
    )

    patterns = registry.all()

    assert len(patterns) == 1
    assert patterns[0].id == "example_cbc_pattern"

    passed()


def test_count():

    print_header("TEST 7 — COUNT")

    registry = KnowledgeRegistry()

    assert registry.count() == 0

    registry.register(
        valid_pattern()
    )

    assert registry.count() == 1

    passed()


def test_duplicate():

    print_header("TEST 8 — DUPLICATE")

    registry = KnowledgeRegistry()

    registry.register(
        valid_pattern()
    )

    try:

        registry.register(
            valid_pattern()
        )

        assert False

    except KnowledgeRegistryError:

        passed()


def test_missing_pattern():

    print_header("TEST 9 — MISSING PATTERN")

    registry = KnowledgeRegistry()

    try:

        registry.get(
            "does_not_exist"
        )

        assert False

    except KnowledgeRegistryError:

        passed()


if __name__ == "__main__":

    test_register()
    test_required_conversion()
    test_supportive_conversion()
    test_contradictory_conversion()
    test_get()
    test_all()
    test_count()
    test_duplicate()
    test_missing_pattern()

    finished(
        "ALL REGISTRY TESTS PASSED"
    )