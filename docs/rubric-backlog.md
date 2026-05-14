# Rubric Backlog

Tracked changes to consider for the next rubric version. **Do not apply** until the spec change being tracked has actually shipped a release tag — `main` branch drift is not enough.

---

## Per-request `clientCapabilities` (MCP draft, observed 2026-05-14)

**What changed:** MCP draft `schema.ts` gained a per-request capability negotiation contract. The new structure inside `_meta` (now required, not optional) is:

- `io.modelcontextprotocol/protocolVersion: string` — must match the `MCP-Protocol-Version` HTTP header; mismatch returns `400 Bad Request` with `UnsupportedProtocolVersionError`.
- `io.modelcontextprotocol/clientInfo: Implementation` — `name` and `version` required.
- `io.modelcontextprotocol/clientCapabilities: ClientCapabilities` — declared per-request, not at initialization. **Servers MUST NOT infer capabilities from prior requests.**
- `io.modelcontextprotocol/logLevel?: LoggingLevel` — opt-in per request; replaces `logging/setLevel` RPC.

**New error codes:**
- `MISSING_REQUIRED_CLIENT_CAPABILITY = -32003` — server requires a capability the client didn't declare.
- `UnsupportedProtocolVersionError` (HTTP 400 for the HTTP transport).

**Observed:** [`modelcontextprotocol/modelcontextprotocol@main`](https://github.com/modelcontextprotocol/modelcontextprotocol) `schema/draft/schema.ts`, diff captured between cached 2026-05-08 (96,590 bytes) and fresh 2026-05-14 (97,010 bytes).

**Status:** **Draft only** — no spec release tag. Latest release is still `2025-11-25`. The architectural shift (capabilities are per-request, not per-session) is meaningful but premature to score.

**Proposed rubric additions when this lands as a release:**

1. **Interface First +2** — Server returns `MISSING_REQUIRED_CLIENT_CAPABILITY` when client lacks a needed capability, instead of returning a generic error or crashing. (Detection: send a request with empty `clientCapabilities`; check error code.)
2. **Interface First +2** — Server validates `io.modelcontextprotocol/protocolVersion` against the `MCP-Protocol-Version` header and returns `UnsupportedProtocolVersionError` (HTTP 400) on mismatch.
3. **Interface First −2 (penalty)** — Server reads capabilities from initialization state instead of per-request `_meta`. (Detection: change capabilities mid-session; if the server's behavior doesn't update, it's caching from init.)

**Trigger to apply:** First spec release tag that includes the new `_meta` structure (likely `2026-XX-XX`). At that point, bump rubric to v0.4.0 and add the three checks to `~/Xcode/agentsfirst/tools/agentsfirst-mcp/src/score.ts` codebase scoring.

**Tracking source:** `agentsfirst-check` skill diffs the schema each run (`spec_repos_to_diff[1]`). Promotion to rubric happens here, not automatically.
