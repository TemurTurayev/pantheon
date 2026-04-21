"""Stdlib-only SSE server for local streaming runs.

Run::

    python -m pantheon.stream.server

Publishers push to the module-level ``bus`` instance; every connected
client sees each event. For production, swap this for Starlette/FastAPI;
this module is intentionally dependency-free so demos work out of the box.
"""

from __future__ import annotations

import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from queue import Empty

from pantheon.stream.bus import EventBus
from pantheon.stream.sse import encode_sse


bus = EventBus()


class _Handler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:  # quieter default logs
        return

    def do_GET(self) -> None:  # noqa: N802 — name dictated by BaseHTTPRequestHandler
        if self.path != "/events":
            self.send_response(404)
            self.end_headers()
            return
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

        q = bus.subscribe()
        try:
            while True:
                try:
                    event = q.get(timeout=15)
                except Empty:
                    self.wfile.write(b": keepalive\n\n")
                    self.wfile.flush()
                    continue
                payload = encode_sse(json.dumps(event, sort_keys=True))
                self.wfile.write(payload.encode())
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass
        finally:
            bus.unsubscribe(q)


def serve(host: str = "127.0.0.1", port: int = 8765) -> None:
    httpd = ThreadingHTTPServer((host, port), _Handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    print(f"SSE bus listening on http://{host}:{port}/events", flush=True)


if __name__ == "__main__":
    serve()
    import signal
    signal.pause()
