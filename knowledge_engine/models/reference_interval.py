"""
Reference interval domain model.
"""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class ReferenceInterval:
    """
    A resolved laboratory reference interval.

    Example:
        lower = 13.0
        upper = 17.0
    """

    lower: float
    upper: float

    def contains(self, value: float) -> bool:
        """Return True if the value lies within the interval."""
        return self.lower <= value <= self.upper