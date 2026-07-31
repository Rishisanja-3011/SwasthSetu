"""
Patient domain model.
"""

from dataclasses import dataclass

from knowledge_engine.core.enums import AgeUnit, Sex


@dataclass(frozen=True, slots=True)
class Patient:
    """
    Patient demographic information.
    """

    sex: Sex
    age_value: float
    age_unit: AgeUnit