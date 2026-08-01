"""
Final reasoning output.
"""

from dataclasses import dataclass, field

from .finding import Finding
from .match_result import MatchResult


@dataclass(frozen=True, slots=True)
class Interpretation:
    """
    Structured interpretation generated
    by the reasoning engine.
    """

    findings: tuple[Finding, ...] = field(default_factory=tuple)

    matches: tuple[MatchResult, ...] = field(default_factory=tuple)