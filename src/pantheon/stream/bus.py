"""Tiny thread-safe fan-out event bus.

Each subscriber gets an independent Queue. Publishers drop events into every
subscriber's queue. Used by the SSE endpoint and the round orchestrator to
decouple production from consumption.
"""

from __future__ import annotations

from queue import Queue
from threading import Lock
from typing import Any


class EventBus:
    def __init__(self) -> None:
        self._subscribers: list[Queue[dict[str, Any]]] = []
        self._lock = Lock()

    def subscribe(self) -> Queue[dict[str, Any]]:
        q: Queue[dict[str, Any]] = Queue()
        with self._lock:
            self._subscribers.append(q)
        return q

    def unsubscribe(self, q: Queue[dict[str, Any]]) -> None:
        with self._lock:
            if q in self._subscribers:
                self._subscribers.remove(q)

    def publish(self, event: dict[str, Any]) -> None:
        with self._lock:
            targets = list(self._subscribers)
        for q in targets:
            q.put(event)
