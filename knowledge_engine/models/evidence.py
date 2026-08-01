"""
Evidence collected while matching a pattern.
"""

from dataclasses import dataclass, field

from .finding import Finding
from .finding_requirement import FindingRequirement


@dataclass(frozen=True, slots=True)
class Evidence:
    """
    Explains WHY a pattern matched.
    """

    matched: tuple[Finding, ...] = field(default_factory=tuple)

    supportive: tuple[Finding, ...] = field(default_factory=tuple)

    missing: tuple[FindingRequirement, ...] = field(default_factory=tuple)

    contradictory: tuple[Finding, ...] = field(default_factory=tuple)