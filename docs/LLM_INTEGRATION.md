# LLM Integration

How a language model becomes a player in the arena.

## Adapter contract

Every LLM backend implements the same interface (`src/pantheon/adapters/base.py`):

```python
class Adapter(Protocol):
    name: str  # unique id, e.g. "claude-opus-4-7"

    def generate(
        self,
        system: str,
        user: str,
        tool_schemas: list[dict],
        max_tokens: int,
    ) -> AdapterResponse: ...
```

`AdapterResponse` carries the textual reply plus any tool-call requests, token counts, latency, and a cost estimate. Adapters are pure from the arena's perspective: no hidden state, no network calls beyond the provider.

## Three ways to plug in

### A. Subscription-backed CLI (preferred for hobby / solo usage)

Frontier providers ship official CLIs that authenticate with a user's paid consumer account and consume that subscription's quota instead of billing per token.

| Subscription            | Binary     | Adapter                      |
|-------------------------|------------|------------------------------|
| Claude Pro / Max        | `claude`   | `adapters/claude_cli.py`     |
| ChatGPT Plus / Pro      | `codex`    | `adapters/codex_cli.py`      |
| Google AI Pro / Gemini  | `gemini`   | `adapters/gemini_cli.py`     |

Each adapter shells out with `subprocess.run(...)`, captures stdout, and parses the response. Tool calls flow via MCP — all three CLIs speak MCP natively.

Pros: no API budget, legal, trivial to set up.
Cons: rate-limited by consumer plan, no fine-grained control over sampling.

### B. Direct API

For reproducible benchmarking (deterministic seeds, identical temperature, identical rate-limits across providers), use raw APIs via OpenRouter or per-provider SDKs.

Implement `adapters/openrouter.py` once and point it at whichever model.

### C. Local via Ollama / MLX / vLLM

Free, fully reproducible, no external dependency.

`adapters/ollama.py` targets any model pulled with `ollama pull`. Useful for Qwen3-32B, DeepSeek-R1 distills, Llama 3.3, Mistral Small.

## MCP tool bridge

All adapters see the same tool catalog because tools live in the MCP server (layer 2), not in the adapter. The arena runner starts the MCP server once, then each participant connects to it via stdio. The adapter is responsible only for shepherding the model's tool-call intents into actual MCP requests and stitching the results back into the conversation.

This design means adding a new LLM (say a hypothetical "Qwen4-Max") requires ~40 lines of adapter code. No tool logic leaks into the adapter.

## Fairness rules

A round is only valid if all players operate under the same constraints:

- identical system prompt
- identical research brief
- identical MCP tool catalog
- identical `max_tokens`, `tool_budget`, `time_budget`
- identical random seed for any tool that accepts one
- shuffled speaking order per round (no "first-mover" advantage that persists)

The round manifest records these invariants; the scorer rejects a round whose manifest disagrees with the telemetry log.

## Failure modes

Adapters must handle:

- Empty response (retry once, then forfeit turn)
- Provider rate-limit (back off with jitter, configurable ceiling)
- Tool-call loop (hard cap on tool budget)
- Hallucinated tool names (ignore, log a penalty)
- Hallucinated outputs masquerading as tool returns (content hash mismatch → invalidate)

All failure events are logged as first-class telemetry entries, not swallowed.
