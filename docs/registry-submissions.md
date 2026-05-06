# MCP registry submissions — `@capitalthought/agentsfirst-mcp`

Status as of 2026-05-05:

| Registry | Status | Notes |
|---|---|---|
| **npm** | ✅ Live | `@capitalthought/agentsfirst-mcp@0.1.1` + `@capitalthought/create-agents-first@0.1.0` |
| **awesome-mcp-servers** (punkpeye) | 🟡 PR open | https://github.com/punkpeye/awesome-mcp-servers/pull/5936 (used the maintainer's fast-track `🤖🤖🤖` marker) |
| **mcp.so** | ⏳ Awaiting Josh | Submission form is bot-protected (Cloudflare turnstile / 403). Browser session required. Draft text below. |
| **Smithery.ai** | ⏳ Awaiting Josh | Same — needs browser + GitHub OAuth signup. Draft text below. |
| **glama.ai/mcp/servers** | ⏳ Awaiting Josh | Auto-discovers from awesome-mcp-servers PR; landing the punkpeye PR usually triggers a glama listing within ~1 day. Verify after PR merges. |

---

## mcp.so

**Submission URL:** https://mcp.so/submit (or check the navbar on https://mcp.so for "Submit Server" / "Add Server")

**If the form asks for it:**

| Field | Value |
|---|---|
| Server name | `agentsfirst-mcp` |
| Display name | `Agents First` |
| Description (short, ~80 chars) | `Score any URL or codebase against the Agents First framework — 8 principles, 7 anti-patterns, 0–4 adoption levels.` |
| Description (long) | See block below |
| GitHub URL | `https://github.com/capitalthought/agentsfirst` |
| npm package | `@capitalthought/agentsfirst-mcp` |
| Hosted endpoint | `https://agentsfirst.dev/mcp` |
| Tags / categories | `developer-tools`, `code-quality`, `agents`, `framework`, `audit`, `score` |
| License | `MIT` |
| Author | `Joshua Baer` |
| Author URL | `https://agentsfirst.dev` |

**Long description block** (paste into the long-description textarea):

```
MCP server for measuring agent-readiness — both for websites (do agents see your product at all?) and for codebases (does your product use the 8 implementation principles or commit one of the 7 anti-patterns?).

Five tools:
- `agentsfirst_prep` — Prep Gate. Run before scoring; verifies the rubric is loaded and principles are at the expected version.
- `score_website` — { url } → score (0–100), level (0–4), per-dimension breakdown, anti-patterns flagged, top 3 highest-leverage moves.
- `score_codebase` — { path } → same shape, scored against the 8 principles. Local-only (Workers can't read filesystems); use the npx variant.
- `get_principle` — { slug } → canonical text of one of Interface First, Contract First, Prep Gates, Typed State, Visible Outputs, Multi-Model Verification, Perspective Dispatch, Autonomous Recovery.
- `get_anti_pattern` — { slug } → canonical definition of Lazy Wrapper, Invisible Product, Agents Without Rules, Single-Model Trust, Slow Chatbot, Ship and Forget, God Server.

Two ways to use it:
1. Hosted (4 tools, no codebase scoring): add `https://agentsfirst.dev/mcp` as a remote MCP server.
2. Local (all 5 tools): `npx -y @capitalthought/agentsfirst-mcp`.

Read-only by design — never writes anywhere; only opens HTTP connections to URLs the caller named.

Read the framework: https://agentsfirst.dev
```

**If the form has Discord/Telegram alternative:** they accept submissions via [@chatmcp on X](https://x.com/chatmcp) or their Discord (https://discord.gg/RsYPRrnyqg). DM message:

> Hi @chatmcp — submitting a new MCP server for the directory: agentsfirst-mcp. Hosted at https://agentsfirst.dev/mcp · npm: @capitalthought/agentsfirst-mcp · GitHub: https://github.com/capitalthought/agentsfirst. It scores any URL or codebase against the Agents First framework. Five tools, read-only, MIT license.

---

## Smithery.ai

**Submission URL:** https://smithery.ai (sign in with GitHub, then "Add Server" / "Submit Server" in the dashboard)

**Smithery typically auto-discovers via:**
- npm package metadata (already published)
- A `smithery.yaml` file at the repo root (we don't have one — see optional add below)
- GitHub repo metadata + the README

**Submission flow:**
1. Sign in with GitHub at https://smithery.ai (use the `joshuabaer` account)
2. Click "Submit a server" or visit https://smithery.ai/new
3. Either provide the GitHub repo URL (`https://github.com/capitalthought/agentsfirst`, then point to the `tools/agentsfirst-mcp` subdir) or the npm package name (`@capitalthought/agentsfirst-mcp`)
4. Smithery will auto-fetch metadata; verify the description + connection method are correct
5. Approve / publish

**Optional but recommended:** add a `smithery.yaml` to `tools/agentsfirst-mcp/` to control the listing precisely. Format:

```yaml
# tools/agentsfirst-mcp/smithery.yaml
startCommand:
  type: stdio
  command: npx
  args:
    - -y
    - "@capitalthought/agentsfirst-mcp"
description: |
  Score any URL or codebase against the Agents First framework — 8 implementation principles + 7 anti-patterns + 0–4 adoption levels.
configSchema:
  type: object
  properties: {}
  required: []
```

(Smithery's CLI also supports `npx @smithery/cli@latest install @capitalthought/agentsfirst-mcp` once listed.)

---

## After landing both

1. Re-check the npm registry shows the package: `npm view @capitalthought/agentsfirst-mcp` (already verified)
2. Visit each registry's listing once live to verify metadata:
   - https://mcp.so/server/agentsfirst-mcp (or whatever slug they assign)
   - https://smithery.ai/server/@capitalthought/agentsfirst-mcp
   - https://glama.ai/mcp/servers/capitalthought/agentsfirst (after punkpeye PR merges)
3. Add the listing URLs to `_includes/head-custom.html` JSON-LD `mainEntityOfPage` so structured data surfaces them as canonical references for the Agents First scorer artifact.
