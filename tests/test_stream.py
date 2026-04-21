"""Tests for the in-memory event bus and SSE encoder."""

from __future__ import annotations

from pantheon.stream.bus import EventBus
from pantheon.stream.sse import encode_sse


def test_encode_sse_minimum():
    payload = encode_sse("hello")
    assert payload == "data: hello\n\n"


def test_encode_sse_with_event_and_multiline():
    payload = encode_sse("line 1\nline 2", event="tick", id_="17")
    assert "event: tick\n" in payload
    assert "id: 17\n" in payload
    assert "data: line 1\n" in payload
    assert "data: line 2\n" in payload
    assert payload.endswith("\n\n")


def test_event_bus_subscriber_receives_events():
    bus = EventBus()
    q = bus.subscribe()
    bus.publish({"text": "a"})
    bus.publish({"text": "b"})
    assert q.get_nowait() == {"text": "a"}
    assert q.get_nowait() == {"text": "b"}


def test_event_bus_isolated_subscribers():
    bus = EventBus()
    a = bus.subscribe()
    bus.publish({"n": 1})
    b = bus.subscribe()  # b joins after the first event
    bus.publish({"n": 2})
    assert a.qsize() == 2
    assert b.qsize() == 1


def test_event_bus_unsubscribe_drops_queue():
    bus = EventBus()
    q = bus.subscribe()
    bus.unsubscribe(q)
    bus.publish({"after": "unsubscribe"})
    assert q.empty()
