"""
Knowledge registry.

Responsible for converting validated knowledge documents
into Pattern domain objects and storing them for retrieval.

The registry does not perform clinical matching.
"""

from __future__ import annotations

from typing import Any

from knowledge_engine.core.enums import (
    LabStatus,
    PatternCategory,
    Severity,
)

from knowledge_engine.models.finding_requirement import (
    FindingRequirement,
)

from knowledge_engine.models.pattern import Pattern


class KnowledgeRegistryError(ValueError):
    """Raised when knowledge cannot be registered."""


class KnowledgeRegistry:
    """
    Stores validated clinical knowledge as Pattern objects.
    """

    def __init__(self) -> None:
        self._patterns: dict[str, Pattern] = {}

    def register(self, document: dict[str, Any]) -> Pattern:
        """
        Convert one validated knowledge document into a Pattern
        and register it.
        """

        pattern = self._build_pattern(document)

        if pattern.id in self._patterns:
            raise KnowledgeRegistryError(
                f"Pattern '{pattern.id}' is already registered."
            )

        self._patterns[pattern.id] = pattern

        return pattern

    def get(self, pattern_id: str) -> Pattern:
        """
        Retrieve a registered pattern by ID.
        """

        try:
            return self._patterns[pattern_id]

        except KeyError as exc:
            raise KnowledgeRegistryError(
                f"Pattern '{pattern_id}' is not registered."
            ) from exc

    def all(self) -> tuple[Pattern, ...]:
        """
        Return all registered patterns.
        """

        return tuple(self._patterns.values())

    def count(self) -> int:
        """
        Return number of registered patterns.
        """

        return len(self._patterns)

    @staticmethod
    def _build_pattern(
        document: dict[str, Any],
    ) -> Pattern:
        """
        Convert validated dictionary data into a Pattern.
        """

        return Pattern(
            id=document["id"],
            name=document["name"],
            category=PatternCategory(
                document["category"]
            ),
            description=document["description"],
            priority=document.get("priority", 100),
            required=KnowledgeRegistry._build_requirements(
                document.get("required", [])
            ),
            supportive=KnowledgeRegistry._build_requirements(
                document.get("supportive", [])
            ),
            contradictory=KnowledgeRegistry._build_requirements(
                document.get("contradictory", [])
            ),
            possible_explanations=tuple(
                document.get(
                    "possible_explanations",
                    [],
                )
            ),
        )

    @staticmethod
    def _build_requirements(
        requirements: list[dict[str, Any]],
    ) -> tuple[FindingRequirement, ...]:
        """
        Convert requirement dictionaries into
        FindingRequirement objects.
        """

        return tuple(
            FindingRequirement(
                test_name=item["test_name"],
                status=LabStatus(item["status"]),
                severity=(
                    Severity(item["severity"])
                    if item.get("severity") is not None
                    else None
                ),
            )
            for item in requirements
        )