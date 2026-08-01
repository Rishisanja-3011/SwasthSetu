"""
Result of matching one clinical pattern.
"""

from dataclasses import dataclass

from knowledge_engine.core.enums import MatchStrength

from .evidence import Evidence
from .pattern import Pattern


@dataclass(frozen=True, slots=True)
class MatchResult:
    """
    One matched clinical pattern.
    """

    pattern: Pattern

    evidence: Evidence

    strength: MatchStrength