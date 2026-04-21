"""Research brief data types and composer."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from pantheon.targets import Target


@dataclass(frozen=True, slots=True)
class BriefSection:
    heading: str
    items: tuple[str, ...]

    def to_markdown(self) -> str:
        body = "\n".join(f"- {item}" for item in self.items) or "- (no findings)"
        return f"## {self.heading}\n\n{body}\n"


@dataclass(frozen=True, slots=True)
class Brief:
    target_id: str
    sections: tuple[BriefSection, ...]

    def to_markdown(self) -> str:
        parts = [f"# Research brief — {self.target_id}\n"]
        parts.extend(s.to_markdown() for s in self.sections)
        return "\n".join(parts)


class ResearchAgent(Protocol):
    name: str

    def run(self, target: Target) -> BriefSection: ...


def build_brief(target: Target, agents: list[ResearchAgent]) -> Brief:
    sections = tuple(agent.run(target) for agent in agents)
    return Brief(target_id=target.id, sections=sections)
