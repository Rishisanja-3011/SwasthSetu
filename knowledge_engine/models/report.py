"""
Blood report domain model.
"""

from dataclasses import dataclass, field

from .lab_result import LabResult
from .patient import Patient


@dataclass(frozen=True, slots=True)
class Report:
    """
    One laboratory report.
    """

    patient: Patient

    results: tuple[LabResult, ...] = field(default_factory=tuple)