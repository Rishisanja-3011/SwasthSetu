"""
Clinical Finding domain model.

A Finding represents the clinical interpretation
of one validated laboratory result.
"""

from dataclasses import dataclass

from knowledge_engine.core.enums import LabStatus, Severity
from .lab_result import LabResult


@dataclass(frozen=True, slots=True)
class Finding:
    """
    Standardized clinical finding.

    Example:

        Hemoglobin
        ↓
        LOW
        ↓
        Mild
    """

    result: LabResult

    status: LabStatus

    severity: Severity = Severity.UNKNOWN

    notes: str | None = None

    @property
    def test(self) -> str:
        """Canonical laboratory test name."""
        return self.result.test_name