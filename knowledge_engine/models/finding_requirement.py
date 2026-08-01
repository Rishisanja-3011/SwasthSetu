"""
Pattern finding requirement.
"""

from dataclasses import dataclass

from knowledge_engine.core.enums import LabStatus, Severity


@dataclass(frozen=True, slots=True)
class FindingRequirement:
    """
    One required/supportive finding
    inside a clinical pattern.
    """

    test: str

    status: LabStatus

    severity: Severity | None = None