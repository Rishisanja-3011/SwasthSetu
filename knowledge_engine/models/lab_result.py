"""
Laboratory result domain model.
"""

from dataclasses import dataclass

from knowledge_engine.core.enums import LabStatus, Severity
from .reference_interval import ReferenceInterval


@dataclass(frozen=True, slots=True)
class LabResult:
    """
    A validated laboratory measurement.
    """

    test_name: str

    value: float

    unit: str

    reference: ReferenceInterval

    status: LabStatus

    severity: Severity

    raw_reference: str