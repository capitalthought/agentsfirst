# @capitalthought/create-agents-first

Scaffold an Agents-First project in one command.

```bash
npx @capitalthought/create-agents-first my-project
```

You get an MCP server scaffold built around the 8 implementation principles from [Agents First](https://agentsfirst.dev): Interface First, Contract First, Prep Gates, Typed State, Visible Outputs, Multi-Model Verification, Perspective Dispatch, and Autonomous Recovery.

## Usage

```bash
npx @capitalthought/create-agents-first my-project
cd my-project
npm install
npm run prep         # verify the prep gate passes
npm run dev          # run the MCP server (stdio)
```

Then point Claude Code, Cursor, or Windsurf at `tsx src/server.ts` (dev) or `node dist/server.js` (after `npm run build`). The agent immediately sees `my-project_prep`, `example_create`, and `example_list`.

## What you get

- `src/server.ts` — MCP server with stdio transport (Interface First)
- `AGENTS.md` — usage rules your agent reads before acting (Contract First)
- `src/prep.ts` + `<project>_prep` MCP tool — pre-flight checks (Prep Gates)
- `src/state.ts` — Zod-validated typed state with versioned schema (Typed State)
- `src/recovery.ts` — `withRetry` + `escalate` helpers (Autonomous Recovery)
- `// TODO: ship to Slack/email/task manager` markers in tools (Visible Outputs)
- `package.json`, `tsconfig.json`, `.gitignore`, `env.example.txt` (copy to `.env`), `README.md`

About 250 LOC total. Read it in 5 minutes, ship in another 5.

## The 8 principles

The full thesis: <https://agentsfirst.dev>

Per-principle deep dives: <https://agentsfirst.dev/principles/>

## Publishing

This package publishes to npm via `npm publish --access public` from a granular access token scoped to `@capitalthought` with bypass-2fa enabled. The token lives in 1Password (Capital Factory Employee vault, "npm — NPM_TOKEN (@capitalthought)").

Full flow: see `~/icloud/Claude/ref-npm-publishing.md`. Cliff notes:

1. Bump `version` in `package.json`
2. `npm publish --access public` (token via `~/.npmrc` or `NODE_AUTH_TOKEN` env)
3. Or push a git tag matching `create-agents-first-v*` if a CI publish workflow is wired up

## License

MIT — see `LICENSE`.
