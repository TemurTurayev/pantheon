"""Tiny Server-Sent Events encoder.

No framework dependency. Works with anything that can ``yield`` bytes
down an HTTP response body (WSGI, ASGI, or the stdlib http.server).
"""

from __future__ import annotations


def encode_sse(data: str, *, event: str | None = None, id_: str | None = None) -> str:
    parts: list[str] = []
    if event:
        parts.append(f"event: {event}")
    if id_:
        parts.append(f"id: {id_}")
    for line in data.splitlines() or [""]:
        parts.append(f"data: {line}")
    parts.append("")
    parts.append("")
    return "\n".join(parts)
