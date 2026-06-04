---
title: Score your site — Agents First
description: Enter a URL and get an on-the-spot Agents First readiness score (0–100) with a shareable result card. Probes llms.txt, AGENTS.md, MCP card, OpenAPI, OAuth, and markdown negotiation.
image: /og-image.png
author: Joshua Baer
---

# Is your site ready for agents?

Paste a URL. It probes the site the way an agent would — looking for the surfaces an agent uses to discover and call your product (`llms.txt`, `AGENTS.md`, an MCP server card, OpenAPI, OAuth discovery, markdown content negotiation) — and scores it **0–100** against the [Agents First framework](/principles/). You get a shareable result card in a few seconds. No login.

{% include reviewer.html %}

---

## What it checks

- **Discoverability** — does `robots.txt` address AI agents, is there an `/llms.txt`, an `/AGENTS.md`?
- **Content accessibility** — markdown content negotiation, sitemap, a discoverable API catalog.
- **Bot access control** — a deliberate AI policy vs. blanket allow/deny.
- **Agent capabilities** — a published MCP server card, a CLI/SDK, OAuth-with-PKCE discovery.
- **Visibility** — do your docs tell agents how to install your MCP server or use your CLI?

It scores what's live at the URL you give it — so the apex of a big site can score lower than a hand-reviewed deep-dive. That's the point: it's what an agent finds when it lands.

See [example scores](/scores/) or read the [eight principles](/principles/) behind the rubric.
